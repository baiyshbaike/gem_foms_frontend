import { describe, expect, it } from 'vitest'

import {
  canOpenMeasurementPoints,
  getMeasurementPointAvailability,
} from './measurement-point-availability'

const startedAt = '2026-08-11T08:00:00.000Z'

describe('measurement point availability', () => {
  it('disables the measurement button before session start', () => {
    expect(canOpenMeasurementPoints('Identified', null)).toBe(false)
    expect(getMeasurementPointAvailability({
      point: 'Start',
      status: 'Identified',
      startedAt: null,
      now: new Date('2026-08-11T08:05:00.000Z'),
    })).toEqual({
      enabled: false,
      reason: 'Сеанс ещё не начат',
    })
  })

  it('enables start and first hour immediately after start', () => {
    const now = new Date('2026-08-11T08:01:00.000Z')

    expect(getMeasurementPointAvailability({ point: 'Start', status: 'Started', startedAt, now }).enabled).toBe(true)
    expect(getMeasurementPointAvailability({ point: 'Hour1', status: 'Started', startedAt, now }).enabled).toBe(true)
  })

  it('unlocks hour points by elapsed active start time', () => {
    expect(getMeasurementPointAvailability({
      point: 'Hour2',
      status: 'Started',
      startedAt,
      now: new Date('2026-08-11T08:59:00.000Z'),
    }).enabled).toBe(false)

    expect(getMeasurementPointAvailability({
      point: 'Hour2',
      status: 'Started',
      startedAt,
      now: new Date('2026-08-11T09:00:00.000Z'),
    }).enabled).toBe(true)

    expect(getMeasurementPointAvailability({
      point: 'Hour3',
      status: 'Started',
      startedAt,
      now: new Date('2026-08-11T10:00:00.000Z'),
    }).enabled).toBe(true)

    expect(getMeasurementPointAvailability({
      point: 'Hour4',
      status: 'Started',
      startedAt,
      now: new Date('2026-08-11T11:00:00.000Z'),
    }).enabled).toBe(true)
  })

  it('freezes finished session hour points by finished active time', () => {
    expect(getMeasurementPointAvailability({
      point: 'Hour2',
      status: 'Finished',
      startedAt,
      finishedAt: '2026-08-11T08:01:00.000Z',
      now: new Date('2026-08-11T12:00:00.000Z'),
    }).enabled).toBe(false)

    expect(getMeasurementPointAvailability({
      point: 'Hour2',
      status: 'Finished',
      startedAt,
      finishedAt: '2026-08-11T09:10:00.000Z',
      pauseMinutes: 11,
      now: new Date('2026-08-11T12:00:00.000Z'),
    }).enabled).toBe(false)
  })

  it('enables end point only after the session is finished', () => {
    expect(getMeasurementPointAvailability({
      point: 'End',
      status: 'Started',
      startedAt,
      now: new Date('2026-08-11T12:00:00.000Z'),
    })).toEqual({
      enabled: false,
      reason: 'Доступно после завершения сеанса',
    })

    expect(getMeasurementPointAvailability({
      point: 'End',
      status: 'Finished',
      startedAt,
      now: new Date('2026-08-11T12:00:00.000Z'),
    }).enabled).toBe(true)
  })

  it('enables the end point only for Finished or EndIdentificationOverdue statuses', () => {
    expect(getMeasurementPointAvailability({
      point: 'End',
      status: 'EndIdentificationOverdue',
      startedAt,
      now: new Date('2026-08-11T12:00:00.000Z'),
    }).enabled).toBe(true)

    for (const status of ['EndIdentified', 'SentToPay', 'Paid', 'Archived', 'SendToPayOverdue']) {
      expect(getMeasurementPointAvailability({
        point: 'End',
        status,
        startedAt,
        now: new Date('2026-08-11T12:00:00.000Z'),
      }).enabled).toBe(false)
    }
  })
})
