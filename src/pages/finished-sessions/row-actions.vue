<script setup lang="ts">
import { ArchiveIcon, BadgeCheckIcon, SendIcon } from '@lucide/vue'

import type { SessionGridRow } from '@/services/types/dialysis'

import ActionMenu from '@/components/row-actions/action-menu.vue'

const props = defineProps<{
  session: SessionGridRow
  canEndIdentify: boolean
  canSendToPay: boolean
  canOverrideTimeLimits: boolean
  canArchive: boolean
}>()

const emit = defineEmits<{
  endIdentify: [session: SessionGridRow]
  sendToPay: [session: SessionGridRow]
  archive: [session: SessionGridRow]
}>()
</script>

<template>
  <ActionMenu
    :items="[
      (props.session.status === 'Finished' || props.session.status === 'EndIdentificationOverdue') && props.canEndIdentify && (props.session.status !== 'EndIdentificationOverdue' || props.canOverrideTimeLimits) && {
        label: props.session.status === 'EndIdentificationOverdue' ? 'Завершить идент. с просрочкой' : 'Завершить идент.',
        icon: BadgeCheckIcon,
        onSelect: () => emit('endIdentify', props.session),
      },
      (props.session.status === 'EndIdentified' || props.session.status === 'SendToPayOverdue') && props.canSendToPay && (props.session.status !== 'SendToPayOverdue' || props.canOverrideTimeLimits) && {
        label: props.session.status === 'SendToPayOverdue' ? 'В оплату с просрочкой' : 'В оплату',
        icon: SendIcon,
        onSelect: () => emit('sendToPay', props.session),
      },
      props.canArchive && {
        label: 'Архивировать',
        icon: ArchiveIcon,
        destructive: true,
        onSelect: () => emit('archive', props.session),
      },
    ]"
  />
</template>
