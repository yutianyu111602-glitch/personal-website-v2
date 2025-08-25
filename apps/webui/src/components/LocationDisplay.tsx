import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface LocationData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const LocationDisplay = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const getLocation = async () => {
      try {
        // Get user's position with more robust error handling
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            resolve,
            (error) => {
              // 提供更详细的错误信息
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  reject(new Error('用户拒绝了地理位置请求'));
                  break;
                case error.POSITION_UNAVAILABLE:
                  reject(new Error('位置信息不可用'));
                  break;
                case error.TIMEOUT:
                  reject(new Error('获取位置信息超时'));
                  break;
                default:
                  reject(new Error('获取位置信息时发生未知错误'));
                  break;
              }
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 } // 降低精度要求，增加缓存时间
          );
        });

        const { latitude, longitude } = position.coords;

        // Get location details using a public API with better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            { signal: controller.signal }
          );
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
          }

          const data = await response.json();
          
          setLocation({
            city: data.city || data.locality || 'Unknown City',
            country: data.countryName || 'Unknown Country',
            latitude: Math.round(latitude * 1000) / 1000,
            longitude: Math.round(longitude * 1000) / 1000,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.warn('地理编码API失败，使用基础位置信息:', fetchError);
          
          // 使用GPS坐标但不查询城市名称
          setLocation({
            city: '未知位置',
            country: '未知国家',
            latitude: Math.round(latitude * 1000) / 1000,
            longitude: Math.round(longitude * 1000) / 1000,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
        }
        
      } catch (err) {
        console.warn('地理位置获取失败，使用时区推测:', err);
        
        // Fallback to timezone-based location estimation
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const parts = timezone.split('/');
          
          // 更智能的时区解析
          let city = '未知城市';
          let country = '未知国家';
          
          if (parts.length >= 2) {
            country = parts[0].replace(/_/g, ' ');
            city = parts[parts.length - 1].replace(/_/g, ' ');
          } else if (parts.length === 1) {
            country = parts[0].replace(/_/g, ' ');
          }
          
          setLocation({
            city,
            country,
            latitude: 0,
            longitude: 0,
            timezone
          });
          setError(false);
        } catch (timezoneError) {
          console.error('时区解析也失败了:', timezoneError);
          // 使用完全静态的fallback
          setLocation({
            city: '地球',
            country: '太阳系',
            latitude: 0,
            longitude: 0,
            timezone: 'UTC'
          });
          setError(false); // 即使使用fallback也不显示错误
        }
      } finally {
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        className="fixed bottom-8 left-8 text-white/10 text-sm font-mono"
      >
        Locating...
      </motion.div>
    );
  }

  if (error || !location) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 0.08, y: 0 }}
      transition={{ duration: 1.5, delay: 1 }}
      className="fixed bottom-8 left-8 text-white/10 font-mono text-sm space-y-1"
    >
      <div className="flex items-center space-x-2">
        <div className="w-1 h-1 bg-white/20 rounded-full animate-pulse" />
        <span>{location.city}, {location.country}</span>
      </div>
      
      <div className="text-white/8 text-xs space-y-0.5 pl-3">
        <div>{location.latitude}°, {location.longitude}°</div>
        <div>{location.timezone}</div>
      </div>
    </motion.div>
  );
};