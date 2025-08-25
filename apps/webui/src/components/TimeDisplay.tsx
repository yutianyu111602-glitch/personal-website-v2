import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

interface TimeDisplayProps {
  isWelcomeMode: boolean;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({ isWelcomeMode }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <motion.div
      className={`font-mono transition-all duration-500 ease-out ${
        isWelcomeMode
          ? 'text-white/90 cursor-pointer'
          : 'text-white/70'
      }`}
      style={{
        fontSize: isWelcomeMode ? 'clamp(3rem, 10vw, 8rem)' : '24px',
        fontWeight: isWelcomeMode ? 300 : 400,
        lineHeight: '1',
      }}
      initial={false}
      animate={{
        opacity: isWelcomeMode ? 0.9 : 0.8,
      }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      aria-label={isWelcomeMode ? "点击进入控制台" : undefined}
    >
      {formatTime(currentTime)}
    </motion.div>
  );
};