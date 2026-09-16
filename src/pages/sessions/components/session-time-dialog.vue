<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { SessionGridRow } from '@/services/types/dialysis'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/dialysis'

const props = defineProps<{
  open: boolean
  session: SessionGridRow | null
  mode: 'start' | 'finish'
  showTimeInput: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [value: string | null]
}>()

const timeValue = ref('')
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})
const title = computed(() => props.mode === 'start' ? 'Корректировка времени начала' : 'Завершение сеанса')
const description = computed(() => props.mode === 'start'
  ? 'Укажите более раннее время начала. Доступность аппарата проверит сервер.'
  : props.showTimeInput
    ? 'При необходимости укажите время завершения раньше текущего времени.'
    : 'Время завершения будет зафиксировано текущим временем.')
const label = computed(() => props.mode === 'start' ? 'Новое время начала' : 'Время завершения')

function toLocalInputValue(value: string | Date) {
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function reset() {
  timeValue.value = props.mode === 'start' && props.session?.startedAt
    ? toLocalInputValue(props.session.startedAt)
    : toLocalInputValue(new Date())
}

function submit() {
  if (!props.showTimeInput) {
    emit('submit', null)
    return
  }

  if (timeValue.value) {
    emit('submit', new Date(timeValue.value).toISOString())
  }
}

watch(() => props.open, (open) => {
  if (open) {
    reset()
  }
})
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 py-2" @submit.prevent="submit">
        <div v-if="session" class="text-sm text-muted-foreground">
          {{ session.patientName }}
          <span v-if="session.startedAt">. Начат: {{ formatDateTime(session.startedAt) }}</span>
        </div>

        <div v-if="showTimeInput" class="grid gap-2">
          <UiLabel for="session-time" required>
            {{ label }}
          </UiLabel>
          <UiInput id="session-time" v-model="timeValue" type="datetime-local" :disabled="loading" required />
        </div>

        <div class="flex justify-end gap-2">
          <UiButton type="button" variant="outline" :disabled="loading" @click="isOpen = false">
            Отмена
          </UiButton>
          <UiButton type="submit" :disabled="loading || (showTimeInput && !timeValue)">
            {{ mode === 'start' ? 'Сохранить' : 'Завершить' }}
          </UiButton>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
