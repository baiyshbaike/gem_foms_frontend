<script setup lang="ts">
import { Edit3Icon, Trash2Icon } from '@lucide/vue'

import ActionMenu from '@/components/row-actions/action-menu.vue'

defineProps<{
  canManage: boolean
  canDeactivate: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()
</script>

<template>
  <ActionMenu
    :items="[
      canManage && {
        label: 'Редактировать',
        icon: Edit3Icon,
        disabled: saving,
        onSelect: () => emit('edit'),
      },
      canManage && {
        label: 'Деактивировать',
        icon: Trash2Icon,
        destructive: true,
        disabled: saving || !canDeactivate,
        onSelect: () => emit('delete'),
      },
    ]"
  />
</template>
