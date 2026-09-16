import { defineStore } from 'pinia'

import type { AuthSession, AuthUser, Tenant } from '@/services/types/dialysis'

import { authApi, tenantApi } from '@/services/api/dialysis.api'
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAuthSession,
  subscribeAuthSessionChanged,
} from '@/services/auth-session'
import { resolveTenantSelection } from '@/services/tenant-selection'

export const useAuthStore = defineStore('auth', () => {
  const stored = getStoredAuthSession()

  const accessToken = ref(stored?.accessToken ?? '')
  const expiresAt = ref(stored?.expiresAt ?? '')
  const user = ref<AuthUser | null>(stored?.user ?? null)
  const activeTenant = ref<Tenant | null>(stored?.activeTenant ?? null)
  const tenants = ref<Tenant[]>([])
  const loading = ref(false)

  const isLogin = computed(() => Boolean(accessToken.value && user.value))
  const permissions = computed(() => user.value?.permissions ?? [])
  const isTenantSwitchMode = computed(() =>
    permissions.value.includes('tenant.access_own')
    && !permissions.value.includes('tenant.access_all')
    && !permissions.value.includes('tenant.access_assigned'),
  )
  const canFilterTenants = computed(() =>
    permissions.value.includes('tenant.access_all')
    || permissions.value.includes('tenant.access_assigned'),
  )

  if (!isTenantSwitchMode.value) {
    activeTenant.value = null
  }

  function syncFromStorage() {
    const next = getStoredAuthSession()

    accessToken.value = next?.accessToken ?? ''
    expiresAt.value = next?.expiresAt ?? ''
    user.value = next?.user ?? null
    activeTenant.value = isTenantSwitchMode.value ? next?.activeTenant ?? null : null

    if (!next) {
      tenants.value = []
    }
  }

  if (typeof window !== 'undefined') {
    subscribeAuthSessionChanged(syncFromStorage)
  }

  function setSession(session: AuthSession) {
    accessToken.value = session.accessToken
    expiresAt.value = session.expiresAt
    user.value = session.user
    activeTenant.value = isTenantSwitchMode.value ? session.activeTenant ?? null : null

    setStoredAuthSession({
      accessToken: accessToken.value,
      expiresAt: expiresAt.value,
      user: session.user,
      activeTenant: activeTenant.value ?? undefined,
    })
  }

  function clearActiveTenant() {
    activeTenant.value = null

    if (user.value) {
      setStoredAuthSession({
        accessToken: accessToken.value,
        expiresAt: expiresAt.value,
        user: user.value,
      })
    }
  }

  function clearSession() {
    accessToken.value = ''
    expiresAt.value = ''
    user.value = null
    activeTenant.value = null
    tenants.value = []
    clearStoredAuthSession()
  }

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const response = await authApi.login(username, password)
      setSession(response)
      await loadMe()
      await loadTenants()

      if (isTenantSwitchMode.value && tenants.value.length > 0) {
        await switchTenant(tenants.value[0].id)
        return
      }

      clearActiveTenant()
    }
    finally {
      loading.value = false
    }
  }

  async function loadMe() {
    if (!accessToken.value)
      return

    const me = await authApi.me()
    user.value = me

    setSession({
      accessToken: accessToken.value,
      expiresAt: expiresAt.value,
      user: me,
      activeTenant: activeTenant.value ?? undefined,
    })
  }

  async function loadTenants() {
    if (!accessToken.value)
      return

    tenants.value = await tenantApi.my()
  }

  async function switchTenant(tenantId: string) {
    if (!isTenantSwitchMode.value) {
      clearActiveTenant()
      return
    }

    const latest = getStoredAuthSession()
    if (latest) {
      accessToken.value = latest.accessToken
      expiresAt.value = latest.expiresAt
      user.value = latest.user
      activeTenant.value = latest.activeTenant ?? activeTenant.value
    }

    const response = await tenantApi.switch(tenantId)
    activeTenant.value = response.activeTenant

    setSession({
      accessToken: response.accessToken,
      expiresAt: response.expiresAt,
      user: user.value!,
      activeTenant: response.activeTenant,
    })
  }

  async function reconcileTenants() {
    await loadTenants()

    if (!isTenantSwitchMode.value) {
      clearActiveTenant()
      return
    }

    const nextTenantId = resolveTenantSelection(activeTenant.value, tenants.value)
    if (nextTenantId === undefined) {
      return
    }

    if (nextTenantId !== null) {
      await switchTenant(nextTenantId)
      return
    }

    activeTenant.value = null
    if (user.value) {
      setStoredAuthSession({
        accessToken: accessToken.value,
        expiresAt: expiresAt.value,
        user: user.value,
      })
    }
  }

  async function logout() {
    try {
      if (accessToken.value) {
        await authApi.logout()
      }
    }
    finally {
      clearSession()
    }
  }

  function hasPermission(permission: string) {
    return permissions.value.includes(permission)
  }

  return {
    accessToken,
    expiresAt,
    user,
    activeTenant,
    tenants,
    loading,
    isLogin,
    permissions,
    isTenantSwitchMode,
    canFilterTenants,
    login,
    logout,
    loadMe,
    loadTenants,
    switchTenant,
    reconcileTenants,
    hasPermission,
    clearActiveTenant,
    clearSession,
  }
})
