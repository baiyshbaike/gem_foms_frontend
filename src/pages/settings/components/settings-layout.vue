<script setup lang="ts">
import { BasicPage, TwoColAside, TwoColLayout } from '@/components/global-layout'

const { settingsNavItems } = useSidebar()
</script>

<template>
  <BasicPage
    title="Настройки"
    description="Управление настройками мед центра."
  >
    <TwoColLayout>
      <template #aside>
        <TwoColAside :nav="settingsNavItems" />
      </template>

      <slot />
    </TwoColLayout>
  </BasicPage>
</template>
