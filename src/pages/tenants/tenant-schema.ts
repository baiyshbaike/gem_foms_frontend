import { z } from 'zod'

function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} обязательно`)
    .max(maxLength, `${label} должен содержать не более ${maxLength} символов`)
}

function optionalText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `${label} должен содержать не более ${maxLength} символов`)
    .transform(value => value || null)
}

export const tenantEditorSchema = z.object({
  code: requiredText('Код', 100)
    .transform(value => value.toUpperCase())
    .pipe(z.string().regex(
      /^[A-Z0-9][A-Z0-9_-]*$/,
      'Код может содержать только латинские буквы, цифры, дефис и подчёркивание',
    )),
  name: requiredText('Наименование', 200),
  address: optionalText('Адрес', 500),
  phone: requiredText('Телефон', 50),
  regionId: z.number().int().positive('Регион обязателен'),
  districtId: z.number().int().positive('Район обязателен'),
  isActive: z.boolean(),
})

export const createTenantSchema = tenantEditorSchema.omit({ isActive: true })
export const updateTenantSchema = tenantEditorSchema
