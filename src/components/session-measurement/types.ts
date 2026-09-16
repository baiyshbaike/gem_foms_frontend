export type MeasurementPoint
  = | 'Start'
    | 'Hour1'
    | 'Hour2'
    | 'Hour3'
    | 'Hour4'
    | 'End'

export const measurementPointOrder: MeasurementPoint[] = [
  'Start',
  'Hour1',
  'Hour2',
  'Hour3',
  'Hour4',
  'End',
]

export const measurementPointLabels: Record<MeasurementPoint, string> = {
  Start: 'Начало',
  Hour1: '1-й час',
  Hour2: '2-й час',
  Hour3: '3-й час',
  Hour4: '4-й час',
  End: 'Конец',
}

export interface MeasurementPointTarget {
  sessionId: number
  point: MeasurementPoint
  patientName?: string
  tenantId?: string
}
