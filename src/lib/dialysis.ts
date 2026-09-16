import type {
  MachineAcquisitionType,
  MedCardStatus,
  PatientGender,
  SessionMeasurementPoint,
} from '@/services/types/dialysis'

export const APP_LOCALE = 'ru-RU'
export const APP_TIME_ZONE = 'Asia/Bishkek'

export const patientGroupOptions = [
  { value: 1, label: 'Новый' },
  { value: 2, label: 'Fresenius' },
  { value: 3, label: 'Другой' },
  { value: 4, label: 'Архив' },
] as const

export const genderOptions: { value: PatientGender, label: string }[] = [
  { value: 1, label: 'Мужской' },
  { value: 2, label: 'Женский' },
]

export const medCardStatusOptions: { value: MedCardStatus, label: string }[] = [
  { value: 1, label: 'Черновик' },
  { value: 2, label: 'Открыта' },
  { value: 3, label: 'Закрыта' },
  { value: 4, label: 'Архив' },
]

export const acquisitionTypeOptions: { value: MachineAcquisitionType, label: string }[] = [
  { value: 1, label: 'Новый' },
  { value: 2, label: 'Замена' },
]

export const measurementPointOptions: { value: SessionMeasurementPoint, label: string }[] = [
  { value: 'Start', label: 'Начало' },
  { value: 'Hour1', label: '1 час' },
  { value: 'Hour2', label: '2 часа' },
  { value: 'Hour3', label: '3 часа' },
  { value: 'Hour4', label: '4 часа' },
  { value: 'End', label: 'Окончание' },
]

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-'
  }

  const datePart = value.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
  return match ? `${match[3]}.${match[2]}.${match[1]}` : datePart
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: APP_TIME_ZONE,
  }).format(date)
}

export function toDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16)
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

export function toIsoDateTime(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

export function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed || null
}

export function toNumber(value: string | number | null | undefined) {
  return Number(value || 0)
}
