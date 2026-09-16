<script setup lang="ts">
import { Edit3Icon, Trash2Icon } from '@lucide/vue'

import type { PatientGridRow } from '@/services/types/dialysis'

import ActionMenu from '@/components/row-actions/action-menu.vue'

const props = defineProps<{
  patient: PatientGridRow
  canUpdate: boolean
  canDelete: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  edit: [patient: PatientGridRow]
  delete: [patient: PatientGridRow]
}>()
</script>

<template>
  <ActionMenu
    :disabled="disabled"
    :items="[
      canUpdate && {
        label: 'Редактировать',
        icon: Edit3Icon,
        onSelect: () => emit('edit', props.patient),
      },
      canDelete && {
        label: 'Удалить',
        icon: Trash2Icon,
        destructive: true,
        onSelect: () => emit('delete', props.patient),
      },
    ]"
  />
</template>
