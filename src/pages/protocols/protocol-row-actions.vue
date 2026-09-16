<script setup lang="ts">
import { EyeIcon } from '@lucide/vue'

import type { Protocol } from '@/services/types/dialysis'

import ActionMenu from '@/components/row-actions/action-menu.vue'

const props = defineProps<{
  protocol: Protocol
}>()

const router = useRouter()
</script>

<template>
  <ActionMenu
    :items="[
      {
        label: 'Открыть',
        icon: EyeIcon,
        onSelect: () => router.push(`/protocols/${props.protocol.id}`),
      },
    ]"
  />
</template>
