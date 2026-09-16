<script setup lang="ts">
import type { Component } from 'vue'

import { EllipsisVerticalIcon } from '@lucide/vue'
import { computed } from 'vue'

interface ActionMenuItem {
  label: string
  icon?: Component
  disabled?: boolean
  destructive?: boolean
  onSelect: () => void
}

const props = withDefaults(defineProps<{
  items: (ActionMenuItem | null | false | undefined)[]
  disabled?: boolean
  contentClass?: string
}>(), {
  contentClass: 'w-48',
})

const visibleItems = computed(() =>
  props.items.filter((item): item is ActionMenuItem => Boolean(item)),
)

function selectItem(item: ActionMenuItem) {
  if (props.disabled || item.disabled) {
    return
  }

  item.onSelect()
}
</script>

<template>
  <div v-if="visibleItems.length > 0" class="flex justify-center">
    <UiDropdownMenu>
      <UiDropdownMenuTrigger as-child>
        <UiButton
          type="button"
          variant="ghost"
          size="icon-sm"
          class="size-8"
          :disabled="disabled"
        >
          <EllipsisVerticalIcon class="size-4" />
          <span class="sr-only">Действия</span>
        </UiButton>
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent align="end" :class="contentClass">
        <UiDropdownMenuItem
          v-for="item in visibleItems"
          :key="item.label"
          :disabled="disabled || item.disabled"
          :variant="item.destructive ? 'destructive' : 'default'"
          @click="selectItem(item)"
        >
          <component :is="item.icon" v-if="item.icon" class="size-4" />
          <span>{{ item.label }}</span>
        </UiDropdownMenuItem>
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  </div>
</template>
