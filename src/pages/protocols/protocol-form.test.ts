import { describe, expect, it } from 'vitest'

import type { ProtocolEmployeeFormRow, ProtocolPatientFormRow } from './protocol-form'

import {
  buildCreateProtocolPayload,
  createDefaultEmployeeRow,
  createDefaultPatientRow,
  validateProtocolForm,
} from './protocol-form'

describe('protocol form validation and mapping', () => {
  it('returns invalid when patient rows are empty or no patient is selected', () => {
    const patientRow = createDefaultPatientRow()
    const employeeRow = createDefaultEmployeeRow()

    const result = validateProtocolForm([patientRow], [employeeRow], '')

    expect(result.isValid).toBe(false)
    expect(result.generalErrors).toContain('Необходимо выбрать хотя бы одного пациента')
    expect(result.patientErrors[patientRow.id]?.sourceGroupId).toContain('Выберите группу')
    expect(result.patientErrors[patientRow.id]?.patient).toContain('Выберите пациента')
    expect(result.employeeErrors[employeeRow.id]?.fio).toContain('ФИО сотрудника обязательно')
    expect(result.employeeErrors[employeeRow.id]?.employeePositionId).toContain('Выберите должность')
  })

  it('detects duplicate patients across rows', () => {
    const row1: ProtocolPatientFormRow = {
      ...createDefaultPatientRow(),
      sourceGroupId: 1,
      patient: { id: 10, inn: '12345678901234', fullName: 'Иванов Иван', groupId: 1, groupName: 'Группа 1' },
      newStatusId: 2,
      basisProtocolId: 5,
    }
    const row2: ProtocolPatientFormRow = {
      ...createDefaultPatientRow(),
      sourceGroupId: 1,
      patient: { id: 10, inn: '12345678901234', fullName: 'Иванов Иван', groupId: 1, groupName: 'Группа 1' },
      newStatusId: 3,
      basisProtocolId: 5,
    }
    const emp: ProtocolEmployeeFormRow = {
      ...createDefaultEmployeeRow(),
      fio: 'Петров Петр',
      employeePositionId: 1,
    }

    const result = validateProtocolForm([row1, row2], [emp], '')

    expect(result.isValid).toBe(false)
    expect(result.generalErrors).toContain('Один и тот же пациент не может быть добавлен дважды')
  })

  it('rejects when new status is identical to current patient stage', () => {
    const row: ProtocolPatientFormRow = {
      ...createDefaultPatientRow(),
      sourceGroupId: 1,
      patient: { id: 10, inn: '12345678901234', fullName: 'Иванов Иван', groupId: 1, groupName: 'Группа 1' },
      newStatusId: 1, // Same as patient.groupId
      basisProtocolId: 5,
    }
    const emp: ProtocolEmployeeFormRow = {
      ...createDefaultEmployeeRow(),
      fio: 'Петров Петр',
      employeePositionId: 1,
    }

    const result = validateProtocolForm([row], [emp], '')

    expect(result.isValid).toBe(false)
    expect(result.patientErrors[row.id]?.newStatusId).toContain('Новый этап не может совпадать с текущим')
  })

  it('accepts valid input and constructs correct payload', () => {
    const row: ProtocolPatientFormRow = {
      ...createDefaultPatientRow(),
      sourceGroupId: 1,
      patient: { id: 10, inn: '12345678901234', fullName: 'Иванов Иван', groupId: 1, groupName: 'Группа 1' },
      newStatusId: 2,
      basisProtocolId: 5,
      lpuId: 3,
      cause: 'Плановый перевод',
    }
    const emp: ProtocolEmployeeFormRow = {
      ...createDefaultEmployeeRow(),
      fio: 'Петров Петр',
      employeePositionId: 1,
    }

    const result = validateProtocolForm([row], [emp], 'Комиссия проведена')

    expect(result.isValid).toBe(true)
    expect(result.generalErrors).toHaveLength(0)

    const payload = buildCreateProtocolPayload('Комиссия проведена', [row], [emp])
    expect(payload).toEqual({
      notes: 'Комиссия проведена',
      patientHistories: [
        {
          patientId: 10,
          newStatusId: 2,
          basisProtocolId: 5,
          lpuId: 3,
          cause: 'Плановый перевод',
        },
      ],
      employees: [
        {
          fio: 'Петров Петр',
          employeePositionId: 1,
        },
      ],
    })
  })
})
