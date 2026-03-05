import { useMemoize } from '@vueuse/core'
import dayjs from 'dayjs'

const now = ref(dayjs())
const diff = ref(0)

const setDiff = useMemoize(async () => {
  const supabase = useSupabaseClient()
  const { data: dbNow } = await supabase.rpc('get_current_timestamp')
  diff.value = dbNow - Date.now()
})

setInterval(() => {
  setDiff.clear()
  setDiff()
}, 10000)

setInterval(() => {
  now.value = dayjs().add(diff.value, 'ms')
}, 1000)

export default function () {
  setDiff()
  return { now, diff }
}
