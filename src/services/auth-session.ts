import type { AuthSession } from './types/dialysis'

const STORAGE_KEY = 'dialysis.auth'
const AUTH_CHANGED_EVENT = 'dialysis-auth-changed'

export function getStoredAuthSession(): AuthSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw)
    return null

  try {
    return JSON.parse(raw) as AuthSession
  }
  catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function setStoredAuthSession(session: AuthSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  notifyAuthSessionChanged()
}

export function clearStoredAuthSession() {
  sessionStorage.removeItem(STORAGE_KEY)
  notifyAuthSessionChanged()
}

export function notifyAuthSessionChanged() {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT))
}

export function subscribeAuthSessionChanged(callback: () => void) {
  const listener = () => callback()

  window.addEventListener(AUTH_CHANGED_EVENT, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
