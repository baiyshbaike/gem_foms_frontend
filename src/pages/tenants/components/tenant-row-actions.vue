<script setup lang="ts">
import { Edit3Icon, PowerIcon } from '@lucide/vue'

import type { TenantGridRow } from '@/services/types/dialysis'

import ActionMenu from '@/components/row-actions/action-menu.vue'

const props = defineProps<{
  tenant: TenantGridRow
  disabled?: boolean
}>()

const emit = defineEmits<{
  edit: [tenant: TenantGridRow]
  deactivate: [tenant: TenantGridRow]
}>()
</script>

<template>
  <ActionMenu
    :disabled="disabled"
    :items="[
      {
        label: 'Редактировать',
        icon: Edit3Icon,
        onSelect: () => emit('edit', props.tenant),
      },
      tenant.isActive && {
        label: 'Отключить',
        icon: PowerIcon,
        destructive: true,
        onSelect: () => emit('deactivate', props.tenant),
      },
    ]"
  />
</template>
