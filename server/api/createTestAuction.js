import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
// defaultAuctions
import englishAuction from '../../scripts/defaultAuctions/test/reverse-defaultAuction.json'
import dutchAuction from '../../scripts/defaultAuctions/test/dutch-defaultAuction.json'
import englishMultiAuction from '../../scripts/defaultAuctions/test/reverse-multi-defaultAuction.json'
import dutchMultiAuction from '../../scripts/defaultAuctions/test/dutch-multi-defaultAuction.json'
import dutchMultiNoPrebidAuction from '../../scripts/defaultAuctions/test/dutch-multi-noprebid-defaultAuction.json'

import japaneseMultiAuction from '../../scripts/defaultAuctions/test/japanese-multi-defaultAuction.json'
import japaneseMultiNoPrebidAuction from '../../scripts/defaultAuctions/test/japanese-multi-noprebid-defaultAuction.json'
import japaneseAuction from '../../scripts/defaultAuctions/test/japanese-defaultAuction.json'

// import supabase from './v1/utils/supabase'

// Masterclass
import englishMasterclassAuction from '../../scripts/defaultAuctions/masterclass/reverse-defaultAuction.json'

dayjs.extend(utc)
// #TODO Dutch et japanese à créer si demandé

export default defineEventHandler(async (event) => {
  // event from front =  const dynamicData = {
  //   date: dayjs().add(1, 'day'),
  //   time: dayjs().format('HH:mm'),
  //   company_id: profile.value?.company_id,
  //   buyer_id: user.value?.id,
  //   start_at: dayjs().add(1, 'day').format(),
  //   end_at: dayjs().add(2, 'day').format(),
  //   auctionType: auctionType.value,
  //   isMultilot: isMultilot.value,
  //   isPrebid: isPrebid.value,
  //   isMasterclass: createType.value === 'masterclass',
  //   auctionTiming: auctionTiming.value,
  //   maxRankDisplayed: maxRankDisplayed.value
  // }
  let auction = {}
  try {
    const body = await readBody(event)
    console.log('body:', body)

    if (body.isMasterclass) {
      switch (body.auctionType) {
        case 'reverse':
          auction = englishMasterclassAuction.auction
          break
        case 'dutch':
          auction = englishMasterclassAuction.auction // #TODO
          break
        case 'japanese':
          auction = englishMasterclassAuction.auction // #TODO
          break
        default:
          auction = englishAuction.auction
          break
      }
    } else {
      if (body.isMultilot) {
        switch (body.auctionType) {
          case 'reverse':
            auction = englishMultiAuction.auction
            break
          case 'dutch':
            if (!body.isPrebid) {
              console.log('!!!!!non prebid!!!!!')
              auction = dutchMultiNoPrebidAuction.auction
            } else {
              auction = dutchMultiAuction.auction
            }
            break
          case 'japanese':
            if (!body.isPrebid) {
              auction = japaneseMultiNoPrebidAuction.auction
            } else {
              auction = japaneseMultiAuction.auction
            }
            break
          default:
            auction = englishAuction.auction
            break
        }
      } else {
        switch (body.auctionType) {
          case 'reverse':
            auction = englishAuction.auction
            break
          case 'dutch':
            auction = dutchAuction.auction
            body.isPrebid
              ? (auction.lots[0].dutch_prebid_enabled = true)
              : (auction.lots[0].dutch_prebid_enabled = false)

            break
          case 'japanese':
            auction = japaneseAuction.auction
            body.isPrebid
              ? (auction.lots[0].dutch_prebid_enabled = true)
              : (auction.lots[0].dutch_prebid_enabled = false)
            break
          default:
            auction = englishAuction.auction
            break
        }
      }
    }

    const startDate = dayjs(body.date)
      .set('hour', body.time.split(':')[0])
      .set('minute', body.time.split(':')[1])
      .set('second', 0)
      .set('millisecond', 0)
    console.log('startDate:', startDate.format())
    const end_at = startDate.add(parseInt(auction.lots[0].duration), 'minute').format()

    auction.date = body.date
    auction.time = body.time
    auction.company_id = body.company_id
    auction.buyer_id = body.buyer_id
    auction.start_at = startDate.utc().format()
    auction.end_at = end_at

    auction.name = `Test ${body.auctionType}${body.isMultilot ? `- Multilot ${body.auctionTiming}` : ''} - ${dayjs(startDate).format('DD/MM/YYYY')} ${body.time}`
    auction.name = body.isMasterclass
      ? `MAI YELLOW - eAuction Fruits - ${dayjs(startDate).format('DD/MM/YYYY')} ${body.time}`
      : auction.name
    auction.max_rank_displayed = body.maxRankDisplayed

    auction.lots.forEach((lot, i) => {
      let lotStart = startDate.add(0, 'm')

      if (body.auctionTiming === 'serial') {
        let cumulativeDuration = 0
        if (i > 0) {
          cumulativeDuration = auction.lots.slice(0, i).reduce((total, prevLot) => {
            return total + +prevLot.duration
          }, 0)
          lotStart = startDate.add(cumulativeDuration, 'm')
        }
        lot.start_at = lotStart.utc().format()
        lot.end_at = lotStart.add(+lot.duration, 'm').utc().format()
      } else {
        lot.start_at = startDate.utc().format()
        lot.end_at = end_at
      }
    })

    const { data: newGroups, error: supaError } = await supabase
      .from('auctions_group_settings')
      .insert({
        name: auction.name,
        description: body.description,
        buyer_id: body.buyer_id,
        timing_rule: body.auctionTiming
      })
      .select()
    console.log('newGroups:', newGroups, 'supaError:', supaError)

    Object.assign(auction, {
      group_id: newGroups[0].id
    })
    Object.assign(auction.lots[0], {
      lot_number: 1
    })
    console.log('auction:', auction)
    const data = await supabase.rpc('create_auction_v5_2', { auction })
    if (data && body.isMasterclass) {
      const { data: auctionsArray } = await supabase
        .from('auctions')
        .select('id')
        .eq('auctions_group_settings_id', auction.group_id)

      console.log('auctionArray:', auctionsArray)
      const filePath = `${auction.group_id}/${auctionsArray[0].id}/Cahier_des_Charges_Achats_Fruits_Qualite_Specifications.pdf`
      console.log('filePath:', filePath)
      const { data, error } = await supabase.storage
        .from('commercials_docs')
        .copy('masterclass/Cahier_des_Charges_Achats_Fruits_Qualite_Specifications.pdf', filePath)
      console.log('data upload file to masterclass:', data, 'error:', error)
    }
    return data
  } catch (error) {
    console.error('Error insert auction:', auction)
    console.error('Error in createTestAuction:', error)
    return { success: false, error: error.message }
  }
})
