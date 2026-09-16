<script setup lang="ts">
import { EyeIcon, WalletIcon } from '@lucide/vue'

import type { SessionGridRow } from '@/services/types/dialysis'

import ActionMenu from '@/components/row-actions/action-menu.vue'

const props = defineProps<{
  session: SessionGridRow
  canMarkPaid: boolean
  onDetails: () => void
  onMarkPaid: () => void
}>()
</script>

<template>
  <ActionMenu
    :items="[
      {
        label: 'Подробности',
        icon: EyeIcon,
        onSelect: props.onDetails,
      },
      props.session.status === 'SentToPay' && props.canMarkPaid && {
        label: 'Оплачен',
        icon: WalletIcon,
        onSelect: props.onMarkPaid,
      },
    ]"
  />
</template>
