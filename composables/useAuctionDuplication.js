import dayjs from 'dayjs'
import _ from 'lodash'
import slugify from 'slugify'

/**
 * Composable pour gérer la duplication d'enchères
 * Extrait la logique de duplication du builder.vue pour la rendre réutilisable
 */
export const useAuctionDuplication = () => {
  const supabase = useSupabaseClient()

  /**
   * Charger les données d'une enchère et de son groupe
   * @param {number} auctionId - ID de l'enchère à charger
   * @returns {Object} { auctions, groupId, timingRule }
   */
  async function loadAuctionData(auctionId) {
    try {
      // Charger l'enchère pour obtenir le group ID
      const { data: routerAuction, error: auctionError } = await supabase
        .from('auctions')
        .select('auctions_group_settings_id')
        .eq('id', auctionId)
        .single()

      if (auctionError) throw auctionError

      const groupId = routerAuction.auctions_group_settings_id

      // Charger les paramètres du groupe
      const { data: auctionsTiming, error: timingError } = await supabase
        .from('auctions_group_settings')
        .select('timing_rule')
        .eq('id', groupId)
        .single()

      if (timingError) throw timingError

      const timingRule = auctionsTiming?.timing_rule || 'serial'

      // Charger toutes les enchères du groupe
      const { data: auctions, error: auctionsError } = await supabase
        .from('auctions')
        .select('*, auctions_sellers(*), supplies(*, supplies_sellers(*)) ')
        .eq('auctions_group_settings_id', groupId)
        .order('lot_number', { ascending: true })
        .order('index', { foreignTable: 'supplies', ascending: true })

      if (auctionsError) throw auctionsError

      return { auctions, groupId, timingRule }
    } catch (error) {
      console.error('Error loading auction data:', error)
      throw new Error("Erreur lors du chargement de l'enchère")
    }
  }

  /**
   * Formater les handicaps fixes (additive ou multiplicative)
   * @param {Object} item - Item contenant les données de handicap
   * @param {string} email - Email du fournisseur
   * @param {string} type - Type de handicap ('additive' ou 'multiplicative')
   * @returns {number} Valeur formatée du handicap
   */
  function formatFixedHandicap(item, email, type) {
    const handiType = item[`handi_type_${email}`]
    const handiValue = item[`handi_value_${email}`]

    if (type === 'additive') {
      return handiType === '+' || handiType === '-' ? parseInt(handiType + handiValue) : 0
    } else if (type === 'multiplicative') {
      return handiType === '*' ? parseFloat(handiValue) : 1
    }

    return 0
  }

  /**
   * Convertir les enchères en format lots
   * @param {Array} auctions - Liste des enchères à convertir
   * @param {number} groupId - ID du groupe d'enchères
   * @returns {Promise<Array>} Liste des lots formatés
   */
  async function convertAuctionsToLots(auctions, groupId) {
    return Promise.all(
      auctions.map(async (auctionData) => {
        // Charger les handicaps
        const { data: auctionHandicaps } = await supabase
          .from('auctions_handicaps')
          .select('*')
          .eq('auction_id', auctionData.id)

        const formatedHandicaps = (auctionHandicaps || []).map((handicap) => ({
          name: handicap.group_name,
          option: handicap.option_name,
          supplier: handicap.seller_email,
          amount: handicap.amount
        }))

        // Charger les documents commerciaux
        const { data: auctionDocs } = await supabase.storage
          .from('commercials_docs')
          .list(`${groupId}/${auctionData.id}/`)

        const commercials_docs = await Promise.all(
          (auctionDocs || []).map(async (file) => {
            const { data } = await supabase.storage
              .from('commercials_docs')
              .getPublicUrl(`${groupId}/${auctionData.id}/${file.name}`)
            return {
              name: file.name,
              url: data.publicUrl,
              id: file.id,
              auction_id: auctionData.id,
              groupId: groupId
            }
          })
        )

        // Vérifier si des handicaps fixes existent
        const got_fixed_handicap = auctionData.supplies.some((supply) =>
          supply.supplies_sellers.some(
            (seller) => seller.additive !== 0 || seller.multiplicative !== 1
          )
        )

        // Formater les informations du lot
        const formattedLot = {
          id: auctionData.id,
          name: auctionData.lot_name,
          max_rank_displayed: auctionData.max_rank_displayed,
          duration: auctionData.duration,
          baseline: auctionData.baseline,
          multiplier: auctionData.multiplier,
          rank_trigger: auctionData.rank_trigger,
          min_bid_decr: auctionData.min_bid_decr,
          min_bid_decr_type: auctionData.min_bid_decr_type,
          max_bid_decr: auctionData.max_bid_decr,
          max_bid_decr_type: auctionData.max_bid_decr_type,
          overtime_range: auctionData.overtime_range,
          awarding_principles: auctionData.awarding_principles,
          commercials_terms: auctionData.commercials_terms,
          commercials_docs,
          general_terms: auctionData.general_terms,
          dutch_prebid_enabled: auctionData.dutch_prebid_enabled,
          rank_per_line_item: auctionData.rank_per_line_item || false,
          suppliers: auctionData.auctions_sellers
            .filter((seller) => seller.auction_id === auctionData.id)
            .map((e) => ({ email: e.seller_email })),
          suppliersTimePerRound: auctionData.auctions_sellers
            .filter((seller) => seller.auction_id === auctionData.id)
            .map((e) => ({ email: e.seller_email, time_per_round: e.time_per_round })),
          got_fixed_handicap: got_fixed_handicap,
          show_fixed_handicap_calculations: false,
          got_dynamic_handicap: formatedHandicaps.length,
          handicaps: formatedHandicaps || []
        }

        // Formater les items (lignes d'approvisionnement)
        const items = auctionData.supplies.map((supply, i) => {
          const suppliersData = formattedLot.suppliers.map((seller) => {
            const findSupplySeller = supply.supplies_sellers.find(
              (e) => e.seller_email === seller.email
            )

            let mult = {}
            if (findSupplySeller.multiplier) {
              mult = { [`mult_${seller.email}`]: findSupplySeller.multiplier }
            }

            let fixedHandicap = {}
            const additive = findSupplySeller.additive
            const multiplicative = findSupplySeller.multiplicative

            if (additive !== null && additive !== 0) {
              fixedHandicap = {
                [`handi_type_${seller.email}`]: additive > 0 ? '+' : '-',
                [`handi_value_${seller.email}`]: Math.abs(additive)
              }
            } else if (multiplicative !== null && multiplicative !== 1) {
              fixedHandicap = {
                [`handi_type_${seller.email}`]: '*',
                [`handi_value_${seller.email}`]: multiplicative
              }
            } else {
              fixedHandicap = {
                [`handi_type_${seller.email}`]: '+',
                [`handi_value_${seller.email}`]: 0
              }
            }

            return { [seller.email]: findSupplySeller.ceiling, ...mult, ...fixedHandicap }
          })

          const flatSuppliersData = suppliersData.reduce((r, c) => Object.assign(r, c), {})

          return {
            ...flatSuppliersData,
            id: supply.id,
            line_item: supply.name,
            unit: supply.unit,
            quantity: supply.quantity,
            index: i
          }
        })

        return {
          ...formattedLot,
          items
        }
      })
    )
  }

  /**
   * Formater les lots pour la soumission
   * @param {Array} lots - Liste des lots
   * @param {Object} basics - Données de base de l'enchère
   * @param {string} timingRule - Règle de timing ('serial' ou 'parallel')
   * @param {string} originalStartDate - Date de début originale de l'enchère
   * @returns {Array} Lots formatés pour la soumission
   */
  function formatLotsForSubmission(lots, basics, timingRule, originalStartDate) {
    const startDate = dayjs(originalStartDate)
      .set('hour', basics.time.split(':')[0])
      .set('minute', basics.time.split(':')[1])
      .set('second', 0)
      .set('millisecond', 0)

    return lots.map((lot, i) => {
      const suppliers_prices = lot.suppliers.map((supplier) => {
        const lines_items = lot.items.map((lineItem, i) => {
          return {
            id: lineItem.id,
            line_item: lineItem.line_item,
            quantity: lineItem.quantity,
            unit: lineItem.unit,
            ceiling: lineItem[supplier.email],
            multiplier: lineItem[`mult_${supplier.email}`],
            additive: +formatFixedHandicap(lineItem, supplier.email, 'additive'),
            multiplicative: +formatFixedHandicap(lineItem, supplier.email, 'multiplicative'),
            index: i
          }
        })

        return { supplier, lines_items }
      })

      let lotStart = startDate.add(0, 'm')

      if (timingRule === 'serial') {
        let cumulativeDuration = 0
        if (i > 0) {
          cumulativeDuration = lots.slice(0, i).reduce((total, prevLot) => {
            return total + +prevLot.duration
          }, 0)
        }
        lotStart = startDate.add(cumulativeDuration, 'm')
      }

      return {
        ...lot,
        start_at: lotStart.toISOString(),
        end_at: lotStart.add(+lot.duration, 'm').toISOString(),
        lot_number: i + 1,
        suppliers_prices,
        rank_per_line_item: lot.rank_per_line_item || false
      }
    })
  }

  /**
   * Uploader les documents commerciaux vers le nouveau groupe
   * @param {number} groupId - ID du nouveau groupe
   * @param {Array} auctionIds - Liste des IDs des nouvelles enchères
   * @param {Array} lots - Liste des lots avec leurs documents
   */
  async function uploadCommercialDocs(groupId, auctionIds, lots) {
    try {
      for (let i = 0; i < lots.length; i++) {
        const lot = lots[i]
        if (lot.commercials_docs && lot.commercials_docs.length > 0) {
          for (let j = 0; j < lot.commercials_docs.length; j++) {
            const commercial_doc = lot.commercials_docs[j]
            const filePath = `${groupId}/${auctionIds[i]}/${slugify(commercial_doc.name)}`

            // Vérifier si le fichier existe déjà
            const { data: existingFile, error: fileError } = await supabase.storage
              .from('commercials_docs')
              .list(`${groupId}/${auctionIds[i]}/`)

            const fileExists =
              existingFile && existingFile.find((f) => f.name === slugify(commercial_doc.name))

            if (fileError) {
              console.log('Error checking file existence:', fileError)
            }

            // Upload seulement si le fichier n'existe pas
            if (!fileExists) {
              const { data, error } = await supabase.storage
                .from('commercials_docs')
                .upload(filePath, commercial_doc, {
                  headers: {
                    'x-upsert': 'true'
                  }
                })

              if (error) {
                console.error('Error uploading file:', error)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error uploading commercial docs:', error)
      // Non-bloquant : ne pas throw l'erreur
    }
  }

  /**
   * Créer une duplication "flat" (simple) de l'enchère
   * @param {Object} auctionData - Données de l'enchère à dupliquer
   * @param {number} groupId - ID du groupe original
   * @param {string} timingRule - Règle de timing
   * @param {Array} lots - Liste des lots
   * @returns {Promise<Object>} { groupId, auctionIds, success }
   */
  async function createFlatDuplicate(auctionData, groupId, timingRule, lots) {
    try {
      // Créer un nouveau groupe
      const { data: newGroups, error: groupError } = await supabase
        .from('auctions_group_settings')
        .insert({
          name: 'Copy of ' + auctionData.name,
          description: auctionData.description,
          buyer_id: auctionData.buyer_id,
          timing_rule: timingRule
        })
        .select()

      if (groupError) throw groupError

      const newGroupId = newGroups[0].id

      // Formater les lots pour la soumission
      const formattedLots = formatLotsForSubmission(
        lots,
        auctionData,
        timingRule,
        auctionData.start_at
      )

      // Supprimer tous les IDs et ajouter "Copy of" au nom de chaque lot
      formattedLots.forEach((lot) => {
        delete lot.id
        // Ajouter "Copy of" au nom du lot
        if (lot.name) {
          lot.name = 'Copy of ' + lot.name
        }
        lot.items.forEach((item) => {
          delete item.id
        })
        lot.suppliers_prices.forEach((prices) => {
          prices.lines_items.forEach((line) => {
            delete line.id
          })
        })
      })

      const startDate = dayjs(auctionData.start_at)
        .set('hour', auctionData.time.split(':')[0])
        .set('minute', auctionData.time.split(':')[1])
        .set('second', 0)
        .set('millisecond', 0)

      const auction = {
        group_id: newGroupId,
        name: 'Copy of ' + auctionData.name,
        description: auctionData.description,
        prefered: auctionData.prefered,
        max_rank_displayed: auctionData.max_rank_displayed,
        currency: auctionData.currency,
        timezone: auctionData.timezone,
        type: auctionData.type,
        test: auctionData.test,
        company_id: auctionData.company_id,
        buyer_id: auctionData.buyer_id,
        log_visibility: auctionData.log_visibility,
        usage: auctionData.usage,
        published: false,
        start_at: startDate.toISOString(),
        end_at: startDate.add(parseInt(formattedLots[0].duration), 'minute').toISOString(),
        awarding_principles: formattedLots[0].awarding_principles,
        commercials_terms: formattedLots[0].commercials_terms,
        general_terms: formattedLots[0].general_terms,
        lots: formattedLots
      }

      // Créer l'enchère via le RPC
      const { data: upsertedAuctionId, error: rpcError } = await supabase.rpc(
        'create_auction_v5_2',
        {
          auction: auction
        }
      )

      if (rpcError) throw rpcError

      // Récupérer tous les IDs des enchères créées
      const { data: auctionsArray, error: fetchError } = await supabase
        .from('auctions')
        .select('id')
        .eq('auctions_group_settings_id', newGroupId)
        .order('lot_number', { ascending: true })

      if (fetchError) throw fetchError

      const auctionIds = auctionsArray.map((a) => a.id)

      // Uploader les documents commerciaux (non-bloquant)
      if (lots.some((lot) => lot.commercials_docs && lot.commercials_docs.length > 0)) {
        await uploadCommercialDocs(newGroupId, auctionIds, lots)
      }

      return {
        groupId: newGroupId,
        auctionIds: auctionIds,
        success: true
      }
    } catch (error) {
      console.error('Error creating flat duplicate:', error)
      throw new Error('Échec de la création de la duplication simple')
    }
  }

  /**
   * Créer des duplications "training" (une enchère par fournisseur)
   * @param {Object} auctionData - Données de l'enchère à dupliquer
   * @param {number} groupId - ID du groupe original
   * @param {string} timingRule - Règle de timing
   * @param {Array} lots - Liste des lots
   * @returns {Promise<Object>} { groupId: null, auctionIds: [...], success }
   */
  async function createTrainingDuplicates(auctionData, groupId, timingRule, lots) {
    try {
      // Formater les lots pour la soumission
      const formattedLots = formatLotsForSubmission(
        lots,
        auctionData,
        timingRule,
        auctionData.start_at
      )

      // Supprimer tous les IDs
      formattedLots.forEach((lot) => {
        delete lot.id
        lot.items.forEach((item) => {
          delete item.id
        })
        lot.suppliers_prices.forEach((prices) => {
          prices.lines_items.forEach((line) => {
            delete line.id
          })
        })
      })

      const startDate = dayjs(auctionData.start_at)
        .set('hour', auctionData.time.split(':')[0])
        .set('minute', auctionData.time.split(':')[1])
        .set('second', 0)
        .set('millisecond', 0)

      const baseAuction = {
        name: auctionData.name,
        description: auctionData.description,
        prefered: auctionData.prefered,
        max_rank_displayed: auctionData.max_rank_displayed,
        currency: auctionData.currency,
        timezone: auctionData.timezone,
        type: auctionData.type,
        test: auctionData.test,
        company_id: auctionData.company_id,
        buyer_id: auctionData.buyer_id,
        log_visibility: auctionData.log_visibility,
        usage: 'training',
        published: false,
        start_at: startDate.toISOString(),
        end_at: startDate.add(parseInt(formattedLots[0].duration), 'minute').toISOString(),
        awarding_principles: formattedLots[0].awarding_principles,
        commercials_terms: formattedLots[0].commercials_terms,
        general_terms: formattedLots[0].general_terms,
        lots: formattedLots
      }

      // Obtenir la liste complète des fournisseurs
      const fullSuppliersList = _.uniq(
        baseAuction.lots.map((lot) => lot.suppliers.map((e) => e.email)).flat()
      )

      // Identifier la présence de chaque fournisseur dans les lots
      const supplierPresenceInLots = fullSuppliersList.map((email) => {
        return {
          email,
          lots: baseAuction.lots
            .filter((lot) => lot.suppliers.find((e) => e.email === email))
            .map((lot) => lot.name)
        }
      })

      // Créer une enchère training pour chaque fournisseur
      const results = await Promise.all(
        supplierPresenceInLots.map(async (supplier) => {
          // Filtrer les lots où ce fournisseur est présent
          const lotsWithSupplier = baseAuction.lots.filter((lot) =>
            lot.suppliers.find((e) => e.email === supplier.email)
          )

          // Trouver le prochain index de placeholder disponible
          const existingPlaceholders = fullSuppliersList
            .filter((email) => /^supplier\+\d+@crown\.ovh$/.test(email))
            .map((email) => parseInt(email.match(/\d+/)[0], 10))

          const nextPlaceholderIndex =
            existingPlaceholders.length > 0 ? Math.max(...existingPlaceholders) + 1 : 1

          // Remplacer les autres fournisseurs par des placeholders
          const newLots = lotsWithSupplier.map((lot) => {
            const sortedLotSuppliers = lot.suppliers.sort((a) =>
              a.email === supplier.email ? -1 : 1
            )
            let placeholderCounter = nextPlaceholderIndex

            const suppliers = sortedLotSuppliers.map((e) => {
              if (e.email === supplier.email || /^supplier\+\d+@crown\.ovh$/.test(e.email)) {
                return e
              }
              const placeholder = { email: `supplier+${placeholderCounter}@crown.ovh` }
              placeholderCounter++
              return placeholder
            })

            const sortedSuppliersPrices = lot.suppliers_prices.sort((a) =>
              a.supplier.email === supplier.email ? -1 : 1
            )

            let pricePlaceholderCounter = nextPlaceholderIndex

            const suppliers_prices = sortedSuppliersPrices.map((e) => {
              if (
                e.supplier.email === supplier.email ||
                /^supplier\+\d+@crown\.ovh$/.test(e.supplier.email)
              ) {
                return e
              }
              const pricePlaceholder = {
                supplier: { email: `supplier+${pricePlaceholderCounter}@crown.ovh` },
                lines_items: e.lines_items
              }
              pricePlaceholderCounter++
              return pricePlaceholder
            })

            return {
              ...lot,
              name: `${lot.name} Training ${supplier.email}`, // Ajouter Training au nom du lot
              suppliers,
              suppliers_prices
            }
          })

          // Créer un nouveau groupe pour ce fournisseur
          const { data: newGroups, error: groupError } = await supabase
            .from('auctions_group_settings')
            .insert({
              name: `${baseAuction.name} Training ${supplier.email}`,
              description: baseAuction.description,
              buyer_id: baseAuction.buyer_id,
              timing_rule: timingRule
            })
            .select()

          if (groupError) throw groupError

          const trainingAuction = {
            ...baseAuction,
            group_id: newGroups[0].id,
            name: `${baseAuction.name} - Training ${supplier.email}`,
            lots: newLots
          }

          // Créer l'enchère via le RPC
          const { data: upsertedAuctionId, error: rpcError } = await supabase.rpc(
            'create_auction_v5_2',
            { auction: trainingAuction }
          )

          if (rpcError) throw rpcError

          // Récupérer les IDs des enchères créées
          const { data: auctionsArray, error: fetchError } = await supabase
            .from('auctions')
            .select('id')
            .eq('auctions_group_settings_id', newGroups[0].id)
            .order('lot_number', { ascending: true })

          if (fetchError) throw fetchError

          const auctionIds = auctionsArray.map((a) => a.id)

          // Uploader les documents commerciaux (non-bloquant)
          if (lots.some((lot) => lot.commercials_docs && lot.commercials_docs.length > 0)) {
            await uploadCommercialDocs(newGroups[0].id, auctionIds, lots)
          }

          return {
            groupId: newGroups[0].id,
            auctionIds: auctionIds
          }
        })
      )

      // Collecter tous les IDs d'enchères créées
      const allAuctionIds = results.flatMap((r) => r.auctionIds)

      return {
        groupId: null, // Pas de groupId unique pour training (plusieurs groupes)
        auctionIds: allAuctionIds,
        success: true
      }
    } catch (error) {
      console.error('Error creating training duplicates:', error)
      throw new Error('Échec de la création des duplications training')
    }
  }

  /**
   * Fonction principale : dupliquer une enchère
   * @param {number} auctionId - ID de l'enchère à dupliquer
   * @param {string} duplicationType - Type de duplication ('flat' ou 'training')
   * @returns {Promise<Object>} { groupId, auctionIds, success }
   */
  async function duplicateAuction(auctionId, duplicationType) {
    try {
      // 1. Charger les données de l'enchère
      const { auctions, groupId, timingRule } = await loadAuctionData(auctionId)

      if (!auctions || auctions.length === 0) {
        throw new Error("L'enchère n'existe plus")
      }

      const auctionData = auctions[0]

      // 2. Convertir les enchères en lots
      const lots = await convertAuctionsToLots(auctions, groupId)

      // Préparer les données de base pour la duplication
      const basics = {
        name: auctionData.lot_name, // Fixed: use lot_name instead of name
        description: auctionData.description,
        prefered: auctionData.auctions_sellers.find((seller) => seller.time_per_round),
        max_rank_displayed: auctionData.max_rank_displayed,
        time: dayjs(auctionData.start_at).format('HH:mm'),
        currency: auctionData.currency,
        timezone: auctionData.timezone,
        type: auctionData.type,
        test: auctionData.test,
        company_id: auctionData.company_id,
        buyer_id: auctionData.buyer_id,
        log_visibility: auctionData.log_visibility,
        usage: auctionData.usage ?? 'training',
        published: false
      }

      // 3. Créer la duplication selon le type
      if (duplicationType === 'flat') {
        // Ajouter la date de début originale aux basics
        basics.start_at = auctionData.start_at
        return await createFlatDuplicate(basics, groupId, timingRule, lots)
      } else if (duplicationType === 'training') {
        // Ajouter la date de début originale aux basics
        basics.start_at = auctionData.start_at
        return await createTrainingDuplicates(basics, groupId, timingRule, lots)
      } else {
        throw new Error('Type de duplication invalide')
      }
    } catch (error) {
      console.error('Error in duplicateAuction:', error)
      throw error
    }
  }

  return {
    duplicateAuction,
    loadAuctionData,
    convertAuctionsToLots,
    formatFixedHandicap,
    createFlatDuplicate,
    createTrainingDuplicates,
    uploadCommercialDocs
  }
}
