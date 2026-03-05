import dayjs from 'dayjs'

export function isValidISO(str) {
  return dayjs(str, dayjs.ISO_8601, true).isValid()
}
