import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
import utc from 'dayjs/plugin/utc.js'
import * as japaneseHelpers from './helpers.js'
import { enqueueTask } from '../enqueuer.js'

dayjs.extend(utc)
dayjs.extend(duration)

async function japaneseScheduleAuctionRounds(auction, oidcToken = null) {
  //TODO: faire la gestion d'erreur proprement
  console.log('Ready to schedule Rounds')
  const plannedRounds = japaneseHelpers.generateAuctionRounds(auction)
  console.log('plannedRounds: ', plannedRounds)

  await Promise.all(
    plannedRounds.map((round) =>
      enqueueTask(
        { type: 'round', auction, round },
        dayjs.utc(round.start_at).unix(),
        'JAPANESE',
        oidcToken
      )
    )
  )
  console.log('Rounds sucessfuly planned', plannedRounds)
}
export { japaneseScheduleAuctionRounds }
