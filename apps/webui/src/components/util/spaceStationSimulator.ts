// 空间站轨道模拟器
export interface SpaceStationCoordinates {
  latitude: number;
  longitude: number;
  altitude: number; // 海拔高度 (km)
  velocity: number; // 轨道速度 (km/s)
  groundSpeed: number; // 地面投影速度 (km/h)
  orbitalPeriod: number; // 轨道周期 (分钟)
  targetLocation: string; // 观测目标地点
}

export class SpaceStationSimulator {
  private baseLocation: { lat: number; lng: number; name: string };
  private startTime: number;
  private orbitalInclination: number = 51.6; // ISS轨道倾角
  private meanAltitude: number = 408; // 平均海拔高度 (km)
  private orbitalVelocity: number = 7.66; // 轨道速度 (km/s)
  private orbitalPeriod: number = 92.9; // 轨道周期 (分钟)

  constructor(baseLocation: { lat: number; lng: number; name: string }) {
    this.baseLocation = baseLocation;
    this.startTime = Date.now();
  }

  // 获取当前空间站坐标
  getCurrentCoordinates(): SpaceStationCoordinates {
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - this.startTime) / (1000 * 60);
    
    // 计算轨道位置 (简化模型)
    const orbitalProgress = (elapsedMinutes / this.orbitalPeriod) % 1;
    const orbitalAngle = orbitalProgress * 2 * Math.PI;
    
    // 基于基础位置计算轨道坐标
    const latitudeOffset = Math.sin(orbitalAngle) * 15; // ±15度变化
    const longitudeOffset = (elapsedMinutes * 360 / this.orbitalPeriod) % 360;
    
    // 计算实际坐标
    let latitude = this.baseLocation.lat + latitudeOffset;
    let longitude = ((this.baseLocation.lng + longitudeOffset + 180) % 360) - 180;
    
    // 限制纬度范围
    latitude = Math.max(-this.orbitalInclination, Math.min(this.orbitalInclination, latitude));
    
    // 添加高度变化模拟 (椭圆轨道)
    const altitudeVariation = Math.sin(orbitalAngle * 2) * 15;
    const altitude = this.meanAltitude + altitudeVariation;
    
    // 计算地面投影速度
    const groundSpeed = this.orbitalVelocity * Math.cos(Math.abs(latitude) * Math.PI / 180) * 3600;
    
    return {
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      altitude: Number(altitude.toFixed(1)),
      velocity: this.orbitalVelocity,
      groundSpeed: Number(groundSpeed.toFixed(0)),
      orbitalPeriod: this.orbitalPeriod,
      targetLocation: this.baseLocation.name
    };
  }

  // 更新观测目标
  updateTargetLocation(newLocation: { lat: number; lng: number; name: string }) {
    this.baseLocation = newLocation;
  }

  // 格式化坐标显示
  static formatCoordinates(coords: SpaceStationCoordinates): string {
    const latDir = coords.latitude >= 0 ? 'N' : 'S';
    const lngDir = coords.longitude >= 0 ? 'E' : 'W';
    
    return `${Math.abs(coords.latitude).toFixed(4)}°${latDir} ${Math.abs(coords.longitude).toFixed(4)}°${lngDir}`;
  }

  // 获取轨道状态描述
  static getOrbitStatus(coords: SpaceStationCoordinates): string {
    const timeInOrbit = Date.now() % (coords.orbitalPeriod * 60 * 1000);
    const progressPercent = Math.floor((timeInOrbit / (coords.orbitalPeriod * 60 * 1000)) * 100);
    
    if (progressPercent < 25) return "上升轨道";
    if (progressPercent < 50) return "北半球过境"; 
    if (progressPercent < 75) return "下降轨道";
    return "南半球过境";
  }
}

// 默认的观测位置数据库
export const defaultLocations = [
  { lat: 39.9042, lng: 116.4074, name: "北京" },
  { lat: 31.2304, lng: 121.4737, name: "上海" },
  { lat: 22.3193, lng: 114.1694, name: "香港" },
  { lat: 35.6762, lng: 139.6503, name: "东京" },
  { lat: 40.7128, lng: -74.0060, name: "纽约" },
  { lat: 51.5074, lng: -0.1278, name: "伦敦" },
  { lat: 48.8566, lng: 2.3522, name: "巴黎" },
  { lat: -33.8688, lng: 151.2093, name: "悉尼" }
];

// 从城市名称获取坐标
export function getLocationFromName(cityName: string): { lat: number; lng: number; name: string } {
  const location = defaultLocations.find(loc => 
    loc.name.toLowerCase().includes(cityName.toLowerCase()) ||
    cityName.toLowerCase().includes(loc.name.toLowerCase())
  );
  
  if (location) {
    return location;
  }
  
  // 如果找不到匹配，返回北京作为默认值
  return defaultLocations[0];
}