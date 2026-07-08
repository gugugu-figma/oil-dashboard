<template>
  <div ref="chartEl" class="chart-host city-bar-chart"></div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { graphic, init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const chartEl = ref(null)
let chart = null
let highlightTimer = null
let highlightIndex = 0

const chartItems = computed(() => [...props.items].sort((a, b) => b.count - a.count))

function renderChart() {
  if (!chart) return

  const names = chartItems.value.map((item) => item.name)
  const values = chartItems.value.map((item) => item.count)
  const maxValue = Math.max(...values, 1)

  chart.setOption({
    animationDuration: 900,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(3, 22, 41, 0.94)',
      borderColor: 'rgba(20, 253, 254, 0.55)',
      textStyle: { color: '#d4f2ff', fontSize: 12 },
      formatter: (params) => {
        const row = params[0]
        return `${row.name}<br/>罐区数量：<b style="color:#14fdfe">${row.value}</b> 个`
      }
    },
    grid: { left: 58, right: 24, top: 6, bottom: 6, containLabel: false },
    xAxis: {
      type: 'value',
      max: Math.ceil(maxValue * 1.16),
      show: false
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#599ec2', fontSize: 11, width: 50, overflow: 'truncate' }
    },
    series: [
      {
        type: 'bar',
        data: values.map(() => maxValue),
        barWidth: 8,
        barGap: '-100%',
        silent: true,
        itemStyle: {
          borderRadius: 8,
          color: 'rgba(5, 31, 51, 0.72)',
          borderColor: 'rgba(0, 199, 255, 0.08)'
        }
      },
      {
        name: '罐区数量',
        type: 'bar',
        data: values,
        barWidth: 8,
        label: {
          show: true,
          position: 'right',
          color: '#d4f2ff',
          fontSize: 10,
          formatter: '{c}'
        },
        itemStyle: {
          borderRadius: 8,
          color: new graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#14fdfe' },
            { offset: 0.62, color: '#0783fa' },
            { offset: 1, color: 'rgba(5, 82, 209, 0.12)' }
          ]),
          shadowColor: 'rgba(0, 204, 255, 0.55)',
          shadowBlur: 10
        },
        emphasis: {
          itemStyle: {
            color: '#14fdfe',
            shadowBlur: 18,
            shadowColor: 'rgba(20, 253, 254, 0.8)'
          }
        }
      }
    ]
  })

  resetHighlightLoop()
}

function resetHighlightLoop() {
  window.clearInterval(highlightTimer)
  highlightIndex = 0
  if (!chart || chartItems.value.length === 0) return

  highlightTimer = window.setInterval(() => {
    const length = chartItems.value.length
    chart.dispatchAction({ type: 'downplay', seriesIndex: 1 })
    chart.dispatchAction({ type: 'highlight', seriesIndex: 1, dataIndex: highlightIndex % length })
    highlightIndex += 1
  }, 1800)
}

function resizeChart() {
  chart?.resize()
}

onMounted(() => {
  chart = init(chartEl.value)
  renderChart()
  window.addEventListener('resize', resizeChart)
})

watch(chartItems, renderChart, { deep: true })

onBeforeUnmount(() => {
  window.clearInterval(highlightTimer)
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})
</script>
