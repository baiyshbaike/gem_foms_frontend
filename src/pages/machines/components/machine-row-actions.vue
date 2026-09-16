<script setup lang="ts">
import { Edit3Icon, Trash2Icon } from '@lucide/vue'

import type { MedCenterMachineGridRow } from '@/services/types/dialysis'

import ActionMenu from '@/components/row-actions/action-menu.vue'

const props = defineProps<{
  machine: MedCenterMachineGridRow
  canUpdate: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  edit: [machine: MedCenterMachineGridRow]
  delete: [machine: MedCenterMachineGridRow]
}>()
</script>

<template>
  <ActionMenu
    :items="[
      canUpdate && {
        label: 'Редактировать',
        icon: Edit3Icon,
        onSelect: () => emit('edit', props.machine),
      },
      canDelete && {
        label: 'Удалить',
        icon: Trash2Icon,
        destructive: true,
        onSelect: () => emit('delete', props.machine),
      },
    ]"
  />
</template>
