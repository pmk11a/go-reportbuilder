<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-secondary-100 text-secondary-700">
        <tr>
          <th
            v-for="col in visibleColumns"
            :key="col.nama_kolom"
            class="px-4 py-3 text-left font-medium border-b border-secondary-200"
            :class="getAlignmentClass(col.alignment)"
          >
            {{ col.label_tampil }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-secondary-100">
        <!-- CASE 1: Labels-only mode (ReportNeraca) -->
        <template v-if="labelsOnlyMode">
          <tr
            v-for="(labelGroup, idx) in labelsOnlyData"
            :key="idx"
            class="bg-secondary-50 font-semibold"
          >
            <td :colspan="visibleColumns.length" class="px-4 py-2">
              {{ labelGroup }}
            </td>
          </tr>
        </template>

        <!-- CASE 2: N-level recursive grouping -->
        <template v-else-if="groupedData && Object.keys(groupedData).length > 0">
          <GroupedLevel
            v-for="(group, key) in groupedData"
            :key="key"
            :group="group"
            :key-value="String(key)"
            :level="1"
            :columns="visibleColumns"
            :show-group-headers="true"
          />
        </template>

        <!-- Grand Total -->
        <tr
          v-if="grandTotal && Object.keys(grandTotal).length > 0"
          class="bg-primary-100 font-bold text-primary-800"
        >
          <td class="px-4 py-3">GRAND TOTAL:</td>
          <td
            v-for="col in visibleColumns.slice(1)"
            :key="`grand-${col.nama_kolom}`"
            class="px-4 py-3"
            :class="getAlignmentClass(col.alignment)"
          >
            <template v-if="col.is_summable">
              {{ formatCell(grandTotal[col.nama_kolom], col.format_type) }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- No Data -->
    <div v-if="isEmpty" class="text-center py-8 text-secondary-500">
      No data available
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GroupedLevel from './GroupedLevel.vue'

/**
 * Recursive GroupedTable Component
 * 
 * Supports N-level grouping via recursive <GroupedLevel> component.
 * 
 * Props:
 *   - groupedData: { [key: string]: { label, items?, subgroups?, subtotal? } }
 *   - columns: Column definitions
 *   - grandTotal: Grand total row
 *   - mainDataset: Dataset name for column lookup
 *   - kodeMenu: Report code menu
 *   - isLabelsOnly: Force labels-only mode (for ReportNeraca)
 *   - labelsData: Array of labels to render (when isLabelsOnly=true)
 */

const props = defineProps<{
  groupedData: { [key: string]: any } | null
  columns: { [dataset: string]: any[] }
  grandTotal?: { [col: string]: number }
  mainDataset?: string
  kodeMenu?: string
  isLabelsOnly?: boolean
  labelsData?: string[]
}>()

// Labels-only mode for ReportNeraca
const labelsOnlyMode = computed(() => props.isLabelsOnly && props.labelsData?.length > 0)
const labelsOnlyData = computed(() => props.labelsData || [])

// Visible columns from config
const visibleColumns = computed(() => {
  if (props.mainDataset && props.columns[props.mainDataset]) {
    return props.columns[props.mainDataset].filter(col => col.is_visible !== false)
  }
  return Object.values(props.columns || {})[0]?.filter(col => col.is_visible !== false) || []
})

const isEmpty = computed(() => {
  if (labelsOnlyMode.value) return (labelsOnlyData.value?.length || 0) === 0
  if (!props.groupedData) return true
  return Object.keys(props.groupedData).length === 0
})

function getAlignmentClass(alignment: string): string {
  switch (alignment) {
    case 'right': return 'text-right'
    case 'center': return 'text-center'
    default: return 'text-left'
  }
}

// Format cell value
const { formatColumn } = useNumberFormatter(props.kodeMenu)

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
</script>
