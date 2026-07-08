<template>
  <main class="dashboard-shell">
    <section class="dashboard">
      <header class="top-title">
        <img src="/assets/figma/header-title-frame.png" alt="" />
        <h1>成品油全链条税收监管平台</h1>
      </header>

      <aside class="panel left-panel">
        <PanelSection title="罐区查询" class="query-section">
          <label class="field full">
            <span>地址名称</span>
            <input v-model.trim="keyword" type="search" placeholder="按详细地址模糊搜索" />
          </label>
          <label class="field">
            <span>所属区域</span>
            <select v-model="region">
              <option value="">河南省全省</option>
              <option v-for="item in regionOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>
          <label class="field">
            <span>罐区规模</span>
            <select v-model="scale">
              <option value="">全部</option>
              <option>大规模</option>
              <option>中等规模</option>
              <option>小规模</option>
            </select>
          </label>
        </PanelSection>

        <PanelSection title="罐区列表" class="list-section">
          <template #actions>
            <button class="section-action refresh-action" type="button" title="返回全省总览" @click.stop="clearSelection">
              ↻
            </button>
          </template>
          <div class="table-head tank-row">
            <span>序号</span><span>详细地址</span><span>所属区域</span><span>停留</span><span>车辆</span><span>规模</span>
          </div>
          <div class="tank-list">
            <button
              v-for="(item, index) in filteredTanks"
              :key="item.id"
              :class="['tank-row', { active: selectedTank?.id === item.id }]"
              type="button"
              @click="selectTank(item)"
            >
              <span>{{ index + 1 }}</span>
              <span :title="item.address">{{ ellipsis(item.address, 20) }}</span>
              <span>{{ item.area }}</span>
              <span>{{ item.stays }}</span>
              <span>{{ item.vehicles }}</span>
              <span :class="['scale-tag', scaleClass(item.scale)]">{{ item.scale }}</span>
            </button>
          </div>
          <footer class="list-footer">显示 {{ filteredTanks.length }} / {{ tanks.length }} 个罐区</footer>
        </PanelSection>
      </aside>

      <section class="map-panel">
        <div class="map-card" @mouseleave="hoverInfo = null">
          <button v-if="selectedTank || selectedMapCity" class="map-reset-badge" type="button" @click="clearSelection">
            返回全省总览
          </button>
          <Henan3DMap
            :city-stats="cityStats"
            :selected-city="selectedMapCity"
            :selected-tank="selectedTank"
            @city-click="handleCityDrilldown"
          />
          <div v-if="hoverInfo" class="map-tooltip">
            <strong>{{ hoverInfo.title }}</strong>
            <span>{{ hoverInfo.body }}</span>
          </div>
          <button class="drawer-tab" type="button" @click="drawerOpen = !drawerOpen">停留明细</button>
          <Transition name="drawer">
            <aside v-if="drawerOpen && selectedTank" class="stay-drawer">
              <header class="stay-drawer-header">
                <strong>{{ selectedTank.address }}</strong>
                <span>重点监测</span>
                <button type="button" @click="drawerOpen = false">×</button>
              </header>
              <div class="stay-drawer-toolbar">
                <div class="coord"><b>经纬度：</b>{{ selectedCoord.lng }}，{{ selectedCoord.lat }}</div>
                <div class="date-range"><span>2025-03-01</span><i>→</i><span>2026-07-01</span></div>
                <button type="button">查询</button>
                <button class="muted" type="button">重置</button>
              </div>
              <div class="stay-table-wrap">
                <table class="stay-table">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>车牌号</th>
                      <th>进入时间</th>
                      <th>离开时间</th>
                      <th>停留时间（分）</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in stayDetails" :key="row.id">
                      <td>{{ row.id }}</td>
                      <td>{{ row.plate }}</td>
                      <td>{{ row.enterTime }}</td>
                      <td>{{ row.leaveTime }}</td>
                      <td>{{ row.duration }}</td>
                      <td><button>查看轨迹</button><button>查看运单</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <footer class="stay-pagination">
                <span>总条数 52068 条</span>
                <button>‹</button><button class="active">1</button><button>2</button><button>3</button><button>4</button><button>5</button>
                <span>•••</span><button>5207</button><button>›</button>
                <select><option>10条/页</option></select>
                <span>跳至</span><input value="1" /><span>页</span>
              </footer>
            </aside>
          </Transition>
        </div>
        <footer class="map-summary">
          <div class="map-summary-text">
            <span>{{ selectedTank ? `${selectedTank.area}罐区 · 停留点热力分析` : selectedMapCity ? `${selectedMapCity}罐区分布总览` : '全省罐区分布总览' }}</span>
            <span>· 共</span>
            <b>{{ selectedTank ? selectedTank.stays : totalTanks }}</b>
            <span>{{ selectedTank ? '次停留' : '个罐区' }}</span>
          </div>
        </footer>
      </section>

      <aside class="panel right-panel">
        <template v-if="!selectedTank">
          <PanelSection title="统计总览">
            <div class="kpis">
              <div class="kpi">
                <div class="kpi-copy"><span>罐区总数</span><b>{{ totalTanks }}</b></div>
                <img class="kpi-icon" :src="kpiTankIcon" alt="" />
              </div>
              <div class="kpi green">
                <div class="kpi-copy"><span>涉及车辆总数</span><b>{{ totalVehicles.toLocaleString() }}</b></div>
                <img class="kpi-icon" :src="kpiVehicleIcon" alt="" />
              </div>
            </div>
          </PanelSection>
          <PanelSection title="各地市罐区数量分布" class="bars-section">
            <CityBarChart :items="cityStats" />
          </PanelSection>
          <PanelSection title="罐区规模分布" class="donut-section">
            <ScaleDonutChart :items="scaleStats" :total="totalTanks" />
          </PanelSection>
        </template>
        <template v-else>
          <PanelSection title="近三个月停留次数趋势分析">
            <TrendLineChart :items="trendData" />
          </PanelSection>
          <PanelSection title="周边200米分析" class="nearby-section">
            <div class="mini-row head"><span>序号</span><span>位置类型</span><span>详细地址</span><span>距离</span></div>
            <div class="mini-list">
              <div v-for="item in nearbyList" :key="item.id" class="mini-row">
                <span>{{ item.id }}</span><span>{{ item.type }}</span><span :title="item.address">{{ ellipsis(item.address, 12) }}</span><span>{{ item.distance }}m</span>
              </div>
            </div>
          </PanelSection>
          <PanelSection title="高频停留车辆TOP5" class="top-section">
            <div class="mini-row head"><span>序号</span><span>车牌号</span><span>停留</span><span>所属企业</span></div>
            <div class="mini-list">
              <div v-for="(item, index) in topVehicles" :key="item.plate" class="mini-row">
                <span>{{ index + 1 }}</span><span>{{ item.plate }}</span><span>{{ item.count }}</span><span>{{ item.company }}</span>
              </div>
            </div>
          </PanelSection>
        </template>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import PanelSection from './components/PanelSection.vue'
import CityBarChart from './components/CityBarChart.vue'
import ScaleDonutChart from './components/ScaleDonutChart.vue'
import TrendLineChart from './components/TrendLineChart.vue'
import Henan3DMap from './components/Henan3DMap.vue'
import kpiTankIcon from '../assets/generated/kpi-tank-icon-ui.png'
import kpiVehicleIcon from '../assets/generated/kpi-vehicle-icon-ui.png'

const keyword = ref('')
const region = ref('')
const scale = ref('')
const selectedTank = ref(null)
const selectedMapCity = ref('')
const drawerOpen = ref(false)
const hoverInfo = ref(null)
const tanks = [
  ['南阳市卧龙区光武街道石化路北段168号', '南阳市卧龙区', 487, 94, '大规模'],
  ['郑州市新郑市龙湖镇双湖大道与107国道交叉口', '郑州市新郑市', 452, 88, '大规模'],
  ['洛阳市涧西区建设路与武汉路交叉口东100米', '洛阳市涧西区', 421, 79, '大规模'],
  ['周口市川汇区交通大道与八一路交叉口南侧', '周口市川汇区', 398, 72, '大规模'],
  ['南阳市宛城区仲景街道滨河路中段加油站旁', '南阳市宛城区', 376, 68, '大规模'],
  ['商丘市梁园区平原路与锦绣路交叉口北200米', '商丘市梁园区', 355, 65, '大规模'],
  ['郑州市管城回族区航海东路与中州大道交汇处', '郑州市管城区', 338, 61, '中等规模'],
  ['信阳市浉河区工区路与新华东路交叉口附近', '信阳市浉河区', 312, 58, '中等规模'],
  ['驻马店市驿城区雪松大道与乐山大道交叉口', '驻马店市驿城区', 295, 55, '中等规模'],
  ['洛阳市洛龙区开元大道与龙门大道交叉口西侧', '洛阳市洛龙区', 278, 52, '中等规模'],
  ['新乡市红旗区平原路与劳动路交叉口中段', '新乡市红旗区', 264, 49, '中等规模'],
  ['开封市鼓楼区中山路与省府西街交叉口北段', '开封市鼓楼区', 248, 46, '中等规模'],
  ['许昌市魏都区许继大道与延安路交叉口西段', '许昌市魏都区', 182, 34, '小规模'],
  ['平顶山市新华区建设路与光明路交叉口附近', '平顶山市新华区', 155, 28, '小规模'],
  ['焦作市解放区解放路与塔南路交叉口东100米', '焦作市解放区', 130, 24, '小规模'],
  ['三门峡市湖滨区黄河路与六峰路交叉口南侧', '三门峡市湖滨区', 105, 19, '小规模'],
  ['漯河市源汇区人民路与交通路交叉口附近', '漯河市源汇区', 92, 17, '小规模'],
  ['鹤壁市淇滨区兴鹤大街与九州路交叉口东侧', '鹤壁市淇滨区', 68, 12, '小规模']
].map((row, index) => ({ id: index + 1, address: row[0], area: row[1], city: row[1].slice(0, 3), stays: row[2], vehicles: row[3], scale: row[4] }))

const cityPositions = {
  南阳市: [29, 68], 郑州市: [50, 34], 洛阳市: [33, 42], 周口市: [64, 58], 商丘市: [76, 45], 信阳市: [60, 78],
  驻马店市: [57, 68], 新乡市: [52, 24], 开封市: [60, 40], 许昌市: [50, 52], 平顶山市: [40, 55], 焦作市: [43, 31],
  三门峡市: [21, 38], 漯河市: [54, 60], 鹤壁市: [58, 18]
}

const regionOptions = computed(() => [...new Set(tanks.map((item) => item.city))])
const filteredTanks = computed(() => tanks
  .filter((item) => !keyword.value || item.address.includes(keyword.value) || item.area.includes(keyword.value))
  .filter((item) => !region.value || item.city === region.value)
  .filter((item) => !scale.value || item.scale === scale.value)
  .sort((a, b) => b.stays - a.stays))

const cityStats = computed(() => {
  const grouped = new Map()
  tanks.forEach((item) => {
    const current = grouped.get(item.city) || { name: item.city, count: 0, vehicles: 0 }
    current.count += 1
    current.vehicles += item.vehicles
    grouped.set(item.city, current)
  })
  return [...grouped.values()]
    .map((item) => ({ ...item, x: cityPositions[item.name]?.[0] || 50, y: cityPositions[item.name]?.[1] || 50 }))
    .sort((a, b) => b.count - a.count)
})
const totalTanks = computed(() => filteredTanks.value.length)
const totalVehicles = computed(() => filteredTanks.value.reduce((sum, item) => sum + item.vehicles, 0))
const scaleStats = computed(() => ['大规模', '中等规模', '小规模'].map((name) => {
  const count = filteredTanks.value.filter((item) => item.scale === name).length
  return { name, count, percent: totalTanks.value ? ((count / totalTanks.value) * 100).toFixed(1) : '0.0' }
}))
const focusPoints = computed(() => Array.from({ length: 18 }, (_, index) => ({
  id: index,
  x: 37 + (index % 6) * 5 + (index % 2) * 1.5,
  y: 36 + Math.floor(index / 6) * 10 + (index % 3) * 1.8,
  heat: 0.35 + (index % 5) * 0.16,
  count: Math.round((selectedTank.value?.stays || 200) * (0.08 + (index % 5) * 0.025))
})))
const selectedCoord = computed(() => {
  const seed = selectedTank.value?.id || 1
  return {
    lng: (113.510835 + seed * 0.013521).toFixed(6),
    lat: (23.087288 + seed * 0.008417).toFixed(6)
  }
})
const stayDetails = computed(() => topVehicles.value.slice(0, 8).map((item, index) => {
  const minute = String(index * 7 + 3).padStart(2, '0')
  const leaveMinute = String(index * 7 + 27).padStart(2, '0')
  const duration = (item.count * 0.67 + index * 2.18).toFixed(2)
  return {
    id: index + 1,
    plate: item.plate,
    enterTime: `2025-10-01 00:${minute}:37`,
    leaveTime: `2025-10-01 00:${leaveMinute}:18`,
    duration
  }
}))
const trendData = computed(() => {
  const stays = selectedTank.value?.stays || 0
  return [
    { label: '4月', value: Math.max(1, Math.round(stays * 0.24)) },
    { label: '5月', value: Math.max(1, Math.round(stays * 0.33)) },
    { label: '6月', value: Math.max(1, Math.round(stays * 0.43)) }
  ]
})
const nearbyList = computed(() => [
  { id: 1, type: '加油站', address: `${selectedTank.value?.area || ''}人民路加油站`, distance: 62 },
  { id: 2, type: '罐区', address: `${selectedTank.value?.area || ''}物流园北侧罐区`, distance: 117 },
  { id: 3, type: '加油站', address: `${selectedTank.value?.area || ''}高速口综合站`, distance: 186 },
  { id: 4, type: '加油站', address: `${selectedTank.value?.area || ''}工业大道南侧站`, distance: 214 },
  { id: 5, type: '罐区', address: `${selectedTank.value?.area || ''}仓储中心东区罐点`, distance: 238 },
  { id: 6, type: '加油站', address: `${selectedTank.value?.area || ''}环城路能源站`, distance: 265 },
  { id: 7, type: '罐区', address: `${selectedTank.value?.area || ''}危化停车场南罐区`, distance: 291 },
  { id: 8, type: '加油站', address: `${selectedTank.value?.area || ''}交通路联合站`, distance: 318 },
  { id: 9, type: '罐区', address: `${selectedTank.value?.area || ''}石化仓配北侧罐点`, distance: 346 }
])
const topVehicles = computed(() => ['豫A7K26P', '豫R5D91X', '豫C2M80L', '豫P9Q17H', '豫S6N33U', '豫B8T62M', '豫D3L08V', '豫U6H75K', '豫E1C39N', '豫Q2W80J'].map((plate, index) => ({
  plate,
  count: Math.max(8, Math.round((selectedTank.value?.vehicles || 80) * (0.78 - index * 0.07))),
  company: ['中原石化物流', '豫能运输', '华龙能源', '豫南供应链', '安达危运', '宛北危运', '瑞通物流', '国储能源', '恒达运输', '豫东油运'][index]
})))

function selectTank(item) {
  selectedTank.value = item
  selectedMapCity.value = item.city
  region.value = item.city
  drawerOpen.value = true
}
function clearSelection() {
  selectedTank.value = null
  selectedMapCity.value = ''
  region.value = ''
  drawerOpen.value = false
}
function handleCityDrilldown(cityName) {
  selectedTank.value = null
  drawerOpen.value = false
  selectedMapCity.value = cityName
  region.value = cityName
}
function ellipsis(text, length) {
  return text.length > length ? `${text.slice(0, length)}...` : text
}
function scaleClass(value) {
  return value === '大规模' ? 'large' : value === '中等规模' ? 'medium' : 'small'
}
</script>
