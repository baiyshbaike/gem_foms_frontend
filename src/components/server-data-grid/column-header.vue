<script setup lang="ts" generic="T">
import type { Column } from '@tanstack/vue-table'

import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, ChevronsUpDownIcon, EyeOffIcon, PinIcon, PinOffIcon } from '@lucide/vue'
import { computed } from 'vue'

import { cn } from '@/lib/utils'

interface ServerDataGridColumnHeaderProps {
  column: Column<T, any>
  title: string
  multiSort?: boolean
}

const props = defineProps<ServerDataGridColumnHeaderProps>()

const canPinned = computed(() => props.column.getCanPin())
const canSorted = computed(() => props.column.getCanSort())
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<template>
  <div v-if="canSorted || canPinned" :class="cn('flex min-w-0 items-center', $attrs.class ?? '')">
    <UiDropdownMenu>
      <UiDropdownMenuTrigger as-child>
        <UiButton
          variant="ghost"
          size="sm"
          class="-ml-3 h-8 w-full min-w-0 justify-start overflow-hidden data-[state=open]:bg-accent"
        >
          <template v-if="canPinned">
            <PinIcon v-if="props.column.getIsPinned()" class="ml-2 size-4 shrink-0 text-primary" />
          </template>

          <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{{ title }}</span>

          <template v-if="canSorted">
            <ArrowDownIcon v-if="props.column.getIsSorted() === 'desc'" class="ml-2 size-4 shrink-0" />
            <ArrowUpIcon v-else-if="props.column.getIsSorted() === 'asc'" class="ml-2 size-4 shrink-0" />
            <ChevronsUpDownIcon v-else class="ml-2 size-4 shrink-0" />
          </template>
        </UiButton>
      </UiDropdownMenuTrigger>

      <UiDropdownMenuContent align="start">
        <template v-if="canSorted">
          <UiDropdownMenuItem @click="props.column.toggleSorting(false, props.multiSort)">
            <ArrowUpIcon class="mr-2 size-4 text-muted-foreground/70" />
            По возрастанию
          </UiDropdownMenuItem>
          <UiDropdownMenuItem @click="props.column.toggleSorting(true, props.multiSort)">
            <ArrowDownIcon class="mr-2 size-4 text-muted-foreground/70" />
            По убыванию
          </UiDropdownMenuItem>
          <UiDropdownMenuItem @click="props.column.clearSorting()">
            <ChevronsUpDownIcon class="mr-2 size-4 text-muted-foreground/70" />
            Сбросить сортировку
          </UiDropdownMenuItem>
          <UiDropdownMenuSeparator />
        </template>

        <UiDropdownMenuItem @click="props.column.toggleVisibility(false)">
          <EyeOffIcon class="mr-2 size-4 text-muted-foreground/70" />
          Скрыть
        </UiDropdownMenuItem>

        <template v-if="canPinned">
          <UiDropdownMenuSeparator />
          <UiDropdownMenuItem @click="props.column.pin('left')">
            <ArrowLeftIcon class="mr-2 size-4 text-muted-foreground/70" />
            Закрепить слева
          </UiDropdownMenuItem>
          <UiDropdownMenuItem @click="props.column.pin('right')">
            <ArrowRightIcon class="mr-2 size-4 text-muted-foreground/70" />
            Закрепить справа
          </UiDropdownMenuItem>
          <UiDropdownMenuItem @click="props.column.pin(false)">
            <PinOffIcon class="mr-2 size-4 text-muted-foreground/70" />
            Открепить
          </UiDropdownMenuItem>
        </template>
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  </div>

  <div v-else :class="cn('whitespace-nowrap', $attrs.class ?? '')">
    {{ title }}
  </div>
</template>
