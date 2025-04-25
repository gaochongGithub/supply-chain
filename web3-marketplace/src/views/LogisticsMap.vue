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
          product: Object 
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
      initMap() {
          if (this.coordinates.length === 0) return;

          const map = L.map(this.$refs.map).setView(this.coordinates[0], 4);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          // 核心参数解析 ========================
          const nodeType = this.productData.product?.base.status || 0;
          const isSold = nodeType >= 1;      // 是否已售出
          const isDelivered = nodeType === 2; // 是否已送达
          // const lastIdx = this.coordinates.length - 1;
          const coordinates = this.coordinates;
          const startPoint = coordinates[0]; // 始终是起点A
          const  endPoint = coordinates[1]; // 中间点B,C...
          const wayPoints = coordinates.slice(2);
          // const wayPoints = coordinates.length > 1 ? 
          //   coordinates[coordinates.length - 1] : null; // 终点Z
          // 起点始终是第一个坐标
          // const startPoint = this.coordinates[0];
          // 终点逻辑：当nodeType>=1时，最后一个坐标是Z
          // const endPoint = isSold ? this.coordinates[1] : null;

          // 路径绘制逻辑 ========================
          let mainRoutePoints = [];
          let pendingRoutePoints = [];
          // 情况1：未售出（只显示起点）
          if (nodeType === 0) {
            // 无需绘制任何路径
            mainRoutePoints = [startPoint];
          }else if (nodeType === 1) {
            mainRoutePoints = [startPoint, ...wayPoints];
            // if (endPoint) {
            //   pendingRoutePoints = wayPoints.length > 0 ? 
            //     [wayPoints[wayPoints.length-1], endPoint] : 
            //     [startPoint, endPoint];
            // }
          }
          // 情况3: 已送达
          else if (nodeType === 2) {
            mainRoutePoints = [startPoint, ...wayPoints];
            if (endPoint) mainRoutePoints.push(endPoint);
          }
          // 绘制主路径（起点到中间点或终点）
          if (mainRoutePoints.length >= 2) {
            L.polyline(mainRoutePoints, {
              color: '#52c41a',
              weight: 3,
              dashArray: isDelivered ? null : '5,5'
            }).addTo(map);
          }

          // 绘制悬空路径（最后一个中间点到终点）
          if (pendingRoutePoints.length === 2) {//红色
            L.polyline(pendingRoutePoints, {
              color: '#ff4d4f',
              weight: 2,
              dashArray: '5,5'
            }).addTo(map);
          }

          // 标记点绘制逻辑 ======================
          this.coordinates.forEach(([lat, lng], index) => {
            let markerType = 'middle';
            if (index === 0) markerType = 'start';
            if (isSold && index === 1) markerType = 'end';

            const markerConfig = {
              start: { color: '#1890ff', text: 'A' },
              end: { color: isDelivered ? '#52c41a' : '#ff4d4f', text: 'Z' },
              middle: { color: '#52c41a', text: index } // 中间点显示序号
            }[markerType];

            const icon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                background: ${markerConfig.color};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
              ">${markerConfig.text}</div>`
            });

            L.marker([lat, lng], { icon })
              .addTo(map)
              .bindPopup(this.getPopupContent(index, markerType));
          });
        },

        getPopupContent(index, markerType) {
          const typeMap = {
            start: 'Start Point',
            end: 'End Point',
            middle: 'Waypoint'
          };
          const logistics = this.productData.product?.logistics || [];
          const pointInfo = logistics[index] || {};
          return `
            <div style="min-width: 180px">
              <h4 style="margin:0 0 8px">${typeMap[markerType]}</h4>
              <p style="margin:0">${pointInfo.path || '未知地址'}</p>
              ${pointInfo.timestamp ? `
                <p style="margin:8px 0 0;color:#666;font-size:0.9em">
                  ${new Date(Number(pointInfo.timestamp)*1000).toLocaleString()}
                </p>
              ` : ''}
              ${markerType === 'end' ? `
                <p style="margin:8px 0 0;color:#${this.productData.product?.base.status === 2 ? '52c41a' : 'ff4d4f'}">
                  ${this.productData.product.base.status === 2 ? 'Delivered' : 'To be delivered'}
                </p>
              ` : ''}
            </div>
          `;
        }

      // // 初始化地图
      // initMap() {
      //   if (this.coordinates.length > 0) {
      //     const map = L.map(this.$refs.map).setView(this.coordinates[0], 4); // 默认以第一个点为中心
      //     // const map1 = L.map(this.$refs.map).setView(this.coordinates[1], 4); // 默认以第一个点为中心
      //     // 添加地图图层
      //     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //       attribution: '© OpenStreetMap contributors'
      //     }).addTo(map);
  
      //     // // 绘制路线
      //     L.polyline(this.coordinates, { color: '#1890ff', weight: 3 }).addTo(map);

      //     // 添加标记
      //     this.coordinates.forEach(([lat, lng], index) => {
      //       // let markerColor = 'blue';  // 默认蓝色
      //       // if (index === 1) {
      //       //     markerColor = 'red';  // 第二个标记红色
      //       // }

      //       // // 使用 L.icon 来自定义图标
      //       // const icon = L.icon({
      //       //     iconUrl: `https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png`, // 使用默认图标
      //       //     iconSize: [25, 41],
      //       //     iconAnchor: [12, 41], // 确保图标在坐标位置正确
      //       //     popupAnchor: [1, -34],
      //       //     // 修改图标的颜色
      //       //     className: `custom-marker ${markerColor}`
      //       // });
      //       // , { icon }
      //       L.marker([lat, lng]).addTo(map)
      //         .bindPopup(`Location ${index + 1}: ${this.productData.logistics[index].path}`);
      //     });
      //   }
      // }
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
  