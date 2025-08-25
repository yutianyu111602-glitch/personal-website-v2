import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface DigitalClockProps {
  showSeconds?: boolean;
  className?: string;
}

export const DigitalClock = ({ showSeconds = true, className = '' }: DigitalClockProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    if (showSeconds) {
      return { hours, minutes, seconds };
    }
    return { hours, minutes };
  };

  const { hours, minutes, seconds } = formatTime(time);

  return (
    <div className={`font-mono ${className}`}>
      <div className="flex items-center justify-center space-x-1">
        {/* Hours */}
        <motion.div 
          key={hours}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl lg:text-9xl font-light text-white/80 tracking-wider"
          style={{
            textShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)',
            fontFeatureSettings: '"tnum"'
          }}
        >
          {hours}
        </motion.div>
        
        {/* Separator */}
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-6xl md:text-8xl lg:text-9xl font-light text-white/60"
        >
          :
        </motion.div>
        
        {/* Minutes */}
        <motion.div 
          key={minutes}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl lg:text-9xl font-light text-white/80 tracking-wider"
          style={{
            textShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)',
            fontFeatureSettings: '"tnum"'
          }}
        >
          {minutes}
        </motion.div>

        {showSeconds && (
          <>
            {/* Separator */}
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              className="text-4xl md:text-6xl lg:text-7xl font-light text-white/40"
            >
              :
            </motion.div>
            
            {/* Seconds */}
            <motion.div 
              key={seconds}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl lg:text-7xl font-light text-white/60 tracking-wider"
              style={{
                textShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
                fontFeatureSettings: '"tnum"'
              }}
            >
              {seconds}
            </motion.div>
          </>
        )}
      </div>
      
      {/* Date */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-4 text-lg md:text-xl text-white/50 tracking-[0.2em] uppercase"
      >
        {time.toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </motion.div>
    </div>
  );
};