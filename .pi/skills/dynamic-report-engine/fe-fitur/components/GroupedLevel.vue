<template>
  <!-- Group Header -->
  <tr v-if="showGroupHeaders" :class="getHeaderClass()">
    <td :colspan="columns.length" :class="getCellClass()">
      {{ group?.label || '' }}
    </td>
  </tr>

  <!-- Subgroups (N-level recursive via <component :is="...">) -->
  <template v-if="subgroups.length > 0">
    <GroupedLevel
      v-for="(sub, subKey) in subgroups"
      :key="`${keyValue}-${subKey}`"
      :group="sub"
      :key-value="String(subKey)"
      :level="level + 1"
      :columns="columns"
      :show-group-headers="showGroupHeaders"
    />
  </template>

  <!-- Items at this level (when no subgroups) -->
  <template v-else-if="group?.items?.length > 0">
    <tr
      v-for="(item, itemIdx) in group.items"
      :key="`${keyValue}-item-${itemIdx}`"
      class="hover:bg-secondary-50"
    >
      <td
        v-for="col in columns"
        :key="`${keyValue}-item-${itemIdx}-${col.nama_kolom}`"
        class="px-4 py-3 border-b border-secondary-100"
        :class="getAlignmentClass(col.alignment)"
      >
        {{ formatCell(getItemValue(item, col, keyValue, itemIdx), col.format_type) }}
      </td>
    </tr>
  </template>

  <!-- Subtotal (at non-root levels) -->
  <tr
    v-if="level > 1 && hasSubtotal(group?.subtotal)"
    :class="getSubtotalClass()"
  >
    <td class="px-4 py-2 text-right" :style="{ paddingLeft: `${(level - 1) * 16 + 16}px` }">
      Sub Total {{ group?.label || '' }}:
    </td>
    <td
      v-for="col in columns.slice(1)"
      :key="`sub-${keyValue}-${col.nama_kolom}`"
      class="px-4 py-2"
      :class="getAlignmentClass(col.alignment)"
    >
      <template v-if="col.is_summable">
        {{ formatCell(group.subtotal[col.nama_kolom], col.format_type) }}
      </template>
    </td>
  </tr>

  <!-- Root-level Total (Level 1 only) -->
  <tr
    v-if="level === 1 && hasSubtotal(group?.subtotal)"
    class="font-bold bg-secondary-200"
  >
    <td class="px-4 py-2">Total {{ group?.label || '' }}:</td>
    <td
      v-for="col in columns.slice(1)"
      :key="`total-${keyValue}-${col.nama_kolom}`"
      class="px-4 py-2"
      :class="getAlignmentClass(col.alignment)"
    >
      <template v-if="col.is_summable">
        {{ formatCell(group.subtotal[col.nama_kolom], col.format_type) }}
      </template>
    </td>
  </tr>
</template>

<script setup lang="ts">
/**
 * Recursive component for N-level grouped rendering.
 * Used by GroupedTable.vue via :maxLevel detection.
 */

interface GroupData {
  label?: string
  items?: any[]
  subgroups?: { [key: string]: GroupData }
  children?: { [key: string]: GroupData } // Alias for subgroups
  subtotal?: { [col: string]: number }
}

interface Column {
  nama_kolom: string
  label_tampil?: string
  alignment?: string
  format_type?: string
  is_summable?: boolean
  is_visible?: boolean
}

const props = defineProps<{
  group: GroupData
  keyValue: string
  level: number
  columns: Column[]
  showGroupHeaders: boolean
}>()

const { formatColumn } = useNumberFormatter(undefined)

const subgroups = computed(() => {
  const sg = props.group?.subgroups || props.group?.children || {}
  return Object.values(sg)
})

function getHeaderClass(): string {
  if (props.level === 1) return 'bg-secondary-50 font-semibold'
  const colors = ['blue', 'green', 'purple', 'orange', 'pink']
  const color = colors[(props.level - 2) % colors.length] || 'blue'
  return `bg-${color}-50 font-medium`
}

function getSubtotalClass(): string {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink']
  const color = colors[(props.level - 2) % colors.length] || 'blue'
  return `bg-${color}-100 font-semibold`
}

function getCellClass(): string {
  const padding = (props.level - 1) * 16
  return `px-4 py-2 ${padding > 0 ? 'pl-' + padding : ''}`
}

function getAlignmentClass(alignment?: string): string {
  switch (alignment) {
    case 'right': return 'text-right'
    case 'center': return 'text-center'
    default: return 'text-left'
  }
}

function formatCell(value: any, formatType: string): string {
  if (value === null || value === undefined || value === '') return '-'

  if (typeof value === 'string') {
    if (value === '.000000' || value === '.00' || value === '.0') return '-'
  }

  const ft = String(formatType || '').toLowerCase()
  if (['numeric', 'decimal', 'money', 'currency', 'angka', 'number'].includes(ft)) {
    return formatColumn('__currency_default', value, 'currency')
  }
  if (ft === 'date') {
    if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
      return new Date(value).toLocaleDateString('id-ID')
    }
    return String(value)
  }
  return String(value)
}

function getItemValue(item: any, col: Column, _groupKey: string, _itemIndex: number): any {
  return item[col.nama_kolom]
}

function hasSubtotal(subtotal: any): boolean {
  if (!subtotal) return false
  return Object.keys(subtotal).length > 0
}
</script>
