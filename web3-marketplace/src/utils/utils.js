// utils/orderIdGenerator.js


export function generateOrderId() {
    let lastTimestamp = 0
    let sequence = 0
    const timestamp = Date.now()

    // 时间戳部分（34位中的前27位 → 取后7位数字）
    const tsPart = timestamp.toString().slice(-7)

    // 序列号部分（防止同一毫秒内重复）
    if (timestamp === lastTimestamp) {
        sequence = (sequence + 1) % 1000 // 支持每秒1000个订单
    } else {
        sequence = 0
        lastTimestamp = timestamp
    }

    // 组合数字：时间戳后7位 + 3位序列号 → 截取后7位
    const fullId = parseInt(`${tsPart}${sequence.toString().padStart(3, '0')}`)
    return fullId % 10000000 // 确保7位数
}

//商品种类
export function getProductType(pType) {
    const pTyoeMap = {
        0: 'Clothing',
        1: 'Jewelry',
        2: 'Food'
    };
    return pTyoeMap[pType] || 'None';
}

//返回英文时间
export function getUSTime(value) {
    if (!value) return '';
    return new Date(Number(value) * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

//返回英文时间
export function getSize(size) {
    const clothingSizeMap = {
        0: 'S',
        1: 'M',
        2: 'L',
        3: 'XL',
        4: 'XXL'
    };
    return clothingSizeMap[size] || 'None';
}
//生产日期，保质期
//返回英文时间
export function getProductStatus(status) {
    const productStatus = {
        0: 'NotSold',
        1: 'InTransit',
        2: 'Delivered',
    };
    return productStatus[status] || 'None';
}
//珠宝成分
export function getJewelryMaterial(status) {
    const jewelryMaterial = {
        0: 'Silver',
        1: 'Gold',
        2: 'Diamond',
    };
    return jewelryMaterial[status] || 'None';
}

//食物类型
export function getFoodType(type) {
    const foodType = {
        0: 'Fruit',
        1: 'Rice',
        2: 'Noodles',
        3: 'Meat'
    };
    return foodType[type] || 'None';
}

export function setLocationCache(cacheKey, location) {
    localStorage.setItem(cacheKey, JSON.stringify(location));
}

export function getLocationCache(cacheKey) {
    // 获取缓存数据并转回对象
    const cachedLocation = localStorage.getItem(cacheKey);
    if (cachedLocation) {
      return JSON.parse(cachedLocation); // 如果缓存存在，返回缓存的地理位置
    }
    return null; // 如果缓存不存在，返回 null
}