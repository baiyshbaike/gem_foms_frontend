import axios from 'axios'

export interface ApiProblemDetails {
  detail?: string
  errorCode?: string
  errors?: Record<string, string[]>
  message?: string
  status?: number
  title?: string
}

export function parseApiError(error: unknown): ApiProblemDetails | null {
  if (!axios.isAxiosError(error)) {
    return null
  }

  const data = error.response?.data
  if (!data) {
    return null
  }

  if (typeof data === 'string') {
    return { title: data, status: error.response?.status }
  }

  if (typeof data === 'object') {
    return data as ApiProblemDetails
  }

  return null
}

export function formatApiError(error: unknown, fallback: string): string {
  const problem = parseApiError(error)
  const validationMessage = problem?.errors
    ? Object.values(problem.errors).flat()[0]
    : undefined

  if (validationMessage || problem?.detail || problem?.message || problem?.title) {
    return validationMessage ?? problem?.detail ?? problem?.message ?? problem?.title ?? fallback
  }

  return error instanceof Error ? error.message : fallback
}
