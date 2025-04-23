<template>
    <div class="logistics-map-container" style="height: 100%; position: relative;">
      <!-- 显示加载状态 -->
      <div v-if="isLoading" class="loading-overlay">
        loading Map...
      </div>
  
      <div ref="map" style="height: 100%; width: 100%;"></div>
    </div>
  </template>
  
  <script>
  import L from 'leaflet';
  // import { geocode } from '@/utils/geocodeService';
  
  export default {
    props: {
      productData: {
        type: Object,
        default: () => ({ 
          pointArray: [],
          logistics: Object 
        })
      }
    },
    data() {
      return {
        coordinates: [],  // 存储转换后的坐标
        isLoading: false, // 加载状态
      };
    },
    methods: {
      // 获取坐标
      async fetchCoordinates() {
        if (!this.productData.pointArray || this.productData.pointArray.length === 0) return;
  
        this.isLoading = true;

        try {
          let locations = this.productData.pointArray;
          const points = [];
          for (const address of locations) {
            points.push(address);
          }
          this.coordinates = points;
          this.initMap(); // 初始化地图
        } catch (error) {
          console.error("绘制路径失败:", error);
        } finally {
          this.isLoading = false;
        }
      },
      // 初始化地图
      initMap() {
        if (this.coordinates.length > 0) {
          const map = L.map(this.$refs.map).setView(this.coordinates[0], 4); // 默认以第一个点为中心
          // const map1 = L.map(this.$refs.map).setView(this.coordinates[1], 4); // 默认以第一个点为中心
          // 添加地图图层
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
  
          // // 绘制路线
          L.polyline(this.coordinates, { color: '#1890ff', weight: 3 }).addTo(map);

          // 添加标记
          this.coordinates.forEach(([lat, lng], index) => {
            // let markerColor = 'blue';  // 默认蓝色
            // if (index === 1) {
            //     markerColor = 'red';  // 第二个标记红色
            // }

            // // 使用 L.icon 来自定义图标
            // const icon = L.icon({
            //     iconUrl: `https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png`, // 使用默认图标
            //     iconSize: [25, 41],
            //     iconAnchor: [12, 41], // 确保图标在坐标位置正确
            //     popupAnchor: [1, -34],
            //     // 修改图标的颜色
            //     className: `custom-marker ${markerColor}`
            // });
            // , { icon }
            L.marker([lat, lng]).addTo(map)
              .bindPopup(`Location ${index + 1}: ${this.productData.logistics[index].path}`);
          });
        }
      }
    },
    mounted() {
      this.fetchCoordinates(); // 加载时获取坐标
    },
  };
  </script>
  
  <style scoped>
  .loading-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    background: white;
    padding: 10px;
    border-radius: 5px;
  }
  </style>
  