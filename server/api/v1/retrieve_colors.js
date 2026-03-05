import _ from 'lodash'
const generateColor = function (strings) {
  const colors = [
    {
      name: 'sky',
      primary: '#1E429F',
      primaryRGB: 'rgb(30, 66, 159)',
      secondary: '#CFE6FF',
      ternary: '#DFF0FF',
      secondaryRGB: 'rgb(223, 240, 255)',
      chartLine: '#76A9FA'
    },
    {
      name: 'yellow',
      primary: '#723B13',
      primaryRGB: 'rgb(114, 59, 19)',
      secondary: '#FDF6B2',
      ternary: '#FEFFEA',
      secondaryRGB: 'rgb(253, 246, 178)',
      chartLine: '#F1C537'
    },
    {
      name: 'grass',
      primary: '#03543F',
      primaryRGB: 'rgb(3, 84, 63)',
      secondary: '#DEF7EC',
      ternary: '#F3FAF7',
      secondaryRGB: 'rgb(222, 247, 236)',
      chartLine: '#31C48D'
    },
    {
      name: 'purple',
      primary: '#5521B5',
      primaryRGB: 'rgb(85, 33, 181)',
      secondary: '#EDEBFE',
      ternary: '#F6F5FF',
      secondaryRGB: 'rgb(237, 235, 254)',
      chartLine: '#AC94FA'
    },
    {
      name: 'orange',
      primary: '#ED8713',
      primaryRGB: 'rgb(237, 135, 19)',
      secondary: '#FFE1CB',
      ternary: '#FFF1E3',
      secondaryRGB: 'rgb(246, 240, 216)',
      chartLine: '#FF6F1F'
    },
    {
      name: 'pink',
      primary: '#99154B',
      primaryRGB: 'rgb(153, 21, 75)',
      secondary: '#FCE8F3',
      ternary: '#FDF2F8',
      secondaryRGB: 'rgb(252, 232, 243)',
      chartLine: '#F17EB8'
    },
    {
      name: 'indigo',
      primary: '#ED8713',
      primaryRGB: 'rgb(237, 135, 19)',
      secondary: '#E5EDFF',
      ternary: '#F0F5FF',
      secondaryRGB: 'rgb(246, 240, 216)',
      chartLine: '#8DA2FB'
    },
    {
      name: 'red',
      primary: '#9B1C1C',
      primaryRGB: 'rgb(155, 28, 28)',
      secondary: '#FDE8E8',
      ternary: '#FDF2F2',
      secondaryRGB: 'rgb(253, 232, 232)',
      chartLine: '#F05252'
    },
    {
      name: 'brown',
      primary: '#8C2300',
      primaryRGB: 'rgb(140, 35, 0)',
      secondary: '#FFE1CB',
      ternary: '#F8F8F8',
      secondaryRGB: 'rgb(255, 225, 203)',
      chartLine: '#DD9B04'
    },
    {
      name: 'teal',
      primary: '#008080',
      primaryRGB: 'rgb(0, 128, 128)',
      secondary: '#B2F5F5',
      ternary: '#E6FFFF',
      secondaryRGB: 'rgb(178, 245, 245)',
      chartLine: '#20B2AA'
    },
    {
      name: 'lime',
      primary: '#84CC16',
      primaryRGB: 'rgb(132, 204, 22)',
      secondary: '#ECFCCB',
      ternary: '#F7FEE7',
      secondaryRGB: 'rgb(236, 252, 203)',
      chartLine: '#A3E635'
    },
    {
      name: 'cyan',
      primary: '#06B6D4',
      primaryRGB: 'rgb(6, 182, 212)',
      secondary: '#CFFAFE',
      ternary: '#ECFEFF',
      secondaryRGB: 'rgb(207, 250, 254)',
      chartLine: '#22D3EE'
    },
    {
      name: 'olive',
      primary: '#808000',
      primaryRGB: 'rgb(128, 128, 0)',
      secondary: '#F7F7B2',
      ternary: '#FFFFE0',
      secondaryRGB: 'rgb(247, 247, 178)',
      chartLine: '#BDB76B'
    },
    {
      name: 'navy',
      primary: '#1E3A8A',
      primaryRGB: 'rgb(30, 58, 138)',
      secondary: '#DBEAFE',
      ternary: '#EFF6FF',
      secondaryRGB: 'rgb(219, 234, 254)',
      chartLine: '#2563EB'
    },
    {
      name: 'gold',
      primary: '#FFD700',
      primaryRGB: 'rgb(255, 215, 0)',
      secondary: '#FFF9DB',
      ternary: '#FFFBEB',
      secondaryRGB: 'rgb(255, 249, 219)',
      chartLine: '#FFC300'
    }
  ]

  const assignedColors = {}

  const sortedStrings = _.uniq([...strings]).sort()
  sortedStrings.forEach((string, index) => {
    assignedColors[string] = colors[index]
  })

  return assignedColors
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    if (!body?.groupId || !body?.profile) {
      throw createError({
        ...ERROR_TYPES.INVALID_INPUT,
        data: { receivedBody: body }
      })
    }
    const { groupId, profile } = body

    // Récupérer toutes les auctions de ce groupe, checker si admin OU buyer OU seller (filtrage de ce qu'on lui renvoi, uniquement sa propre valeur)
    const { data: fetchedGroup, error: fetchedGroupError } = await supabase
      .from('auctions')
      .select('id, buyer_id')
      .eq('auctions_group_settings_id', groupId)

    if (fetchedGroupError) {
      throw createError({
        ...ERROR_TYPES.INTERNAL_ERROR,
        data: { fetchedGroupError }
      })
    }

    const allSuppliers = await Promise.all(
      fetchedGroup.map(async (auctionId) => {
        const { data: lotSuppliers, error: fetchedAuctionSellerError } = await supabase
          .from('auctions_sellers')
          .select('seller_email')
          .eq('auction_id', auctionId.id)
        if (fetchedAuctionSellerError) {
          throw createError({
            ...ERROR_TYPES.INTERNAL_ERROR,
            data: { fetchedAuctionSellerError }
          })
        }
        return lotSuppliers
      })
    )

    // const isAllowedAsSupplierOrAdmin = allSuppliers.flat().some((s) => s.seller_email === profile.email) || profile.id === fetchedGroup[0].buyer_id || profile.admin
    // if (!isAllowedAsSupplierOrAdmin) {
    //   console.log('UNAUTHORIZED retrieve_color with body:', body)
    //   return {
    //     success: false
    //   }
    // }

    const isSupplier = allSuppliers.flat().some((s) => s.seller_email === profile.email)
    const uniqSuppliers = _.uniqBy(allSuppliers.flat(), 'seller_email')
    const colorsMap = generateColor(uniqSuppliers.map((s) => s.seller_email))

    return {
      success: true,
      data: {
        message: `Colors generated for ${uniqSuppliers.length} suppliers`,
        groupId: groupId,
        colors: isSupplier
          ? Object.fromEntries(Object.entries(colorsMap).filter(([key]) => key === profile.email))
          : colorsMap
      }
    }
  } catch (error) {
    console.error('Error in retrive colors:', {
      error: error.message,
      stack: error.stack,
      data: {
        auctionId: body?.auction?.id,
        round: body?.round
      }
    })

    if (error.statusCode) {
      throw error
    }

    throw createError({
      ...ERROR_TYPES.INTERNAL_ERROR,
      data: {
        auctionId: body?.auction?.id,
        round: body?.round
      }
    })
  }
})
