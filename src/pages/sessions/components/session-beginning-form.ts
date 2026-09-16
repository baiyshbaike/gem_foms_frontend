import type {
  DialyzerType,
  SaveSessionBeginningRequest,
  SessionProgramDto,
} from '@/services/types/dialysis'

export interface SessionBeginningFormState {
  condition: string
  complaints: string
  program: SessionProgramDto
  dialyzerPrimedWithSolution: string
  sodiumCorrection: string
  sodiumReinfusion: string
  vascularAccess: string
  anticoagulation: string
  ultrafiltrationVolume: string
  bloodFlowRate: string
  durationHours: string
  dialyzerTypeId: string
  patientWeight: string
  sys: string
  dia: string
  ritm: string
  temp: string
}

export type SessionBeginningField = Exclude<keyof SessionBeginningFormState, 'program'>

const requiredFields: ReadonlyArray<{
  field: SessionBeginningField
  label: string
}> = [
  { field: 'condition', label: 'Состояние пациента' },
  { field: 'complaints', label: 'Жалобы' },
  { field: 'dialyzerPrimedWithSolution', label: 'Д-тор промыт и зап. раствором' },
  { field: 'sodiumCorrection', label: 'Коррекция электролитов по Na' },
  { field: 'sodiumReinfusion', label: 'Реинфузия NaCI' },
  { field: 'vascularAccess', label: 'Доступ' },
  { field: 'anticoagulation', label: 'Антикоагуляция' },
  { field: 'ultrafiltrationVolume', label: 'Обьем УФ' },
  { field: 'bloodFlowRate', label: 'Скорость потока крови' },
  { field: 'durationHours', label: 'Длительность' },
  { field: 'dialyzerTypeId', label: 'Тип диализатора' },
  { field: 'patientWeight', label: 'Вес пациента' },
  { field: 'sys', label: 'Систолическое давление' },
  { field: 'dia', label: 'Диастолическое давление' },
  { field: 'ritm', label: 'Частота' },
  { field: 'temp', label: 'Температура' },
]

const measurementRanges: ReadonlyArray<{
  field: Extract<SessionBeginningField, 'sys' | 'dia' | 'ritm' | 'temp'>
  label: string
  min: number
  max: number
}> = [
  { field: 'sys', label: 'Систолическое давление', min: 40, max: 300 },
  { field: 'dia', label: 'Диастолическое давление', min: 20, max: 200 },
  { field: 'temp', label: 'Температура', min: 30, max: 45 },
  { field: 'ritm', label: 'Пульс', min: 20, max: 250 },
]

export function createDefaultSessionBeginningForm(): SessionBeginningFormState {
  return {
    condition: '',
    complaints: '',
    program: 1,
    dialyzerPrimedWithSolution: '',
    sodiumCorrection: '',
    sodiumReinfusion: '',
    vascularAccess: '',
    anticoagulation: '',
    ultrafiltrationVolume: '',
    bloodFlowRate: '',
    durationHours: '',
    dialyzerTypeId: '',
    patientWeight: '',
    sys: '',
    dia: '',
    ritm: '',
    temp: '',
  }
}

export function validateSessionBeginningForm(form: SessionBeginningFormState): string[] {
  return missingRequiredFields(form).map(item => item.label)
}

export function validateSessionBeginningFields(
  form: SessionBeginningFormState,
): Partial<Record<SessionBeginningField, string[]>> {
  const errors: Partial<Record<SessionBeginningField, string[]>> = {}

  for (const item of missingRequiredFields(form)) {
    errors[item.field] = ['Поле обязательно']
  }

  for (const item of measurementRanges) {
    if (errors[item.field]) {
      continue
    }

    const error = rangeError(form[item.field], item.label, item.min, item.max)
    if (error) {
      errors[item.field] = [error]
    }
  }

  return errors
}

function missingRequiredFields(form: SessionBeginningFormState) {
  return requiredFields.filter(item => !String(form[item.field] ?? '').trim())
}

function rangeError(value: string, label: string, min: number, max: number): string | null {
  const parsed = toNullableNumber(value)
  if (parsed === null) {
    return `Значение поля "${label}" должно быть числом.`
  }

  return parsed < min || parsed > max
    ? `Значение поля "${label}" должно быть в диапазоне от ${min} до ${max}.`
    : null
}

function toNullableNumber(value: string | number | null | undefined): number | null {
  const normalized = String(value ?? '').replace(',', '.').trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function buildSessionBeginningRequest(
  form: SessionBeginningFormState,
  dialyzerTypes: DialyzerType[],
): SaveSessionBeginningRequest {
  const dialyzerTypeId = Number(form.dialyzerTypeId)
  const dialyzerType = dialyzerTypes.find(item => item.id === dialyzerTypeId) ?? null

  return {
    sessionStart: {
      condition: form.condition.trim(),
      complaints: form.complaints.trim(),
      program: form.program,
      dialyzerPrimedWithSolution: form.dialyzerPrimedWithSolution.trim(),
      sodiumCorrection: form.sodiumCorrection.trim(),
      sodiumReinfusion: form.sodiumReinfusion.trim(),
      vascularAccess: form.vascularAccess.trim(),
      anticoagulation: form.anticoagulation.trim(),
      ultrafiltrationVolume: form.ultrafiltrationVolume.trim(),
      bloodFlowRate: form.bloodFlowRate.trim(),
      durationHours: form.durationHours.trim(),
      dialyzerTypeId: Number.isFinite(dialyzerTypeId) ? dialyzerTypeId : 0,
      dialyzerTypeName: dialyzerType?.name ?? null,
      patientWeight: form.patientWeight.trim(),
    },
    sessionMeasurement: {
      sys: toNullableNumber(form.sys),
      dia: toNullableNumber(form.dia),
      ritm: toNullableNumber(form.ritm),
      temp: toNullableNumber(form.temp),
      measuredAt: null,
      note: null,
    },
  }
}
