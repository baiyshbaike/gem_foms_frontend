<script setup lang="ts">
import { ArchiveIcon, Clock3Icon, PauseIcon, PlayIcon, RotateCcwIcon, SquareIcon } from '@lucide/vue'

import type { SessionGridRow } from '@/services/types/dialysis'

import ActionMenu from '@/components/row-actions/action-menu.vue'

const props = defineProps<{
  session: SessionGridRow
  canStart: boolean
  canPause: boolean
  canResume: boolean
  canFinish: boolean
  canAdjustTime: boolean
  canArchive: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onFinish: () => void
  onAdjustStartTime: () => void
  onArchive: () => void
}>()
</script>

<template>
  <ActionMenu
    :items="[
      props.session.status === 'Identified' && props.canStart && {
        label: 'Начать',
        icon: PlayIcon,
        onSelect: props.onStart,
      },
      props.session.status === 'Started' && props.canPause && {
        label: 'Пауза',
        icon: PauseIcon,
        onSelect: props.onPause,
      },
      props.session.status === 'Paused' && props.canResume && {
        label: 'Возобновить',
        icon: RotateCcwIcon,
        onSelect: props.onResume,
      },
      props.session.status === 'Started' && props.canFinish && {
        label: 'Завершить',
        icon: SquareIcon,
        onSelect: props.onFinish,
      },
      (props.session.status === 'Started' || props.session.status === 'Paused') && props.canAdjustTime && {
        label: 'Изменить время начала',
        icon: Clock3Icon,
        onSelect: props.onAdjustStartTime,
      },
      props.canArchive && {
        label: 'Архивировать',
        icon: ArchiveIcon,
        destructive: true,
        onSelect: props.onArchive,
      },
    ]"
  />
</template>
