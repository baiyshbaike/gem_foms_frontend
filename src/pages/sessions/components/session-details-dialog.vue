<script setup lang="ts">
import { PrinterIcon } from '@lucide/vue'
import { computed } from 'vue'

import type { SessionGridRow } from '@/services/types/dialysis'

import { measurementPointLabels, measurementPointOrder } from '@/components/session-measurement/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/dialysis'

import { sessionStatusLabels } from '../session-grid-config'

const props = defineProps<{
  open: boolean
  session: SessionGridRow | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const filledSet = computed(() => new Set(props.session?.filledMeasurementPoints ?? []))

function dateOrDash(value: string | null | undefined): string {
  return value ? formatDateTime(value) : '—'
}

function printDetails() {
  window.print()
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Сеанс #{{ session?.id ?? '—' }}</DialogTitle>
        <DialogDescription>
          Полная информация о сеансе гемодиализа.
        </DialogDescription>
      </DialogHeader>

      <div v-if="session" id="session-details-print" class="grid gap-6 py-4">
        <div class="grid gap-2 rounded-md border p-4">
          <div class="text-sm font-medium">
            Пациент
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            <div class="text-muted-foreground">
              ФИО
            </div>
            <div class="col-span-2 font-medium sm:col-span-2">
              {{ session.patientName }}
            </div>
            <div class="text-muted-foreground">
              ID пациента
            </div>
            <div class="col-span-2 sm:col-span-2">
              {{ session.patientId }}
            </div>
          </div>
        </div>

        <div class="grid gap-2 rounded-md border p-4">
          <div class="text-sm font-medium">
            Медкарта
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div class="text-muted-foreground">
              Медкарта
            </div>
            <div>#{{ session.medCardId }}</div>
            <div class="text-muted-foreground">
              Мед. центр
            </div>
            <div>{{ session.tenantId }}</div>
          </div>
        </div>

        <div class="grid gap-2 rounded-md border p-4">
          <div class="text-sm font-medium">
            Аппарат
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div class="text-muted-foreground">
              Название
            </div>
            <div>{{ session.machineName ?? '—' }}</div>
            <div class="text-muted-foreground">
              ID аппарата
            </div>
            <div>{{ session.machineId ?? '—' }}</div>
          </div>
        </div>

        <div class="grid gap-2 rounded-md border p-4">
          <div class="text-sm font-medium">
            Сеанс
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div class="text-muted-foreground">
              Статус
            </div>
            <div>{{ sessionStatusLabels[session.status] ?? session.status }}</div>
            <div class="text-muted-foreground">
              Идентифицирован
            </div>
            <div>{{ dateOrDash(session.identifiedAt) }}</div>
            <div class="text-muted-foreground">
              Начат
            </div>
            <div>{{ dateOrDash(session.startedAt) }}</div>
            <div class="text-muted-foreground">
              Завершён
            </div>
            <div>{{ dateOrDash(session.finishedAt) }}</div>
            <div class="text-muted-foreground">
              Идент. завершена
            </div>
            <div>{{ dateOrDash(session.endIdentifiedAt) }}</div>
            <div class="text-muted-foreground">
              Отправлен в оплату
            </div>
            <div>{{ dateOrDash(session.sentToPayAt) }}</div>
            <div class="text-muted-foreground">
              Оплачен
            </div>
            <div>{{ dateOrDash(session.paidAt) }}</div>
            <div class="text-muted-foreground">
              Активно
            </div>
            <div>{{ session.activeMinutes != null ? `${session.activeMinutes} мин.` : '—' }}</div>
            <div class="text-muted-foreground">
              Пауза
            </div>
            <div>{{ session.pauseMinutes != null ? `${session.pauseMinutes} мин.` : '—' }}</div>
          </div>
        </div>

        <div class="grid gap-2 rounded-md border p-4">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium">
              Начало сеанса
            </div>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="session.hasBeginning ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'"
            >
              {{ session.hasBeginning ? 'Заполнено' : 'Не заполнено' }}
            </span>
          </div>
          <p class="text-sm text-muted-foreground">
            Данные начала сеанса будут доступны после обновления сервера.
          </p>
        </div>

        <div class="grid gap-2 rounded-md border p-4">
          <div class="text-sm font-medium">
            Точки измерения
          </div>
          <div class="grid gap-1.5">
            <div
              v-for="point in measurementPointOrder"
              :key="point"
              class="flex items-center justify-between text-sm"
            >
              <span>{{ measurementPointLabels[point] }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="filledSet.has(point) ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'"
              >
                {{ filledSet.has(point) ? 'Заполнено' : 'Не заполнено' }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid gap-2 rounded-md border p-4">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium">
              Конец сеанса
            </div>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="session.hasEnd ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'"
            >
              {{ session.hasEnd ? 'Заполнено' : 'Не заполнено' }}
            </span>
          </div>
          <p class="text-sm text-muted-foreground">
            Данные конца сеанса будут доступны после обновления сервера.
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <UiButton variant="outline" @click="isOpen = false">
          Закрыть
        </UiButton>
        <UiButton @click="printDetails">
          <PrinterIcon class="size-4" />
          PDF
        </UiButton>
      </div>
    </DialogContent>
  </Dialog>
</template>
