import type { AdminRole } from '@/services/types/dialysis'

const MANAGER_ROLE_CODE = 'Manager'

export function getManagerRoleId(roles: AdminRole[]): number | null {
  return roles.find(role => role.code === MANAGER_ROLE_CODE)?.id ?? null
}

export function isManagerRole(roles: AdminRole[], roleId: number | null): boolean {
  const managerRoleId = getManagerRoleId(roles)
  return managerRoleId !== null && roleId === managerRoleId
}

export function getManagerRegionIdForPayload(
  roles: AdminRole[],
  roleId: number | null,
  managerRegionId: number | null,
): number | null {
  return isManagerRole(roles, roleId) ? managerRegionId : null
}
