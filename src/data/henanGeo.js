const cityShapes = [
  { name: '三门峡市', code: '411200', polygon: [[110.4, 34.8], [111.5, 35.0], [112.0, 34.5], [111.6, 33.8], [110.6, 33.9]] },
  { name: '洛阳市', code: '410300', polygon: [[111.5, 35.0], [112.8, 35.1], [113.0, 34.4], [112.4, 33.8], [111.6, 33.8], [112.0, 34.5]] },
  { name: '济源市', code: '419001', polygon: [[112.2, 35.45], [112.8, 35.5], [112.8, 35.1], [112.2, 35.08]] },
  { name: '焦作市', code: '410800', polygon: [[112.8, 35.5], [113.7, 35.45], [113.7, 35.0], [112.8, 35.1]] },
  { name: '新乡市', code: '410700', polygon: [[113.7, 35.45], [114.7, 35.5], [114.9, 34.95], [113.7, 35.0]] },
  { name: '鹤壁市', code: '410600', polygon: [[114.7, 35.85], [115.2, 35.65], [115.15, 35.25], [114.7, 35.5]] },
  { name: '安阳市', code: '410500', polygon: [[113.7, 36.25], [114.8, 36.35], [115.2, 35.65], [114.7, 35.85], [113.7, 35.45]] },
  { name: '濮阳市', code: '410900', polygon: [[115.15, 35.25], [116.4, 35.25], [116.55, 34.7], [115.6, 34.55], [114.9, 34.95]] },
  { name: '郑州市', code: '410100', polygon: [[112.8, 35.1], [113.7, 35.0], [114.9, 34.95], [114.45, 34.25], [113.15, 34.2], [113.0, 34.4]] },
  { name: '开封市', code: '410200', polygon: [[114.45, 34.25], [115.6, 34.55], [116.55, 34.7], [116.35, 34.0], [115.2, 33.95], [114.7, 33.8]] },
  { name: '商丘市', code: '411400', polygon: [[115.2, 33.95], [116.35, 34.0], [116.9, 33.55], [116.55, 32.95], [115.45, 33.05], [114.95, 33.45]] },
  { name: '许昌市', code: '411000', polygon: [[113.15, 34.2], [114.45, 34.25], [114.7, 33.8], [114.1, 33.35], [113.2, 33.45], [112.95, 33.8]] },
  { name: '平顶山市', code: '410400', polygon: [[112.4, 33.8], [112.95, 33.8], [113.2, 33.45], [113.0, 32.95], [112.0, 33.0], [111.6, 33.45]] },
  { name: '漯河市', code: '411100', polygon: [[113.2, 33.45], [114.1, 33.35], [114.35, 32.95], [113.55, 32.75], [113.0, 32.95]] },
  { name: '周口市', code: '411600', polygon: [[114.1, 33.35], [114.95, 33.45], [115.45, 33.05], [115.25, 32.35], [114.25, 32.25], [113.55, 32.75], [114.35, 32.95]] },
  { name: '南阳市', code: '411300', polygon: [[111.6, 33.45], [112.0, 33.0], [113.0, 32.95], [113.55, 32.75], [113.2, 31.65], [112.0, 31.25], [110.95, 31.85], [110.65, 32.75]] },
  { name: '驻马店市', code: '411700', polygon: [[113.55, 32.75], [114.25, 32.25], [115.25, 32.35], [115.2, 31.45], [114.15, 31.1], [113.2, 31.65]] },
  { name: '信阳市', code: '411500', polygon: [[113.2, 31.65], [114.15, 31.1], [115.2, 31.45], [115.6, 30.75], [114.55, 30.2], [113.3, 30.55], [112.0, 31.25]] }
]

function featureFromShape(shape) {
  return {
    type: 'Feature',
    properties: {
      name: shape.name,
      adcode: shape.code
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[...shape.polygon, shape.polygon[0]]]
    }
  }
}

export const henanGeoJson = {
  type: 'FeatureCollection',
  features: cityShapes.map(featureFromShape)
}

export const cityGeoJsonMap = Object.fromEntries(cityShapes.map((shape) => {
  const [minLng, maxLng] = [
    Math.min(...shape.polygon.map(([lng]) => lng)),
    Math.max(...shape.polygon.map(([lng]) => lng))
  ]
  const [minLat, maxLat] = [
    Math.min(...shape.polygon.map(([, lat]) => lat)),
    Math.max(...shape.polygon.map(([, lat]) => lat))
  ]
  const midLng = (minLng + maxLng) / 2
  const midLat = (minLat + maxLat) / 2
  const districts = [
    { suffix: '一区', polygon: [[minLng, midLat], [midLng, midLat], [midLng, maxLat], [minLng, maxLat]] },
    { suffix: '二区', polygon: [[midLng, midLat], [maxLng, midLat], [maxLng, maxLat], [midLng, maxLat]] },
    { suffix: '三区', polygon: [[minLng, minLat], [midLng, minLat], [midLng, midLat], [minLng, midLat]] },
    { suffix: '四区', polygon: [[midLng, minLat], [maxLng, minLat], [maxLng, midLat], [midLng, midLat]] }
  ]

  return [shape.name, {
    type: 'FeatureCollection',
    features: districts.map((district, index) => featureFromShape({
      name: `${shape.name.replace('市', '')}${district.suffix}`,
      code: `${shape.code}-${index + 1}`,
      polygon: district.polygon
    }))
  }]
}))

export const cityCenters = Object.fromEntries(cityShapes.map((shape) => {
  const lng = shape.polygon.reduce((sum, item) => sum + item[0], 0) / shape.polygon.length
  const lat = shape.polygon.reduce((sum, item) => sum + item[1], 0) / shape.polygon.length
  return [shape.name, [Number(lng.toFixed(4)), Number(lat.toFixed(4))]]
}))
