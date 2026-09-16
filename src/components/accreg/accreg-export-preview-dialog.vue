<script setup lang="ts">
import { FileSpreadsheetIcon, FileTextIcon } from '@lucide/vue'

import type { AccRegExportPreview } from '@/services/types/dialysis'

import { formatAccRegDate, formatInteger, formatMoney } from '@/pages/accreg/accreg-grid-config'

const props = defineProps<{
  open: boolean
  preview: AccRegExportPreview | null
  loading: boolean
  downloading: 'excel' | 'word' | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'download': [format: 'excel' | 'word']
}>()

function onOpenChange(value: boolean) {
  if (!props.downloading) {
    emit('update:open', value)
  }
}

function formatRate(value: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)
}
</script>

<template>
  <UiDialog :open="open" @update:open="onOpenChange">
    <UiDialogContent class="max-h-[92vh] overflow-y-auto p-0 sm:max-w-5xl">
      <UiDialogHeader class="border-b px-6 py-5 text-left">
        <UiDialogTitle>Предпросмотр счет-реестра</UiDialogTitle>
        <UiDialogDescription>
          Проверьте данные и выберите формат файла.
        </UiDialogDescription>
      </UiDialogHeader>

      <div v-if="loading" class="grid min-h-64 place-items-center px-6 py-10 text-sm text-muted-foreground">
        Подготовка счет-реестра...
      </div>

      <article v-else-if="preview" class="m-6 border p-6 font-serif text-sm leading-6">
        <h2 class="text-center text-base font-bold">
          СЧЕТ-РЕЕСТР
        </h2>
        <p class="mt-3 text-center font-bold">
          Организации здравоохранения за оказанные услуги диализа в рамках бюджетного программного диализа
        </p>
        <p class="mt-5">
          Наименование организации здравоохранения: {{ preview.organizationName }}
        </p>
        <p>
          Период: с {{ preview.fromDate ? formatAccRegDate(preview.fromDate) : 'начала учета' }} года
          по {{ preview.toDate ? formatAccRegDate(preview.toDate) : 'текущего дня' }} год
        </p>
        <p>
          Стоимость базового тарифа {{ formatRate(preview.baseTariff) }}
        </p>

        <div class="mt-5 overflow-x-auto border">
          <table class="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead class="bg-muted/50 font-sans">
              <tr>
                <th class="border-b px-2 py-2 text-center">
                  №
                </th>
                <th class="border-b px-2 py-2">
                  Медицинский центр
                </th>
                <th class="border-b px-2 py-2">
                  ФИО
                </th>
                <th class="border-b px-2 py-2">
                  ИНН
                </th>
                <th class="border-b px-2 py-2 text-right">
                  Сеансы
                </th>
                <th class="border-b px-2 py-2 text-right">
                  Предъявлено к оплате, сом
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in preview.items" :key="item.id" class="border-b last:border-0">
                <td class="px-2 py-1.5 text-center tabular-nums">
                  {{ item.orderNo }}
                </td>
                <td class="px-2 py-1.5">
                  {{ item.tenantName }}
                </td>
                <td class="px-2 py-1.5">
                  {{ item.fullName }}
                </td>
                <td class="px-2 py-1.5 font-mono tabular-nums">
                  {{ item.inn }}
                </td>
                <td class="px-2 py-1.5 text-right tabular-nums">
                  {{ formatInteger(item.sessionCount) }}
                </td>
                <td class="px-2 py-1.5 text-right tabular-nums">
                  {{ formatMoney(item.totalPrice) }}
                </td>
              </tr>
              <tr class="border-t bg-muted/30 font-bold">
                <td colspan="4" class="px-2 py-2 text-right">
                  ИТОГО
                </td>
                <td class="px-2 py-2 text-right tabular-nums">
                  {{ formatInteger(preview.summary.sessionCount) }}
                </td>
                <td class="px-2 py-2 text-right tabular-nums">
                  {{ formatMoney(preview.summary.totalPrice) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="preview.isPreviewTruncated" class="mt-2 font-sans text-xs text-muted-foreground">
          Показаны первые 100 из {{ formatInteger(preview.totalCount) }} строк. В файл войдут все строки.
        </p>

        <p class="mt-5 font-bold">
          Итого к оплате:
        </p>
        <p class="font-bold">
          {{ formatRate(preview.summary.totalPrice) }} сомов
        </p>

        <div class="mt-7 space-y-5">
          <section>
            <p>Руководитель организации здравоохранения:</p>
            <div class="mt-5 grid grid-cols-[minmax(0,1fr)_180px] gap-6">
              <div>
                <div class="border-b border-foreground" />
                <p class="mt-1 text-xs italic">
                  Фамилия, имя, отчество
                </p>
              </div>
              <div>
                <div class="border-b border-foreground" />
                <p class="mt-1 text-xs italic">
                  подпись
                </p>
              </div>
            </div>
          </section>

          <section>
            <p>Главный бухгалтер</p>
            <div class="mt-5 grid grid-cols-[minmax(0,1fr)_180px] gap-6">
              <div>
                <div class="border-b border-foreground" />
                <p class="mt-1 text-xs italic">
                  Фамилия, имя, отчество
                </p>
              </div>
              <div>
                <div class="border-b border-foreground" />
                <p class="mt-1 text-xs italic">
                  подпись
                </p>
              </div>
            </div>
          </section>
        </div>

        <p class="mt-6">
          Место печати
        </p>
        <p>«_____»________________20___г.</p>
      </article>

      <UiDialogFooter class="border-t bg-background px-6 py-4">
        <UiButton type="button" variant="outline" :disabled="downloading !== null" @click="onOpenChange(false)">
          Отмена
        </UiButton>
        <UiButton type="button" variant="outline" :disabled="!preview || downloading !== null" @click="emit('download', 'excel')">
          <FileSpreadsheetIcon class="size-4" />
          Excel
        </UiButton>
        <UiButton type="button" :disabled="!preview || downloading !== null" @click="emit('download', 'word')">
          <FileTextIcon class="size-4" />
          Word
        </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
