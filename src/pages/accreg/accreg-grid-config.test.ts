import { describe, expect, it } from 'vitest'

import type { ServerDataGridQueryRequest } from '@/components/server-data-grid'

import {
  accRegExportFileName,
  ALL_TENANTS,
  buildAccRegGridRequest,
  createAccRegExportRequest,
  currentMonthDateRange,
  formatAccRegDate,
  formatMoney,
  summarizeAccRegRows,
} from './accreg-grid-config'

const baseRequest: ServerDataGridQueryRequest = {
  page: 2,
  pageSize: 25,
  search: 'админов',
  sorting: [{ field: 'fullName', descending: false }],
  filters: [],
  groupBy: null,
}

describe('accreg grid config', () => {
  it('adds report filters to grid request', () => {
    const request = buildAccRegGridRequest(baseRequest, {
      canFilterTenants: true,
      tenantId: 'tenant-1',
      fromDate: '2026-09-01',
      toDate: '2026-09-30',
      status: 'Paid',
    })

    expect(request).toMatchObject({
      page: 2,
      pageSize: 25,
      search: 'админов',
      tenantIds: ['tenant-1'],
      fromDate: '2026-09-01',
      toDate: '2026-09-30',
      status: 'Paid',
    })
  })

  it('does not send tenant ids when all accessible tenants are selected', () => {
    const request = buildAccRegGridRequest(baseRequest, {
      canFilterTenants: true,
      tenantId: ALL_TENANTS,
      fromDate: '',
      toDate: '',
      status: 'All',
    })

    expect(request.tenantIds).toEqual([])
    expect(request.fromDate).toBeNull()
    expect(request.toDate).toBeNull()
  })

  it('creates export request with selected rows', () => {
    const request = createAccRegExportRequest({
      canFilterTenants: true,
      tenantId: 'tenant-2',
      fromDate: '2026-09-01',
      toDate: '2026-09-30',
      status: 'SentToPay',
    }, ['tenant-2:21112200000085'], 'админов')

    expect(request).toMatchObject({
      page: 1,
      pageSize: 100,
      tenantIds: ['tenant-2'],
      search: 'админов',
      status: 'SentToPay',
      selectedIds: ['tenant-2:21112200000085'],
    })
  })

  it('summarizes rows for fallback totals', () => {
    expect(summarizeAccRegRows([
      {
        id: '1',
        orderNo: 1,
        tenantId: 'tenant-1',
        tenantName: 'Medcenter',
        patientId: 1,
        inn: '21112200000085',
        fullName: 'Админов Админ Админович',
        sessionCount: 2,
        totalPrice: 13000,
      },
      {
        id: '2',
        orderNo: 2,
        tenantId: 'tenant-1',
        tenantName: 'Medcenter',
        patientId: 2,
        inn: '21112200000086',
        fullName: 'Иванов Иван Иванович',
        sessionCount: 1,
        totalPrice: 6500,
      },
    ])).toEqual({
      patientCount: 2,
      sessionCount: 3,
      totalPrice: 19500,
    })
  })

  it('formats dates and money for Russian UI', () => {
    expect(currentMonthDateRange(new Date(2026, 8, 15))).toEqual({
      fromDate: '2026-09-01',
      toDate: '2026-09-15',
    })
    expect(accRegExportFileName('xlsx', '2026-09-01', '2026-09-30')).toBe('accreg-2026-09-01_2026-09-30.xlsx')
    expect(formatMoney(13000)).toBe('13 000,00 сом')
  })

  it('formats export dates without timezone conversion', () => {
    expect(formatAccRegDate('2026-09-15')).toBe('15.09.2026')
  })
})
