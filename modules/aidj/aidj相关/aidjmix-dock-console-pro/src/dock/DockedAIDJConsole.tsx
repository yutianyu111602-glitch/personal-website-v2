import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LocalBus from './LocalBus';
import EmotionMonitor from '../ui/EmotionMonitor'; // 已替换为真实路径

function useBus(): any {
  const [bus, setBus] = useState<any>(null);
  useEffect(()=>{
    const g:any = window as any;
    const b = g.UnifiedEventBus || new LocalBus();
    if(!g.UnifiedEventBus) g.UnifiedEventBus = b;
    setBus(b);
  },[]);
  return bus;
}

const DockedAIDJConsole: React.FC = () => {
  const bus = useBus();
  const [open, setOpen] = useState(false);

  useEffect(()=>{
    if(!bus?.on) return;
    const off = bus.on('ui','sync_toggle',(e:any)=>{
      if(typeof e?.data?.active==='boolean') setOpen(e.data.active);
      else setOpen(v=>!v);
    });
    return ()=> off && off();
  },[bus]);

  const emit = (e:any)=> bus?.emit?.(e);
  const onNext = ()=> emit({namespace:'automix', type:'transition', data:{action:'next'}, timestamp:Date.now()});
  const onPrev = ()=> emit({namespace:'automix', type:'transition', data:{action:'prev'}, timestamp:Date.now()});
  const onCross = (ms=4000)=> emit({namespace:'automix', type:'transition', data:{action:'crossfade', durationMs:ms}, timestamp:Date.now()});
  const onBoost = ()=> emit({namespace:'automix', type:'mood', data:{mood:{energy:0.85}}, timestamp:Date.now()});
  const onCalm = ()=> emit({namespace:'automix', type:'mood', data:{mood:{energy:0.3}}, timestamp:Date.now()});

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="dock"
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            transition={{ type:'spring', stiffness: 320, damping: 30 }}
            style={{
              position:'fixed', left:16, right:16, bottom:16,
              maxWidth:960, height:360, margin:'0 auto',
              borderRadius:16, background:'rgba(11,15,20,0.95)',
              border:'1px solid rgba(215,225,245,0.14)',
              boxShadow:'0 16px 50px rgba(0,0,0,.45)',
              zIndex:90, display:'grid',
              gridTemplateColumns:'1.2fr .8fr', gap:12, padding:12
            }}
          >
            <EmotionMonitor isVisible />

            <div style={{display:'grid', gridTemplateRows:'auto auto 1fr', gap:12}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8}}>
                <Btn onClick={onPrev}>⏮ Prev</Btn>
                <Btn onClick={onNext}>⏭ Next</Btn>
                <Btn onClick={()=>onCross(2500)}>↔ Cross 2.5s</Btn>
                <Btn onClick={()=>onCross(4500)}>↔ Cross 4.5s</Btn>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8}}>
                <Btn onClick={onBoost}>⚡ Boost</Btn>
                <Btn onClick={onCalm}>🌙 Calm</Btn>
              </div>

              <div style={{border:'1px solid rgba(215,225,245,0.12)', borderRadius:12, padding:10}}>
                <div style={{marginBottom:8, fontSize:12, color:'#dfe6ff'}}>预设 / 手法</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8}}>
                  <Btn onClick={()=>emit({namespace:'visualization', type:'preset_force', data:{name:'silver_pure'}})}>silver_pure</Btn>
                  <Btn onClick={()=>emit({namespace:'visualization', type:'preset_force', data:{name:'silver_mist'}})}>silver_mist</Btn>
                  <Btn onClick={()=>emit({namespace:'visualization', type:'preset_force', data:{name:'liquid_chrome'}})}>liquid_chrome</Btn>
                  <Btn onClick={()=>emit({namespace:'visualization', type:'preset_force', data:{name:'metallic_flow'}})}>metallic_flow</Btn>
                  <Btn onClick={()=>emit({namespace:'visualization', type:'preset_force', data:{name:'cosmic_silver'}})}>cosmic_silver</Btn>
                  <Btn onClick={()=>emit({namespace:'automix', type:'technique_select', data:{technique:'double_drop_32'}})}>double_drop_32</Btn>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Btn: React.FC<React.PropsWithChildren<{onClick?:()=>void}>> = ({children,onClick}) => (
  <button
    onClick={onClick}
    style={{
      padding:'10px 12px', borderRadius:10, cursor:'pointer',
      background:'rgba(255,255,255,.06)', color:'#eaf0ff',
      border:'1px solid rgba(215,225,245,.18)', fontSize:12
    }}
  >{children}</button>
);

export default DockedAIDJConsole;
