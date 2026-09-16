import { describe, expect, it } from 'vitest'

import type {
  ServerDataGridFilter,
  ServerDataGridFilterField,
} from './server-data-grid.types'

import {
  createServerDataGridQueryRequest,
  formatServerDataGridFilter,
} from './server-data-grid.utils'
import { queryLocalServerDataGrid } from './use-server-data-grid'

describe('server data grid helpers', () => {
  it('normalizes a remote query and enforces page limits', () => {
    expect(createServerDataGridQueryRequest({
      pageIndex: -3,
      pageSize: 500,
      search: '  dialysis  ',
      sorting: [{ id: 'createdAt', desc: true }],
      filters: [{
        field: 'status',
        operator: 'equals',
        value: ' active ',
        valueTo: ' ',
      }],
      groupBy: '',
    })).toEqual({
      page: 1,
      pageSize: 100,
      search: 'dialysis',
      sorting: [{ field: 'createdAt', descending: true }],
      filters: [{
        field: 'status',
        operator: 'equals',
        value: 'active',
        valueTo: null,
      }],
      groupBy: null,
    })
  })

  it('uses configured option labels in active filter text', () => {
    const fields: ServerDataGridFilterField[] = [{
      field: 'status',
      label: 'Status',
      type: 'select',
      options: [{ label: 'In progress', value: 'active' }],
    }]
    const filter: ServerDataGridFilter = {
      field: 'status',
      operator: 'equals',
      value: 'active',
      valueTo: null,
    }

    expect(formatServerDataGridFilter(filter, fields)).toBe('Status = In progress')
  })

  it('formats ranges and value-free operators', () => {
    const fields: ServerDataGridFilterField[] = [{
      field: 'createdAt',
      label: 'Created',
      type: 'date',
    }]

    expect(formatServerDataGridFilter({
      field: 'createdAt',
      operator: 'between',
      value: '2026-01-01',
      valueTo: '2026-01-31',
    }, fields)).toBe('Created между 2026-01-01 - 2026-01-31')

    expect(formatServerDataGridFilter({
      field: 'createdAt',
      operator: 'isEmpty',
      value: null,
      valueTo: null,
    }, fields)).toBe('Created пусто')
  })

  it('queries local rows with the same request shape', () => {
    const result = queryLocalServerDataGrid([
      { id: 1, name: 'Альфа', code: 'A10' },
      { id: 2, name: 'Бета', code: 'B20' },
      { id: 3, name: 'Альфа плюс', code: 'A20' },
    ], {
      page: 1,
      pageSize: 1,
      search: 'альфа',
      sorting: [{ field: 'code', descending: true }],
      filters: [],
      groupBy: null,
    })

    expect(result).toEqual({
      items: [{ id: 3, name: 'Альфа плюс', code: 'A20' }],
      totalCount: 2,
      groups: [],
    })
  })

  it('applies local numeric filters without string fallback leaks', () => {
    const result = queryLocalServerDataGrid([
      { id: 1, value: 2 },
      { id: 2, value: 10 },
      { id: 3, value: 20 },
    ], {
      page: 1,
      pageSize: 10,
      search: null,
      sorting: [],
      filters: [{
        field: 'value',
        operator: 'greaterThan',
        value: '10',
        valueTo: null,
      }],
      groupBy: null,
    })

    expect(result.items).toEqual([{ id: 3, value: 20 }])
  })
})
