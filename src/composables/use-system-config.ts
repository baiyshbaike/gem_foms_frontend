import type { z } from 'zod'

import { useForm } from '@tanstack/vue-form'
import { useStorage } from '@vueuse/core'

export function useSystemConfig<S extends z.ZodObject<z.ZodRawShape>>({
  key,
  defaultValue,
  schema,
}: {
  key: string
  defaultValue: Readonly<z.input<S>>
  description: string
  schema: S
}) {
  const initialConfig = { ...defaultValue } as z.input<S>

  const localCacheConfig = useStorage<z.input<S>>(key, initialConfig)

  const isPending = ref(false)
  const isGetting = ref(false)

  const form = useForm({
    defaultValues: localCacheConfig.value ?? initialConfig,
    validators: {
      onSubmit: schema as any,
      onBlur: schema as any,
    },
    onSubmit: ({ value }) => {
      localCacheConfig.value = value
    },
  })

  watch(localCacheConfig, (val) => {
    if (val) {
      form.reset(val, { keepDefaultValues: true })
    }
  }, { immediate: true, deep: true })

  return {
    isPending,
    isGetting,
    form,
  }
}
