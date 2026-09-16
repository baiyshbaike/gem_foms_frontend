import { z } from 'zod'

function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} обязательно`)
    .max(maxLength, `${label} должен содержать не более ${maxLength} символов`)
}

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата рождения обязательна')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
  }, 'Некорректная дата рождения')
  .refine(
    value => value <= currentLocalDate(),
    'Дата рождения не может быть в будущем',
  )

function currentLocalDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const patientBaseSchema = z.object({
  inn: z
    .string()
    .trim()
    .regex(/^\d{14}$/, 'ИНН должен содержать ровно 14 цифр'),
  firstName: requiredText('Имя', 100),
  lastName: requiredText('Фамилия', 100),
  middleName: requiredText('Отчество', 100),
  birthDate: birthDateSchema,
  gender: z.union([z.literal(1), z.literal(2)]),
  address: requiredText('Адрес регистрации', 500),
  address2: requiredText('Фактический адрес', 500),
  phone: requiredText('Телефон', 50),
  regionId: z.number().int().positive('Регион обязателен'),
  districtId: z.number().int().positive('Район обязателен'),
})

export const createPatientSchema = patientBaseSchema

const patientSpecialStatusSchema = z.object({
  specialStatus: z.boolean(),
  specialStatusReasonId: z.number().int().positive('Причина особого статуса обязательна').nullable(),
}).superRefine((value, context) => {
  if (value.specialStatus && value.specialStatusReasonId === null) {
    context.addIssue({
      code: 'custom',
      message: 'Причина особого статуса обязательна',
      path: ['specialStatusReasonId'],
    })
  }
})

export const patientEditorSchema = patientBaseSchema
  .extend({
    isActive: z.boolean(),
  })
  .and(patientSpecialStatusSchema)

export const updatePatientSchema = z.object({
  firstName: requiredText('Имя', 100),
  lastName: requiredText('Фамилия', 100),
  middleName: requiredText('Отчество', 100),
  address: requiredText('Адрес регистрации', 500),
  address2: requiredText('Фактический адрес', 500),
  phone: requiredText('Телефон', 50),
  regionId: z.number().int().positive('Регион обязателен'),
  districtId: z.number().int().positive('Район обязателен'),
  isActive: z.boolean(),
}).and(patientSpecialStatusSchema)
