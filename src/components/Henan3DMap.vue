<template>
  <div class="henan-3d-map">
    <div ref="chartEl" class="henan-3d-map__chart"></div>
    <div v-if="isTankFocus" class="heat-sync-layer">
      <button
        v-for="point in projectedHeatPoints"
        :key="point.id"
        class="heat-sync-point"
        type="button"
        :style="point.style"
      >
        <span class="heat-sync-orb"></span>
        <span class="heat-sync-popup">
          <strong>{{ point.area }}</strong>
          <span>当前停留次数：<b>{{ point.count }}</b></span>
        </span>
      </button>
    </div>
    <div class="map-level-pill">{{ selectedTank ? selectedTank.area : selectedCity ? selectedCity : '河南省' }}</div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import henanProvinceGeoJsonRaw from '../../assets/地区json/河南省.geojson?raw'

const henanProvinceGeoJson = JSON.parse(henanProvinceGeoJsonRaw)

const props = defineProps({
  cityStats: {
    type: Array,
    required: true
  },
  selectedCity: {
    type: String,
    default: ''
  },
  selectedTank: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['city-click'])

const chartEl = ref(null)
const projectedHeatPoints = ref([])
let chart = null
let projectionFrame = 0
const textureCache = new Map()

const statMap = computed(() => Object.fromEntries(props.cityStats.map((item) => [item.name, item])))
const activeMapName = computed(() => props.selectedCity ? `map-${props.selectedCity}` : 'map-henan')
const activeFeatures = computed(() => {
  if (!props.selectedCity) return henanProvinceGeoJson.features

  const selectedFeature = henanProvinceGeoJson.features.find((feature) => feature.properties.name === props.selectedCity)
  return selectedFeature ? [selectedFeature] : henanProvinceGeoJson.features
})
const activeGeoJson = computed(() => ({
  type: 'FeatureCollection',
  features: activeFeatures.value
}))
const isTankFocus = computed(() => Boolean(props.selectedTank))

function valueForName(name) {
  if (isTankFocus.value && name === props.selectedCity) return props.selectedTank.stays
  return statMap.value[name]?.count || 0
}

function centerForFeature(feature) {
  return feature.properties.centroid || feature.properties.center || [113.6, 33.8]
}

function regionColor(value, maxValue) {
  if (value <= 0) return '#06446d'
  const ratio = Math.min(value / Math.max(maxValue, 1), 1)
  if (isTankFocus.value) {
    if (ratio > 0.72) return '#ffb347'
    if (ratio > 0.44) return '#22d6d0'
    return '#1195c8'
  }
  if (ratio > 0.72) return '#14fdfe'
  if (ratio > 0.44) return '#0aa6d8'
  return '#0b82b5'
}

function createGeologyTexture() {
  if (typeof document === 'undefined') return ''

  const textureKey = 'satellite-base'
  if (textureCache.has(textureKey)) return textureCache.get(textureKey)

  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  let seed = 410000
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  ctx.fillStyle = '#0b4474'
  ctx.fillRect(0, 0, 1024, 1024)

  const drawWrappedCircle = (x, y, radius, color) => {
    const points = [[x, y]]
    if (x - radius < 0) points.push([x + 1024, y])
    if (x + radius > 1024) points.push([x - 1024, y])
    if (y - radius < 0) points.push([x, y + 1024])
    if (y + radius > 1024) points.push([x, y - 1024])
    points.forEach(([px, py]) => {
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(px, py, radius, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  for (let i = 0; i < 150; i += 1) {
    const colorSet = [
      'rgba(38, 137, 121, 0.32)',
      'rgba(53, 146, 95, 0.25)',
      'rgba(142, 137, 83, 0.18)',
      'rgba(22, 121, 176, 0.27)',
      'rgba(93, 158, 139, 0.18)'
    ]
    drawWrappedCircle(random() * 1024, random() * 1024, 46 + random() * 180, colorSet[i % colorSet.length])
  }

  const image = ctx.getImageData(0, 0, 1024, 1024)
  const data = image.data
  for (let y = 0; y < 1024; y += 1) {
    for (let x = 0; x < 1024; x += 1) {
      const idx = (y * 1024 + x) * 4
      const wave = Math.sin(x * 0.041) + Math.sin(y * 0.037) + Math.sin((x + y) * 0.018)
      const grain = (random() - 0.5) * 18
      const shade = 12 + wave * 4 + grain
      data[idx] = Math.max(0, Math.min(255, data[idx] + shade))
      data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + shade * 0.9))
      data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + shade * 1.1))
    }
  }
  ctx.putImageData(image, 0, 0)

  for (let line = 0; line < 18; line += 1) {
    const startX = random() * 1024
    const startY = random() * 1024
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    for (let step = 1; step < 9; step += 1) {
      const angle = random() * Math.PI * 2
      const length = 48 + random() * 95
      ctx.lineTo(startX + Math.cos(angle) * length * step, startY + Math.sin(angle) * length * step)
    }
    ctx.strokeStyle = line % 3 === 0 ? 'rgba(128, 224, 238, 0.18)' : 'rgba(208, 220, 178, 0.1)'
    ctx.lineWidth = line % 3 === 0 ? 1.3 : 0.8
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(226, 242, 204, 0.2)'
  for (let i = 0; i < 900; i += 1) {
    const size = 0.8 + random() * 1.8
    ctx.fillRect(random() * 1024, random() * 1024, size, size)
  }

  const textureUrl = canvas.toDataURL('image/png')
  textureCache.set(textureKey, textureUrl)
  return textureUrl
}

const heatPointCoords = computed(() => {
  if (!props.selectedTank) return []

  const feature = activeFeatures.value[0]
  if (!feature) return []

  const [lng, lat] = centerForFeature(feature)
  const base = Math.max(props.selectedTank.stays, 1)
  const offsets = [
    [-0.18, -0.1], [-0.09, -0.16], [0.04, -0.14], [0.16, -0.1],
    [-0.14, -0.02], [0, -0.01], [0.12, 0.02], [-0.24, 0.04],
    [-0.08, 0.1], [0.08, 0.12], [0.2, 0.08], [-0.2, 0.14],
    [-0.02, -0.24], [0.12, -0.24], [-0.28, 0.12], [0.24, -0.18]
  ]

  return offsets.map(([offsetLng, offsetLat], index) => {
    const ratio = 0.28 + (index % 6) * 0.11
    const count = Math.max(1, Math.round(base * ratio))
    return {
      id: `${props.selectedTank.id}-${index}`,
      area: props.selectedTank.area,
      count,
      ratio,
      coord: [
        Number((lng + offsetLng).toFixed(6)),
        Number((lat + offsetLat).toFixed(6))
      ]
    }
  })
})

function updateProjectedHeatPoints() {
  if (!chart || !isTankFocus.value) {
    projectedHeatPoints.value = []
    return
  }

  projectedHeatPoints.value = heatPointCoords.value
    .map((point) => {
      const pixel = chart.convertToPixel({ geo3DIndex: 0 }, [...point.coord, 0])
      if (!pixel || !Number.isFinite(pixel[0]) || !Number.isFinite(pixel[1])) return null

      const size = 70 + Math.min(54, point.ratio * 78)
      return {
        ...point,
        style: {
          left: `${pixel[0]}px`,
          top: `${pixel[1]}px`,
          width: `${size}px`,
          height: `${size}px`,
          '--heat-core': point.count > props.selectedTank.stays * 0.72 ? 'rgba(255, 230, 86, .98)' : 'rgba(255, 186, 56, .92)',
          '--heat-mid': point.count > props.selectedTank.stays * 0.5 ? 'rgba(255, 75, 48, .78)' : 'rgba(255, 102, 64, .62)'
        }
      }
    })
    .filter(Boolean)
}

function startProjectionLoop() {
  cancelAnimationFrame(projectionFrame)
  const tick = () => {
    updateProjectedHeatPoints()
    projectionFrame = requestAnimationFrame(tick)
  }
  projectionFrame = requestAnimationFrame(tick)
}

function stopProjectionLoop() {
  cancelAnimationFrame(projectionFrame)
  projectionFrame = 0
}

function renderChart() {
  if (!chart || !activeGeoJson.value) return

  echarts.registerMap(activeMapName.value, activeGeoJson.value)
  const features = activeFeatures.value
  const geologyTexture = createGeologyTexture()
  const isProvinceOverview = !props.selectedCity && !props.selectedTank
  const baseMapData = features.map((feature) => ({
    name: feature.properties.name,
    value: valueForName(feature.properties.name)
  }))
  const maxValue = Math.max(...baseMapData.map((item) => item.value), 1)
  const mapData = baseMapData.map((item) => ({
    ...item,
    itemStyle: {
      color: regionColor(item.value, maxValue),
      borderColor: isTankFocus.value ? '#ffd15c' : '#14fdfe',
      borderWidth: isTankFocus.value ? 3 : props.selectedCity ? 2.4 : 1.8,
      opacity: item.value > 0 ? 0.96 : 0.72
    }
  }))

  const hoverMapSeries = {
    type: 'map3D',
    coordinateSystem: 'geo3D',
    map: activeMapName.value,
    name: '行政区划',
    silent: false,
    data: mapData,
    tooltip: {
      show: true,
      formatter: (params) => {
        const value = typeof params.value === 'number' ? params.value : valueForName(params.name)
        if (isTankFocus.value) {
          return `${props.selectedTank.area}<br/>当前停留次数：<b style="color:#ffd15c">${props.selectedTank.stays}</b>`
        }
        return `${params.name}<br/>罐区数量：<b style="color:#14fdfe">${value || 0}</b> 个`
      }
    },
    itemStyle: {
      color: 'rgba(20,253,254,0)',
      borderWidth: 0,
      opacity: 0
    },
    emphasis: {
      label: { show: false },
      itemStyle: {
        color: 'rgba(20,253,254,0)',
        opacity: 0
      }
    }
  }

  chart.setOption({
    backgroundColor: 'transparent',
    animation: true,
    tooltip: {
      show: true,
      trigger: 'item',
      backgroundColor: 'rgba(3, 22, 41, 0.94)',
      borderColor: 'rgba(20, 253, 254, 0.62)',
      borderWidth: 1.5,
      padding: [10, 14],
      extraCssText: 'box-shadow: 0 0 18px rgba(20,253,254,.28); border-radius: 3px;',
      textStyle: { color: '#d4f2ff', fontSize: 16, lineHeight: 26, fontWeight: 600 },
      formatter: (params) => {
        if (!params.value) return ''
        if (isTankFocus.value) {
          return `${props.selectedTank.area}<br/>当前停留次数：<b style="color:#ffd15c">${props.selectedTank.stays}</b>`
        }
        return `${params.name}<br/>罐区数量：<b style="color:#14fdfe">${params.value || 0}</b> 个`
      }
    },
      visualMap: {
        show: false,
        min: 0,
        max: maxValue,
        inRange: {
        color: isTankFocus.value ? ['#0b82b5', '#22d6d0', '#ffd15c'] : ['#06446d', '#0b82b5', '#14fdfe']
        }
      },
    geo3D: {
      map: activeMapName.value,
      top: isProvinceOverview ? '-5%' : 0,
      height: isProvinceOverview ? '106%' : '100%',
      roam: true,
      boxHeight: props.selectedCity ? 9 : 8,
      regionHeight: isTankFocus.value ? 5.2 : props.selectedCity ? 4.2 : 3.4,
      shading: 'realistic',
      environment: 'auto',
      realisticMaterial: {
        roughness: 0.76,
        metalness: 0.02,
        textureTiling: 1,
        detailTexture: geologyTexture
      },
      lambertMaterial: {
        textureTiling: 1,
        detailTexture: geologyTexture
      },
      itemStyle: {
        color: isTankFocus.value ? '#1298bd' : props.selectedCity ? '#1394be' : '#0b82b5',
        borderWidth: isTankFocus.value ? 3 : props.selectedCity ? 2.4 : 1.6,
        borderColor: isTankFocus.value ? '#ffd15c' : '#14fdfe',
        opacity: 0.95
      },
      emphasis: {
        label: {
          show: true,
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 700,
          textBorderColor: '#00192f',
          textBorderWidth: 3
        },
        itemStyle: { color: isTankFocus.value ? '#ffd15c' : '#14fdfe', opacity: 1 }
      },
      label: {
        show: true,
        color: '#d4f2ff',
        fontSize: props.selectedCity ? 14 : 11,
        textBorderColor: '#00192f',
        textBorderWidth: 2
      },
      light: {
        main: { intensity: 2.3, shadow: true, alpha: 42, beta: 18 },
        ambient: { intensity: 0.52 },
        ambientCubemap: { exposure: 1.2, diffuseIntensity: 0.7, specularIntensity: 0.22 }
      },
      postEffect: {
        enable: true,
        bloom: {
          enable: true,
          bloomIntensity: 0.12
        },
        SSAO: {
          enable: true,
          radius: 2.2,
          intensity: 1.15
        }
      },
      viewControl: {
        projection: 'perspective',
        autoRotate: false,
        alpha: props.selectedCity ? 52 : 48,
        beta: 0,
        distance: isTankFocus.value ? 72 : props.selectedCity ? 84 : 118,
        minDistance: 45,
        maxDistance: 180,
        center: [0, 0, 0]
      },
      data: mapData
    },
    series: [hoverMapSeries]
  }, true)

  if (isTankFocus.value) {
    startProjectionLoop()
  } else {
    stopProjectionLoop()
    projectedHeatPoints.value = []
  }
}

function handleClick(params) {
  if (!props.selectedCity && params?.name) {
    emit('city-click', params.name)
  }
}

function resizeChart() {
  chart?.resize()
}

onMounted(() => {
  chart = echarts.init(chartEl.value)
  chart.on('click', handleClick)
  renderChart()
  window.addEventListener('resize', resizeChart)
})

watch([activeMapName, activeGeoJson, statMap, () => props.selectedTank?.id], renderChart, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  stopProjectionLoop()
  chart?.off('click', handleClick)
  chart?.dispose()
})
</script>
