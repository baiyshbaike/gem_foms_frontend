import { h } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import { EnvSchema } from '@/validators/env.validator'

/**
 * Загружает файл .env и проверяет его по схеме
 * При наличии файла Vite загрузит его автоматически, и переменные окружения будут доступны типизированно
 * Если ключ есть в EnvSchema, но отсутствует в .env, на странице появится ошибка
 */

const { data: env, error } = EnvSchema.safeParse(import.meta.env)

if (error) {
  console.error('❌ Invalid env')
  const flattenError = z.flattenError(error)
  console.error(flattenError)

  setTimeout(() => {
    toast.error(`Env error: you should check your .env file`, {
      description: h(
        'pre',
        { class: 'mt-2 rounded-md bg-slate-950 p-4 text-wrap' },
        h('code', { class: 'text-white' }, JSON.stringify(flattenError, null, 2)),
      ),
      duration: 10000,
    })
  }, 1000)
}

export default env!
