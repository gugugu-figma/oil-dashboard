<template>
  <div ref="chartEl" class="chart-host trend-line-chart"></div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { graphic, init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const chartEl = ref(null)
let chart = null

const months = computed(() => props.items.map((item) => item.label))
const values = computed(() => props.items.map((item) => item.value))

function renderChart() {
  if (!chart) return

  chart.setOption({
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(3, 22, 41, 0.94)',
      borderColor: 'rgba(20, 253, 254, 0.55)',
      textStyle: { color: '#d4f2ff', fontSize: 12 },
      formatter: (rows) => {
        const row = rows[0]
        return `${row.name}<br/>停留次数：<b style="color:#14fdfe">${row.value}</b>`
      }
    },
    grid: { left: 34, right: 24, top: 20, bottom: 28, containLabel: true },
    xAxis: {
      type: 'category',
      data: months.value,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(0,199,255,.28)' } },
      axisTick: { show: false },
      axisLabel: { color: '#2aa9ff', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      splitNumber: 3,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#599ec2', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0,199,255,.09)', type: 'dashed' } }
    },
    series: [
      {
        name: '停留次数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: values.value,
        lineStyle: {
          width: 3,
          color: '#14fdfe',
          shadowColor: 'rgba(20,253,254,.65)',
          shadowBlur: 12
        },
        itemStyle: {
          color: '#d4f2ff',
          borderColor: '#14fdfe',
          borderWidth: 2
        },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(20, 253, 254, .26)' },
            { offset: 1, color: 'rgba(20, 253, 254, 0)' }
          ])
        }
      }
    ]
  })
}

function resizeChart() {
  chart?.resize()
}

onMounted(() => {
  chart = init(chartEl.value)
  renderChart()
  window.addEventListener('resize', resizeChart)
})

watch([months, values], renderChart, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})
</script>
