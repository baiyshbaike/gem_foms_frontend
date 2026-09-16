<script lang="ts" setup>
import { useSidebar } from '@/components/ui/sidebar'
import { useSidebarConfigStore } from '@/stores/sidebar-config'

import type { NavGroup } from './types'

import NavTeamCollapsible from './nav-team-collapsible.vue'
import NavTeamVercel from './nav-team-vercel.vue'

const { navMain } = defineProps<{
  navMain: NavGroup[]
}>()

const { state } = useSidebar()
const sidebarConfig = useSidebarConfigStore()

/**
 * Определяет, какой режим меню использовать
 * - Если боковая панель свернута, всегда используем collapsible-режим
 * - Если боковая панель развернута и включен режим Vercel, используем режим Vercel
 * - В остальных случаях используем collapsible-режим
 */
const effectiveMode = computed(() => {
  // Режим Vercel работает только при развернутой боковой панели
  if (state.value === 'collapsed') {
    return 'collapsible'
  }
  return sidebarConfig.navigationMode
})
</script>

<template>
  <NavTeamVercel v-if="effectiveMode === 'vercel'" :nav-main="navMain" />
  <NavTeamCollapsible v-else :nav-main="navMain" />
</template>
