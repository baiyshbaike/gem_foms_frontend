import { describe, expect, it } from 'vitest'

import type { AdminRole } from '@/services/types/dialysis'

import {
  getManagerRegionIdForPayload,
  getManagerRoleId,
  isManagerRole,
} from './manager-region'

const roles: AdminRole[] = [
  { id: 1, code: 'Admin', name: 'Administrator', isSystem: true },
  { id: 2, code: 'Manager', name: 'Manager', isSystem: true },
]

describe('manager-region roleId helpers', () => {
  it('detects the Manager role by stable role code', () => {
    expect(getManagerRoleId(roles)).toBe(2)
    expect(isManagerRole(roles, 2)).toBe(true)
    expect(isManagerRole(roles, 1)).toBe(false)
    expect(isManagerRole(roles, null)).toBe(false)
  })

  it('keeps region only for manager payloads', () => {
    expect(getManagerRegionIdForPayload(roles, 2, 10)).toBe(10)
    expect(getManagerRegionIdForPayload(roles, 1, 10)).toBeNull()
    expect(getManagerRegionIdForPayload(roles, null, 10)).toBeNull()
  })
})
