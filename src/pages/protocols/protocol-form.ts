import type {
  CreateProtocolPayload,
  ProtocolPatientLookup,
} from '@/services/types/dialysis'

export interface ProtocolPatientFormRow {
  id: string
  expanded: boolean
  sourceGroupId: number | null
  innSearch: string
  searching: boolean
  options: ProtocolPatientLookup[]
  patient: ProtocolPatientLookup | null
  newStatusId: number | null
  basisProtocolId: number | null
  lpuId: number | null
  cause: string
  files: File[]
}

export interface ProtocolEmployeeFormRow {
  id: string
  fio: string
  employeePositionId: number | null
}

export interface PatientRowErrors {
  sourceGroupId?: string[]
  patient?: string[]
  newStatusId?: string[]
  basisProtocolId?: string[]
  lpuId?: string[]
  cause?: string[]
}

export interface EmployeeRowErrors {
  fio?: string[]
  employeePositionId?: string[]
}

export interface ProtocolValidationResult {
  isValid: boolean
  patientErrors: Record<string, PatientRowErrors>
  employeeErrors: Record<string, EmployeeRowErrors>
  generalErrors: string[]
}

export function createDefaultPatientRow(): ProtocolPatientFormRow {
  return {
    id: crypto.randomUUID(),
    expanded: true,
    sourceGroupId: null,
    innSearch: '',
    searching: false,
    options: [],
    patient: null,
    newStatusId: null,
    basisProtocolId: null,
    lpuId: null,
    cause: '',
    files: [],
  }
}

export function createDefaultEmployeeRow(): ProtocolEmployeeFormRow {
  return {
    id: crypto.randomUUID(),
    fio: '',
    employeePositionId: null,
  }
}

export function validateProtocolForm(
  patientRows: ProtocolPatientFormRow[],
  employeeRows: ProtocolEmployeeFormRow[],
  notes: string,
): ProtocolValidationResult {
  const patientErrors: Record<string, PatientRowErrors> = {}
  const employeeErrors: Record<string, EmployeeRowErrors> = {}
  const generalErrors: string[] = []

  let isValid = true

  if (patientRows.length === 0) {
    generalErrors.push('Необходимо добавить хотя бы одного пациента')
    isValid = false
  }

  const selectedPatients = patientRows.filter(r => r.patient !== null)
  if (selectedPatients.length === 0) {
    generalErrors.push('Необходимо выбрать хотя бы одного пациента')
    isValid = false
  }

  const patientIds = patientRows
    .map(r => r.patient?.id)
    .filter((id): id is number => id != null)
  const duplicateId = patientIds.find((id, idx, arr) => arr.indexOf(id) !== idx)
  if (duplicateId != null) {
    generalErrors.push('Один и тот же пациент не может быть добавлен дважды')
    isValid = false
  }

  for (const row of patientRows) {
    const rowErr: PatientRowErrors = {}

    if (!row.sourceGroupId) {
      rowErr.sourceGroupId = ['Выберите группу']
      isValid = false
    }

    if (!row.patient) {
      rowErr.patient = ['Выберите пациента']
      isValid = false
    }
    else {
      if (!row.newStatusId) {
        rowErr.newStatusId = ['Выберите новый этап']
        isValid = false
      }
      else if (row.newStatusId === row.patient.groupId) {
        rowErr.newStatusId = ['Новый этап не может совпадать с текущим']
        isValid = false
      }

      if (!row.basisProtocolId) {
        rowErr.basisProtocolId = ['Выберите основание']
        isValid = false
      }

      if (row.cause && row.cause.length > 1000) {
        rowErr.cause = ['Причина не может быть длиннее 1000 символов']
        isValid = false
      }
    }

    if (Object.keys(rowErr).length > 0) {
      patientErrors[row.id] = rowErr
    }
  }

  if (employeeRows.length === 0) {
    generalErrors.push('Необходимо добавить хотя бы одного сотрудника комиссии')
    isValid = false
  }

  for (const row of employeeRows) {
    const empErr: EmployeeRowErrors = {}

    if (!row.fio.trim()) {
      empErr.fio = ['ФИО сотрудника обязательно']
      isValid = false
    }
    else if (row.fio.length > 200) {
      empErr.fio = ['ФИО не может быть длиннее 200 символов']
      isValid = false
    }

    if (!row.employeePositionId) {
      empErr.employeePositionId = ['Выберите должность']
      isValid = false
    }

    if (Object.keys(empErr).length > 0) {
      employeeErrors[row.id] = empErr
    }
  }

  if (notes.length > 1000) {
    generalErrors.push('Примечания не могут превышать 1000 символов')
    isValid = false
  }

  return {
    isValid,
    patientErrors,
    employeeErrors,
    generalErrors,
  }
}

export function buildCreateProtocolPayload(
  notes: string,
  patientRows: ProtocolPatientFormRow[],
  employeeRows: ProtocolEmployeeFormRow[],
): CreateProtocolPayload {
  return {
    notes: notes.trim() || null,
    patientHistories: patientRows.map(row => ({
      patientId: row.patient!.id,
      newStatusId: row.newStatusId!,
      basisProtocolId: row.basisProtocolId!,
      lpuId: row.lpuId,
      cause: row.cause.trim() || null,
    })),
    employees: employeeRows.map(row => ({
      fio: row.fio.trim(),
      employeePositionId: row.employeePositionId!,
    })),
  }
}
