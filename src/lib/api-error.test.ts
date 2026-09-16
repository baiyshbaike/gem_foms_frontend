import { describe, expect, it } from 'vitest'

import { formatApiError, parseApiError } from './api-error'

function axiosError(data: unknown) {
  return {
    isAxiosError: true,
    response: {
      status: 400,
      data,
    },
  }
}

describe('api-error', () => {
  it('returns the first validation message', () => {
    const message = formatApiError(
      axiosError({
        title: 'Validation failed',
        errors: {
          Password: ['Password is too weak.'],
        },
      }),
      'Fallback',
    )

    expect(message).toBe('Password is too weak.')
  })

  it('returns problem detail before title', () => {
    const message = formatApiError(
      axiosError({
        title: 'Conflict',
        detail: 'Patient already has a session today.',
      }),
      'Fallback',
    )

    expect(message).toBe('Patient already has a session today.')
  })

  it('parses plain string error payloads', () => {
    expect(parseApiError(axiosError('Server rejected request.'))).toEqual({
      status: 400,
      title: 'Server rejected request.',
    })
  })

  it('uses fallback for unknown values', () => {
    expect(formatApiError({ nope: true }, 'Fallback')).toBe('Fallback')
  })
})
