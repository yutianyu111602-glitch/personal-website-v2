import React, { useEffect, useRef } from 'react';

/**
 * 可视化覆盖层（合成到背景上）
 * - 仅使用 Canvas 与 CSS 混合模式，不触碰音频实例
 * - Esc 退出由外层 App 处理
 */
export interface VisualizerOverlayProps {
  highFps?: boolean; // Focus 模式下可提升动画速度
  blendMode?: React.CSSProperties['mixBlendMode'];
  opacity?: number;
}

export const VisualizerOverlay: React.FC<VisualizerOverlayProps> = ({ highFps = true, blendMode = 'screen', opacity = 0.85 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef<number>(0);

  const fit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = Math.max(640, window.innerWidth);
    const h = Math.max(360, window.innerHeight);
    canvas.width = w;
    canvas.height = h;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;

    // 背景渐变
    ctx.globalAlpha = 0.9;
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, '#0b0b16');
    g.addColorStop(1, '#0e0f1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // 叠加动态线
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (let x = 0; x < width; x += 6) {
      const y = height / 2 + Math.sin((x + tRef.current) / 40) * 30 + Math.sin((x + tRef.current) / 13) * 12;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(192, 197, 206, 0.55)';
    ctx.stroke();

    tRef.current += highFps ? 2.2 : 1.2;
    rafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    fit();
    draw();
    window.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('resize', fit);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highFps]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1, // 背景上层、内容下层请由外层控制
        pointerEvents: 'none',
        mixBlendMode: blendMode,
        opacity,
      }}
    />
  );
};

export default VisualizerOverlay;


