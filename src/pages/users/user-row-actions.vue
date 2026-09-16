<script setup lang="ts">
import { BanIcon, Edit3Icon, EyeIcon } from '@lucide/vue'

import type { AdminUserGridRow } from '@/services/types/dialysis'

import ActionMenu from '@/components/row-actions/action-menu.vue'

const props = defineProps<{
  user: AdminUserGridRow
  canUpdate: boolean
  canDeactivate: boolean
}>()

const emit = defineEmits<{
  view: [user: AdminUserGridRow]
  edit: [user: AdminUserGridRow]
  deactivate: [user: AdminUserGridRow]
}>()
</script>

<template>
  <ActionMenu
    :items="[
      {
        label: 'Открыть',
        icon: EyeIcon,
        onSelect: () => emit('view', props.user),
      },
      canUpdate && {
        label: 'Редактировать',
        icon: Edit3Icon,
        onSelect: () => emit('edit', props.user),
      },
      canDeactivate && {
        label: 'Деактивировать',
        icon: BanIcon,
        destructive: true,
        onSelect: () => emit('deactivate', props.user),
      },
    ]"
  />
</template>
