<script setup lang="ts">
import { ActivityIcon } from '@lucide/vue'

import type { MeasurementPoint, MeasurementPointTarget } from './types'

import {
  canOpenMeasurementPoints,
  getMeasurementPointAvailability,
} from './measurement-point-availability'
import {
  measurementPointLabels,
  measurementPointOrder,
} from './types'

const props = withDefaults(defineProps<{
  sessionId: number
  status?: string | null
  startedAt?: string | null
  finishedAt?: string | null
  pauseMinutes?: number | null
  filledPoints?: MeasurementPoint[] | null
  points?: MeasurementPoint[] | null
  canEdit?: boolean
}>(), {
  status: null,
  startedAt: null,
  finishedAt: null,
  pauseMinutes: null,
  filledPoints: () => [],
  points: () => measurementPointOrder,
  canEdit: true,
})

const emit = defineEmits<{
  select: [target: MeasurementPointTarget]
}>()

const displayPoints = computed(() => props.points ?? measurementPointOrder)
const filledSet = computed(() => new Set(props.filledPoints ?? []))
const canOpen = computed(() => props.canEdit && canOpenMeasurementPoints(props.status, props.startedAt))

function availability(point: MeasurementPoint) {
  return getMeasurementPointAvailability({
    point,
    status: props.status,
    startedAt: props.startedAt,
    finishedAt: props.finishedAt,
    pauseMinutes: props.pauseMinutes,
  })
}

function selectPoint(point: MeasurementPoint) {
  if (!availability(point).enabled) {
    return
  }

  emit('select', { sessionId: props.sessionId, point })
}
</script>

<template>
  <UiDropdownMenu>
    <UiDropdownMenuTrigger as-child>
      <UiButton
        variant="outline"
        aria-label="Показатели"
        :disabled="!canOpen"
        class="h-auto min-h-9 flex-col gap-1 px-3 py-2"
        :title="canOpen ? 'Точки измерения' : 'Редактирование показателей недоступно'"
      >
        <span class="flex items-center gap-2">
          <ActivityIcon class="size-4" />
          <span>Точки измерения</span>
        </span>
        <span class="flex items-center gap-1" aria-label="Заполненные точки измерения">
          <span
            v-for="point in displayPoints"
            :key="point"
            class="inline-block size-1.5 rounded-full border"
            :class="filledSet.has(point) ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-transparent'"
            :title="`${measurementPointLabels[point]}: ${filledSet.has(point) ? 'заполнено' : 'не заполнено'}`"
          />
        </span>
      </UiButton>
    </UiDropdownMenuTrigger>
    <UiDropdownMenuContent align="end" class="w-44">
      <UiDropdownMenuItem
        v-for="point in displayPoints"
        :key="point"
        :disabled="!availability(point).enabled"
        :class="filledSet.has(point) ? 'font-medium text-primary' : 'text-muted-foreground'"
        :title="availability(point).reason ?? undefined"
        @click="selectPoint(point)"
      >
        <span class="flex w-full items-center justify-between">
          <span>{{ measurementPointLabels[point] }}</span>
          <span
            class="ml-2 inline-block size-2 rounded-full"
            :class="filledSet.has(point) ? 'bg-primary' : 'bg-muted-foreground/40'"
          />
        </span>
      </UiDropdownMenuItem>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>
