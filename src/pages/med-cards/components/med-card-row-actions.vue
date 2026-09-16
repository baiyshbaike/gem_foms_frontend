<script setup lang="ts">
import { Edit3Icon, FileTextIcon, Trash2Icon } from '@lucide/vue'

import type { MedCardGridRow } from '@/services/types/dialysis'

import ActionMenu from '@/components/row-actions/action-menu.vue'

const props = defineProps<{
  medCard: MedCardGridRow
  canUpdate: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  view: [medCard: MedCardGridRow]
  edit: [medCard: MedCardGridRow]
  delete: [medCard: MedCardGridRow]
}>()
</script>

<template>
  <ActionMenu
    :items="[
      {
        label: 'Открыть',
        icon: FileTextIcon,
        onSelect: () => emit('view', props.medCard),
      },
      canUpdate && {
        label: 'Редактировать',
        icon: Edit3Icon,
        onSelect: () => emit('edit', props.medCard),
      },
      canDelete && {
        label: 'Удалить',
        icon: Trash2Icon,
        destructive: true,
        onSelect: () => emit('delete', props.medCard),
      },
    ]"
  />
</template>
