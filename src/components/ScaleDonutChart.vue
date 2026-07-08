<template>
  <div ref="chartEl" class="chart-host scale-donut-chart"></div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PieChart } from 'echarts/charts'
import { GraphicComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

use([PieChart, GraphicComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  total: {
    type: Number,
    required: true
  }
})

const chartEl = ref(null)
let chart = null

const chartItems = computed(() => props.items.map((item) => ({
  ...item,
  value: item.count
})))

function colorForScale(name) {
  if (name === '大规模') return '#ffd15c'
  if (name === '中等规模') return '#14d5a0'
  return '#0783fa'
}

function renderChart() {
  if (!chart) return

  chart.setOption({
    animationType: 'scale',
    animationDuration: 1000,
    animationEasing: 'elasticOut',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(3, 22, 41, 0.94)',
      borderColor: 'rgba(20, 253, 254, 0.55)',
      textStyle: { color: '#d4f2ff', fontSize: 14 },
      formatter: (item) => `${item.name}<br/>数量：<b style="color:#14fdfe">${item.value}</b> 个<br/>占比：${item.percent}%`
    },
    legend: {
      bottom: 6,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
      textStyle: { color: '#d4f2ff', fontSize: 14 },
      formatter: (name) => {
        const item = chartItems.value.find((row) => row.name === name)
        return item ? `${name} ${item.count}个 ${item.percent}%` : name
      }
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: String(props.total),
          fill: '#d4f2ff',
          fontSize: 32,
          fontWeight: 800,
          textAlign: 'center',
          textShadowColor: 'rgba(20,253,254,.55)',
          textShadowBlur: 10
        }
      },
      {
        type: 'text',
        left: 'center',
        top: '51%',
        style: {
          text: '罐区总数',
          fill: '#599ec2',
          fontSize: 14,
          textAlign: 'center'
        }
      }
    ],
    series: [
      {
        type: 'pie',
        radius: ['42%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderWidth: 2,
          borderColor: 'rgba(4,24,46,.95)',
          shadowBlur: 12,
          shadowColor: 'rgba(0, 199, 255, .22)'
        },
        emphasis: {
          scaleSize: 8,
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(20, 253, 254, .42)' }
        },
        data: chartItems.value.map((item) => ({
          name: item.name,
          value: item.count,
          itemStyle: { color: colorForScale(item.name) }
        }))
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

watch([chartItems, () => props.total], renderChart, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})
</script>
