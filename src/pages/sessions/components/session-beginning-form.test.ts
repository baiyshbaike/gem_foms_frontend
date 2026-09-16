import { describe, expect, it } from 'vitest'

import type { SessionBeginningFormState } from './session-beginning-form'

import {
  buildSessionBeginningRequest,
  createDefaultSessionBeginningForm,
  validateSessionBeginningFields,
  validateSessionBeginningForm,
} from './session-beginning-form'

describe('session beginning form', () => {
  it('requires the beginning form clinical fields', () => {
    const form = createDefaultSessionBeginningForm()

    expect(validateSessionBeginningForm(form)).toContain('Состояние пациента')
    expect(validateSessionBeginningForm(form)).toContain('Тип диализатора')
  })

  it('validates measurement ranges before saving', () => {
    const form = {
      ...createDefaultSessionBeginningForm(),
      dia: '2342',
    }

    expect(validateSessionBeginningFields(form).dia).toContain('Значение поля "Диастолическое давление" должно быть в диапазоне от 20 до 200.')
  })

  it('maps beginning form values to save beginning request payload', () => {
    const form: SessionBeginningFormState = {
      ...createDefaultSessionBeginningForm(),
      condition: 'stable',
      complaints: 'weakness',
      program: 2,
      dialyzerPrimedWithSolution: 'online',
      sodiumCorrection: '138',
      sodiumReinfusion: '300',
      vascularAccess: 'AV',
      anticoagulation: 'heparin',
      ultrafiltrationVolume: '2000',
      bloodFlowRate: '400',
      durationHours: '4',
      dialyzerTypeId: '7',
      patientWeight: '44.6',
      sys: '110',
      dia: '60',
      ritm: '68',
      temp: '36.6',
    }

    expect(validateSessionBeginningForm(form)).toEqual([])
    expect(buildSessionBeginningRequest(form, [
      {
        id: 7,
        name: 'FX 80',
        createdAt: '2026-08-11T00:00:00Z',
        isActive: true,
      },
    ])).toEqual({
      sessionStart: {
        condition: 'stable',
        complaints: 'weakness',
        program: 2,
        dialyzerPrimedWithSolution: 'online',
        sodiumCorrection: '138',
        sodiumReinfusion: '300',
        vascularAccess: 'AV',
        anticoagulation: 'heparin',
        ultrafiltrationVolume: '2000',
        bloodFlowRate: '400',
        durationHours: '4',
        dialyzerTypeId: 7,
        dialyzerTypeName: 'FX 80',
        patientWeight: '44.6',
      },
      sessionMeasurement: {
        sys: 110,
        dia: 60,
        ritm: 68,
        temp: 36.6,
        measuredAt: null,
        note: null,
      },
    })
  })
})
