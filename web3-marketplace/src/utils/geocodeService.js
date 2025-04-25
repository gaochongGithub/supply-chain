// src/services/geocodeService.js
import axios from 'axios';

// 地理编码：输入地点，返回经纬度
export async function geocode(address) {
  try {
    // 检查地址是否为无效的数字或其他无意义字符串
    if (/^\d+$/.test(address)) {  // 如果地址仅是纯数字
      throw new Error(`Invalid address input: "${address}". Please provide a valid location.`);
    }

    // 发送地理编码请求
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );

    if (!response.data || response.data.length === 0) {
      // throw new Error(`Address "${address}" not found`);
      return []
    }

    const result = response.data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    // 经度和纬度有效性检查：确保在合理的范围内
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return []
      // throw new Error(`Invalid coordinates for address: "${address}"`);
    }
    // 验证返回的地址的相关性：重要性（importance）值检查
    if (result.importance < 0.5) {
      return []
      // throw new Error(`Address "${address}" is not a significant location.`);
    }
    // 如果地址名没有实际意义或与用户输入不匹配，可以排除
    if (!result.display_name || result.display_name.includes('Unknown') || result.display_name.includes('N/A')) {
      // throw new Error(`Address "${address}" corresponds to an unknown location.`);
      return []
    }
    // 返回经纬度
    return [lat, lon];
  } catch (error) {
    // 如果出现错误，抛出错误信息
    throw new Error(`Geocoding failed: ${error.message}`);
  }
}

// 地理编码：输入地点，返回经纬度
// export async function geocode(address) {
//   try {
//     const response = await axios.get(
//       `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
//     );
//     console.log(response, address, "这也有坐标？？？")
//     if (!response.data || response.data.length === 0) {
//       throw new Error(`Address "${address}" not found`);
//     }
//     return [parseFloat(response.data[0].lat), parseFloat(response.data[0].lon)];
//   } catch (error) {
//     throw new Error(`Geocoding failed: ${error.message}`);
//   }
// }

// 逆地理编码：输入经纬度，返回城市级别的地址名称
export async function reverseGeocode(lat, lon) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    if (!response.data) {
      throw new Error(`Location not found for coordinates [${lat}, ${lon}]`);
    }
    // 使用 display_name 提取详细地址
    const displayName = response.data.display_name;
    // console.log("Display Name:", displayName);  // 输出完整地址信息

    // 使用正则匹配或字符串拆分来提取城市级别的地址
    const cityMatch = displayName.match(/([^\s]+市)/);  // 查找城市名（例如深圳市）

    if (cityMatch) {
      return cityMatch[0];  // 返回匹配到的城市名称（如“深圳市”）
    } else {
      // 如果没有匹配到城市名，则返回区名或其它信息
      const city = response.data.address.city || response.data.address.state || response.data.address.country;
      return city || "Unknown location";
    }
  } catch (error) {
    throw new Error(`Reverse geocoding failed: ${error.message}`);
  }
}
