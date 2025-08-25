// 主交互：点击可视化区域 → Normal/Focus 切换（不弹新窗口）
// - 仅切换 CSS class，不触碰音频实例，避免中断播放。
// - 支持 Esc 退出 Focus。
// - 预留高帧率开关（例如在 WebGL 可视化中调高 requestAnimationFrame 频率的策略开关）。

const app = document.getElementById('app');
const viz = document.getElementById('viz');
const vizCanvas = document.getElementById('vizCanvas');
const highFpsToggle = document.getElementById('highFPS');
const dockBack = document.getElementById('dockBack');
const dockPlay = document.getElementById('dockPlay');

// 简单画点动态线条，代替真实可视化。你可以改成 WebGL/Three.js/Canvas 频谱。
const ctx = vizCanvas.getContext('2d');
let raf = 0;
let t = 0;
function draw(){
  const {width, height} = vizCanvas;
  ctx.clearRect(0,0,width,height);
  // 背景雾化层
  ctx.globalAlpha = 0.9;
  const g = ctx.createLinearGradient(0,0,width,height);
  g.addColorStop(0,'#0b0b16'); g.addColorStop(1,'#0e0f1a');
  ctx.fillStyle = g; ctx.fillRect(0,0,width,height);

  // 动态线
  ctx.globalAlpha = 1;
  ctx.beginPath();
  for(let x=0;x<width;x+=6){
    const y = height/2 + Math.sin((x+t)/40)*30 + Math.sin((x+t)/13)*12;
    if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.stroke();

  t += highFpsToggle.checked ? 2.2 : 1.2;
  raf = requestAnimationFrame(draw);
}
// 调整画布大小（简单适配）
function fitCanvas(){
  const rect = viz.getBoundingClientRect();
  vizCanvas.width = Math.max(640, Math.floor(rect.width));
  vizCanvas.height = Math.max(360, Math.floor(rect.height));
}
window.addEventListener('resize', ()=>{ fitCanvas(); });

function enterFocus(){
  app.classList.add('focus'); app.classList.remove('normal');
  document.body.classList.add('noscroll');
  viz.setAttribute('aria-pressed','true');
}
function exitFocus(){
  app.classList.remove('focus'); app.classList.add('normal');
  document.body.classList.remove('noscroll');
  viz.setAttribute('aria-pressed','false');
}

viz.addEventListener('click', ()=>{
  app.classList.contains('focus') ? exitFocus() : enterFocus();
});
window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') exitFocus(); });

dockBack.addEventListener('click', exitFocus);
dockPlay.addEventListener('click', ()=>{
  // 这里预留与音频系统的对接：你可以触发全局播放器 play/pause。
  console.log('TODO: hook global audio play/pause');
});

// 初始化
fitCanvas();
draw();
