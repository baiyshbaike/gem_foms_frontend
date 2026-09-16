import type { MeasurementPoint } from './types'

const startedSessionStatuses = new Set([
  'Started',
  'Paused',
  'Finished',
  'EndIdentified',
  'SentToPay',
  'Paid',
  'Archived',
  'EndIdentificationOverdue',
  'SendToPayOverdue',
])

const requiredElapsedHours: Record<MeasurementPoint, number> = {
  Start: 0,
  Hour1: 0,
  Hour2: 1,
  Hour3: 2,
  Hour4: 3,
  End: 0,
}

const endPointStatuses = new Set([
  'Finished',
  'EndIdentificationOverdue',
])

const millisecondsPerMinute = 60_000
const millisecondsPerHour = 3_600_000

export interface MeasurementPointAvailability {
  enabled: boolean
  reason: string | null
}

export function canOpenMeasurementPoints(status: string | null | undefined, startedAt: string | null | undefined): boolean {
  return Boolean(startedAt) && startedSessionStatuses.has(status ?? '')
}

export function getMeasurementPointAvailability(params: {
  point: MeasurementPoint
  status: string | null | undefined
  startedAt: string | null | undefined
  finishedAt?: string | null | undefined
  pauseMinutes?: number | null | undefined
  now?: Date
}): MeasurementPointAvailability {
  if (!canOpenMeasurementPoints(params.status, params.startedAt)) {
    return {
      enabled: false,
      reason: 'Сеанс ещё не начат',
    }
  }

  const startedAt = new Date(params.startedAt as string)
  if (Number.isNaN(startedAt.getTime())) {
    return {
      enabled: false,
      reason: 'Некорректное время начала',
    }
  }

  if (params.point === 'End' && !endPointStatuses.has(params.status ?? '')) {
    return {
      enabled: false,
      reason: 'Доступно после завершения сеанса',
    }
  }

  const finishedAt = params.finishedAt ? new Date(params.finishedAt) : null
  const calculationEnd = finishedAt && !Number.isNaN(finishedAt.getTime())
    ? finishedAt
    : params.now ?? new Date()
  const pauseMilliseconds = Math.max(0, params.pauseMinutes ?? 0) * millisecondsPerMinute
  const elapsedHours = Math.max(0, (calculationEnd.getTime() - startedAt.getTime() - pauseMilliseconds) / millisecondsPerHour)
  const requiredHours = requiredElapsedHours[params.point]

  if (elapsedHours >= requiredHours) {
    return {
      enabled: true,
      reason: null,
    }
  }

  const remainingMinutes = Math.ceil((requiredHours - elapsedHours) * 60)

  return {
    enabled: false,
    reason: `Доступно через ${remainingMinutes} мин.`,
  }
}
