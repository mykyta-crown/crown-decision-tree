import { marked } from 'marked'
import { computed } from 'vue'
import useTranslations from './useTranslations'

// Enable GitHub-Flavored Markdown so lists and other syntax render as expected
marked.setOptions({
  gfm: true,
  breaks: true
})

export default function useAuctionsDescriptions() {
  const { t } = useTranslations()

  const descriptions = computed(() => {
    const result = [
      {
        title: t('auctionDescriptions.english.title'),
        text: t('auctionDescriptions.english.description'),
        trainings_description: t('auctionDescriptions.english.trainings_description'),
        value: 'reverse',
        trainings_color: 'bg-blue-light',
        class: 'bg-orange-light pa-5',
        img: '/builder/english-auction-v2.png'
      },
      {
        title: t('auctionDescriptions.dutch.title'),
        text: t('auctionDescriptions.dutch.description'),
        trainings_description: t('auctionDescriptions.dutch.trainings_description'),
        value: 'dutch',
        trainings_color: 'bg-purple-light',
        class: 'bg-green-light pa-5',
        img: '/builder/dutch-auction-v2.png'
      },
      {
        title: t('auctionDescriptions.japanese.title'),
        text: t('auctionDescriptions.japanese.description'),
        trainings_description: t('auctionDescriptions.japanese.trainings_description'),
        value: 'japanese',
        trainings_color: 'bg-yellow-lighten-2',
        class: 'bg-purple pa-5 text-primary',
        img: '/builder/japansese-auction-v2.png'
      },
      {
        title: t('auctionDescriptions.sealedBid.title'),
        text: t('auctionDescriptions.sealedBid.description'),
        trainings_description: t('auctionDescriptions.sealedBid.trainings_description'),
        value: 'sealed-bid',
        trainings_color: 'bg-orange-light',
        class: 'bg-yellow-lighten-2 pa-5',
        img: '/builder/sealed-auction-v2.png'
      },
      {
        title: t('auctionDescriptions.preferredDutch.title'),
        text: t('auctionDescriptions.preferredDutch.description'),
        trainings_description: t('auctionDescriptions.preferredDutch.trainings_description'),
        value: 'preferred-dutch',
        color: 'bg-blue-light',
        class: 'bg-blue-light pa-5',
        img: '/builder/prefered-dutch-auction-v2.png'
      },
      {
        title: t('auctionDescriptions.japaneseNoRank.title'),
        text: t('auctionDescriptions.japaneseNoRank.description'),
        trainings_description: t('auctionDescriptions.japaneseNoRank.trainings_description'),
        value: 'japanese-no-rank',
        color: 'bg-red-light',
        class: 'bg-red-light pa-5 text-primary',
        img: '/builder/japanese-norank-v2.png'
      }
    ]
    return result
  })

  const parseMarkdown = (text) => {
    return marked.parse(text)
  }

  return { descriptions, parseMarkdown }
}
