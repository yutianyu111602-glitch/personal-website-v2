import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { getTranslations } from "./util/i18n";
import { SpaceStationSimulator, SpaceStationCoordinates } from "./util/spaceStationSimulator";

interface EnhancedSpaceStationStatusProps {
  language: string;
}

interface LocationData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timezone: string;
  accuracy: number;
  loading: boolean;
  error: boolean;
}

// 现代化极简空间站面板 - 无毛玻璃重设计
export const EnhancedSpaceStationStatus: React.FC<EnhancedSpaceStationStatusProps> = ({ language }) => {
  const t = getTranslations(language);
  const [location, setLocation] = useState<LocationData>({
    city: '',
    country: '',
    latitude: 0,
    longitude: 0,
    altitude: 0,
    timezone: '',
    accuracy: 0,
    loading: true,
    error: false
  });

  // 空间站模拟器状态
  const [spaceStationData, setSpaceStationData] = useState<SpaceStationCoordinates>({
    latitude: 0,
    longitude: 0,
    altitude: 408, // 默认轨道高度408km
    velocity: 7.66,
    groundSpeed: 27580,
    orbitalPeriod: 92.9,
    targetLocation: '天宫空间站'
  });

  // 空间站模拟器实例
  const [spaceStationSimulator, setSpaceStationSimulator] = useState<SpaceStationSimulator | null>(null);

  // 获取地理位置信息
  useEffect(() => {
    const getLocation = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
          );
        });

        const { latitude, longitude, altitude, accuracy } = position.coords;

        // 获取位置详情
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${language === 'zh' ? 'zh' : 'en'}`
          );
          
          if (response.ok) {
            const data = await response.json();
            setLocation({
              city: data.city || data.locality || (language === 'zh' ? '未知城市' : 'Unknown City'),
              country: data.countryName || (language === 'zh' ? '未知国家' : 'Unknown Country'),
              latitude: Math.round(latitude * 1000000) / 1000000,
              longitude: Math.round(longitude * 1000000) / 1000000,
              altitude: altitude || 0,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              accuracy: accuracy || 0,
              loading: false,
              error: false
            });

            // 初始化空间站模拟器，使用用户位置作为观测点
            const simulator = new SpaceStationSimulator({
              lat: latitude,
              lng: longitude,
              name: data.city || data.locality || '观测点'
            });
            setSpaceStationSimulator(simulator);
          } else {
            throw new Error('API request failed');
          }
        } catch (apiError) {
          console.warn('Location API failed:', apiError instanceof Error ? apiError.message : 'Unknown error');
          setLocation({
            city: language === 'zh' ? '位置信息' : 'Location Data',
            country: language === 'zh' ? '地球' : 'Earth',
            latitude: Math.round(latitude * 1000000) / 1000000,
            longitude: Math.round(longitude * 1000000) / 1000000,
            altitude: altitude || 0,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            accuracy: accuracy || 0,
            loading: false,
            error: false
          });

          // 使用用户位置初始化模拟器
          const simulator = new SpaceStationSimulator({
            lat: latitude,
            lng: longitude,
            name: '观测点'
          });
          setSpaceStationSimulator(simulator);
        }
      } catch (err) {
        console.warn('Location error:', err instanceof Error ? err.message : 'Geolocation failed');
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const [region, city] = timezone.split('/');
          setLocation({
            city: city?.replace(/_/g, ' ') || (language === 'zh' ? '未知' : 'Unknown'),
            country: region || (language === 'zh' ? '未知' : 'Unknown'),
            latitude: 0,
            longitude: 0,
            altitude: 0,
            timezone: timezone,
            accuracy: 0,
            loading: false,
            error: true
          });

          // 使用默认位置初始化模拟器
          const simulator = new SpaceStationSimulator({
            lat: 39.9042,
            lng: 116.4074,
            name: '北京'
          });
          setSpaceStationSimulator(simulator);
        } catch (fallbackError) {
          console.error('Fallback location failed:', fallbackError);
          setLocation({
            city: language === 'zh' ? '定位失败' : 'Location Failed',
            country: language === 'zh' ? '地球' : 'Earth',
            latitude: 0,
            longitude: 0,
            altitude: 0,
            timezone: 'UTC',
            accuracy: 0,
            loading: false,
            error: true
          });
        }
      }
    };

    getLocation();
  }, [language]);

  // 更新空间站数据
  useEffect(() => {
    if (!spaceStationSimulator) return;

    const updateSpaceStationData = () => {
      const coords = spaceStationSimulator.getCurrentCoordinates();
      setSpaceStationData(coords);
    };

    // 立即更新一次
    updateSpaceStationData();

    // 每5秒更新一次空间站数据
    const interval = setInterval(updateSpaceStationData, 5000);

    return () => clearInterval(interval);
  }, [spaceStationSimulator]);

  // 计算距离地面高度 - 现在显示卫星轨道高度
  const getSatelliteAltitude = () => {
    if (spaceStationData.altitude > 0) {
      return `${spaceStationData.altitude.toFixed(1)}km`;
    }
    return '408.0km'; // 默认ISS轨道高度
  };

  // 获取轨道速度
  const getOrbitalVelocity = () => {
    return `${spaceStationData.velocity.toFixed(2)}km/s`;
  };

  // 获取地面投影速度
  const getGroundSpeed = () => {
    return `${spaceStationData.groundSpeed.toFixed(0)}km/h`;
  };

  // 模拟观测站编号
  const getObservationStation = () => {
    if (location.latitude === 0 && location.longitude === 0) return 'N/A';
    const stationId = Math.abs(Math.round(location.latitude * 100 + location.longitude * 100)) % 9999;
    return `TG-${stationId.toString().padStart(4, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="relative overflow-hidden"
      style={{
        width: '520px',
        height: '280px',
      }}
    >
      {/* 主容器 - 应用设计规范的玻璃态组件 */}
      <div 
        className="w-full h-full relative glass-morphism-strong"
        style={{
          borderRadius: '16px',
        }}
      >
        {/* 科技感网格背景 */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-30">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(192, 197, 206, 0.1)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* 发光边框效果 */}
        <motion.div 
          className="absolute inset-0 rounded-2xl"
          style={{
            border: '1px solid rgba(192, 197, 206, 0.4)',
            boxShadow: '0 0 20px rgba(192, 197, 206, 0.15), inset 0 0 20px rgba(192, 197, 206, 0.05)',
          }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(192, 197, 206, 0.15), inset 0 0 20px rgba(192, 197, 206, 0.05)',
              '0 0 30px rgba(192, 197, 206, 0.25), inset 0 0 30px rgba(192, 197, 206, 0.08)',
              '0 0 20px rgba(192, 197, 206, 0.15), inset 0 0 20px rgba(192, 197, 206, 0.05)'
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* 顶部装饰线 */}
        <div className="absolute top-0 left-8 right-8 h-px">
          <motion.div 
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(192, 197, 206, 0.6) 20%, rgba(192, 197, 206, 0.8) 50%, rgba(192, 197, 206, 0.6) 80%, transparent 100%)'
            }}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="p-8 h-full flex flex-col justify-between">
          {/* 顶部：天宫空间站标识 */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              {/* 天宫标识 - 重新设计 */}
              <div className="relative">
                <motion.div
                  className="w-12 h-12 relative flex items-center justify-center"
                  style={{
                    border: '2px solid rgba(192, 197, 206, 0.4)',
                    borderRadius: '8px',
                    background: 'rgba(192, 197, 206, 0.05)',
                  }}
                  animate={{
                    borderColor: [
                      'rgba(192, 197, 206, 0.4)',
                      'rgba(192, 197, 206, 0.8)',
                      'rgba(192, 197, 206, 0.4)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="text-white/90"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9l-5.91 8.74L12 22l-4.09-4.26L2 9l6.91-.74L12 2z"/>
                    </svg>
                  </motion.div>
                  
                  {/* 脉冲环 */}
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2"
                    style={{
                      borderColor: 'rgba(192, 197, 206, 0.6)',
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0, 0.8, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                </motion.div>
              </div>
              
              <div>
                <div className="text-white/95 font-mono text-lg font-medium uppercase tracking-wider">
                  {language === 'zh' ? '天宫空间站' : 'TIANGONG STATION'}
                </div>
              </div>
            </div>

            {/* 状态指示器群 */}
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#00ff88' }}
                />
                <div className="text-white/80 font-mono text-sm uppercase tracking-wider">
                  {language === 'zh' ? '在线' : 'ONLINE'}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#00aaff' }}
                />
                <div className="text-white/60 font-mono text-xs uppercase tracking-wider">
                  {language === 'zh' ? '数据同步' : 'SYNC'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 中部：数据面板 - 优化布局，应用设计规范 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex-1 flex items-center"
          >
            <div className="w-full grid grid-cols-3 gap-6">
              {/* 第一行：位置信息 */}
              <div className="text-center relative p-4 rounded-lg glass-morphism">
                <div className="text-white/60 font-mono text-xs uppercase tracking-widest mb-3">
                  {language === 'zh' ? '纬度' : 'LATITUDE'}
                </div>
                <div className="text-white/95 font-mono text-xl font-medium mb-2">
                  {location.loading ? '---°' : `${location.latitude.toFixed(4)}°`}
                </div>
                <motion.div 
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5"
                  style={{ background: 'var(--accent)' }}
                  animate={{ scaleX: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <div className="text-center relative p-4 rounded-lg glass-morphism">
                <div className="text-white/60 font-mono text-xs uppercase tracking-widest mb-3">
                  {language === 'zh' ? '经度' : 'LONGITUDE'}
                </div>
                <div className="text-white/95 font-mono text-xl font-medium mb-2">
                  {location.loading ? '---°' : `${location.longitude.toFixed(4)}°`}
                </div>
                <motion.div 
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5"
                  style={{ background: 'var(--accent)' }}
                  animate={{ scaleX: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
              </div>

              <div className="text-center relative p-4 rounded-lg glass-morphism">
                <div className="text-white/60 font-mono text-xs uppercase tracking-widest mb-3">
                  {language === 'zh' ? '轨道高度' : 'ORBITAL ALT'}
                </div>
                <div className="text-white/95 font-mono text-xl font-medium mb-2">
                  {location.loading ? '---km' : getSatelliteAltitude()}
                </div>
                <motion.div 
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5"
                  style={{ background: 'var(--accent)' }}
                  animate={{ scaleX: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
              </div>

              {/* 第二行：轨道信息 */}
              <div className="text-center relative p-4 rounded-lg glass-morphism">
                <div className="text-white/60 font-mono text-xs uppercase tracking-widest mb-3">
                  {language === 'zh' ? '轨道速度' : 'ORBITAL VEL'}
                </div>
                <div className="text-white/95 font-mono text-xl font-medium mb-2">
                  {location.loading ? '---km/s' : getOrbitalVelocity()}
                </div>
                <motion.div 
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5"
                  style={{ background: 'var(--accent)' }}
                  animate={{ scaleX: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                />
              </div>

              <div className="text-center relative p-4 rounded-lg glass-morphism">
                <div className="text-white/60 font-mono text-xs uppercase tracking-widest mb-3">
                  {language === 'zh' ? '地面速度' : 'GROUND SPEED'}
                </div>
                <div className="text-white/95 font-mono text-xl font-medium mb-2">
                  {location.loading ? '---km/h' : getGroundSpeed()}
                </div>
                <motion.div 
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5"
                  style={{ background: 'var(--accent)' }}
                  animate={{ scaleX: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
              </div>

              <div className="text-center relative p-4 rounded-lg glass-morphism">
                <div className="text-white/50 font-mono text-xs uppercase tracking-widest mb-3">
                  {language === 'zh' ? '轨道周期' : 'ORBITAL PERIOD'}
                </div>
                <div className="text-white/95 font-mono text-xl font-medium mb-2">
                  {location.loading ? '---min' : `${spaceStationData.orbitalPeriod.toFixed(1)}min`}
                </div>
                <motion.div 
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5"
                  style={{ background: 'var(--accent)' }}
                  animate={{ scaleX: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
                />
              </div>
            </div>
          </motion.div>

          {/* 底部：位置信息 - 优化布局，应用设计规范 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-6">
              {/* 位置信息 */}
              <div className="p-3 rounded-lg glass-morphism min-w-[140px]">
                <div className="text-white/60 font-mono text-xs uppercase tracking-wider mb-2">
                  {language === 'zh' ? '地理位置' : 'GEOGRAPHIC LOCATION'}
                </div>
                <div className="text-white/95 font-mono text-sm font-medium">
                  {location.loading ? (language === 'zh' ? '定位中...' : 'LOCATING...') : 
                   location.error ? (language === 'zh' ? '位置未知' : 'UNKNOWN LOCATION') :
                   `${location.city}, ${location.country}`}
                </div>
              </div>

              {/* 监测站编号 */}
              <div className="p-3 rounded-lg glass-morphism min-w-[120px]">
                <div className="text-white/60 font-mono text-xs uppercase tracking-wider mb-2">
                  {language === 'zh' ? '监测站编号' : 'STATION ID'}
                </div>
                <div className="text-white/95 font-mono text-sm font-medium tracking-wider">
                  {getObservationStation()}
                </div>
              </div>

              {/* 轨道状态 */}
              <div className="p-3 rounded-lg glass-morphism min-w-[140px]">
                <div className="text-white/60 font-mono text-xs uppercase tracking-wider mb-2">
                  {language === 'zh' ? '轨道状态' : 'ORBIT STATUS'}
                </div>
                <div className="text-white/95 font-mono text-sm font-medium tracking-wider">
                  {spaceStationSimulator ? 
                    (() => {
                      const coords = spaceStationSimulator.getCurrentCoordinates();
                      return SpaceStationSimulator.getOrbitStatus(coords);
                    })() : 
                    (language === 'zh' ? '初始化中' : 'INITIALIZING')
                  }
                </div>
              </div>
            </div>

            {/* 加载指示器 */}
            {location.loading && (
              <motion.div className="flex items-center space-x-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white/80 rounded-full"
                />
                <div className="text-white/60 font-mono text-xs uppercase">
                  {language === 'zh' ? '加载中' : 'LOADING'}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* 底部装饰线 */}
        <div className="absolute bottom-0 left-8 right-8 h-px">
          <motion.div 
            className="h-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(192, 197, 206, 0.4) 20%, rgba(192, 197, 206, 0.6) 50%, rgba(192, 197, 206, 0.4) 80%, transparent 100%)'
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};