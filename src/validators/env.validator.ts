import z from 'zod'

export const EnvSchema = z.object({
  // Добавляйте здесь переменные окружения, например:
  // VITE_API_BASE_URL: z.string().url(),
  VITE_SERVER_API_URL: z.url(),
  VITE_SERVER_API_PREFIX: z.string(),
})

export type env = z.infer<typeof EnvSchema>
