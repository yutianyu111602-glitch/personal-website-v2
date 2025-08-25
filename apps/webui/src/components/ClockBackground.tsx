import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export const ClockBackground = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours() % 12;
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  // Calculate angles for clock hands
  const secondAngle = (seconds * 6) - 90;
  const minuteAngle = (minutes * 6) + (seconds * 0.1) - 90;
  const hourAngle = (hours * 30) + (minutes * 0.5) - 90;

  return (
    <div className="fixed inset-0 pointer-events-none z-5">
      {/* Subtle Clock Elements Scattered */}
      
      {/* Top Left Clock */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 2, delay: 1 }}
        className="absolute top-16 left-16 w-32 h-32"
      >
        <div className="relative w-full h-full">
          {/* Clock Face */}
          <div className="w-full h-full rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            {/* Hour Markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-4 bg-white/15"
                style={{
                  top: '4px',
                  left: '50%',
                  transformOrigin: '50% 60px',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`
                }}
              />
            ))}
            
            {/* Clock Hands */}
            <div className="absolute inset-4">
              {/* Hour Hand */}
              <motion.div
                className="absolute w-0.5 h-6 bg-white/20 rounded-full"
                style={{
                  bottom: '50%',
                  left: '50%',
                  transformOrigin: '50% 100%',
                }}
                animate={{ rotate: hourAngle }}
                transition={{ duration: 0.5 }}
              />
              
              {/* Minute Hand */}
              <motion.div
                className="absolute w-px h-8 bg-white/25 rounded-full"
                style={{
                  bottom: '50%',
                  left: '50%',
                  transformOrigin: '50% 100%',
                }}
                animate={{ rotate: minuteAngle }}
                transition={{ duration: 0.5 }}
              />
              
              {/* Second Hand */}
              <motion.div
                className="absolute w-px h-10 bg-white/30 rounded-full"
                style={{
                  bottom: '50%',
                  left: '50%',
                  transformOrigin: '50% 100%',
                }}
                animate={{ rotate: secondAngle }}
                transition={{ duration: 0.1 }}
              />
              
              {/* Center Dot */}
              <div className="absolute w-1 h-1 bg-white/30 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Right Clock - Larger */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 2, delay: 1.5 }}
        className="absolute bottom-20 right-20 w-48 h-48"
      >
        <div className="relative w-full h-full">
          {/* Clock Face */}
          <div className="w-full h-full rounded-full border border-white/8 bg-white/3 backdrop-blur-sm">
            {/* Hour Markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-6 bg-white/12"
                style={{
                  top: '6px',
                  left: '50%',
                  transformOrigin: '50% 90px',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`
                }}
              />
            ))}
            
            {/* Clock Hands */}
            <div className="absolute inset-6">
              {/* Hour Hand */}
              <motion.div
                className="absolute w-0.5 h-8 bg-white/15 rounded-full"
                style={{
                  bottom: '50%',
                  left: '50%',
                  transformOrigin: '50% 100%',
                }}
                animate={{ rotate: hourAngle }}
                transition={{ duration: 0.5 }}
              />
              
              {/* Minute Hand */}
              <motion.div
                className="absolute w-px h-12 bg-white/20 rounded-full"
                style={{
                  bottom: '50%',
                  left: '50%',
                  transformOrigin: '50% 100%',
                }}
                animate={{ rotate: minuteAngle }}
                transition={{ duration: 0.5 }}
              />
              
              {/* Second Hand */}
              <motion.div
                className="absolute w-px h-14 bg-white/25 rounded-full"
                style={{
                  bottom: '50%',
                  left: '50%',
                  transformOrigin: '50% 100%',
                }}
                animate={{ rotate: secondAngle }}
                transition={{ duration: 0.1 }}
              />
              
              {/* Center Dot */}
              <div className="absolute w-1.5 h-1.5 bg-white/25 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Digital Time Display - Top Right */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 0.1, y: 0 }}
        transition={{ duration: 1.5, delay: 2 }}
        className="absolute top-8 right-8"
      >
        <div className="font-mono text-2xl text-white/10 tracking-wider">
          {currentTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })}
        </div>
      </motion.div>

      {/* Floating Silver Orbs */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.03, 0.08, 0.03]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/3 w-24 h-24 rounded-full bg-gradient-radial from-white/5 to-transparent"
      />
      
      <motion.div
        animate={{ 
          y: [0, 15, 0],
          opacity: [0.02, 0.06, 0.02]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-1/3 left-1/4 w-32 h-32 rounded-full bg-gradient-radial from-white/4 to-transparent"
      />

      {/* Gear-like Elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 120,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-1/3 right-1/4 w-16 h-16 opacity-5"
      >
        <svg viewBox="0 0 24 24" className="w-full h-full fill-white/10">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
        </svg>
      </motion.div>
    </div>
  );
};