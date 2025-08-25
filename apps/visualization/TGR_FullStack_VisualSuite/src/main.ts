import React from 'react'
import { createRoot } from 'react-dom/client'
import VisualizerIsland from './vis/VisualizerIsland'
import type { Preset, Mood, AudioFeatures, NowPlaying } from './vis/UnifiedTechnoMoodCore'

const presets: Preset[] = [
  { id:'preset-polish', tags:{ metalScore:0.9, energyBias:0.3, valenceBias:0.2, arousalBias:0.5, hueShiftRisk:0.1, specularBoost:0.7, rippleAffinity:0.6, cost:2 } },
  { id:'preset-carve',  tags:{ metalScore:0.85, energyBias:-0.2, valenceBias:-0.1, arousalBias:0.4, hueShiftRisk:0.1, specularBoost:0.4, rippleAffinity:0.5, cost:2 } },
  { id:'preset-ice',    tags:{ metalScore:0.95, energyBias:0.1, valenceBias:-0.2, arousalBias:0.2, hueShiftRisk:0.05, specularBoost:0.8, rippleAffinity:0.7, cost:3 } },
]

let energy = 0.6, arousal = 0.5, valence = 0.05

const getMood = (): Mood => ({ energy, arousal, valence })

let t0 = performance.now()
const getAudioFeatures = (): AudioFeatures => {
  const t = (performance.now()-t0)/1000
  const beat = (Math.sin(t*2*Math.PI*2) > 0.95) ? 1 : 0   // 粗糙节拍
  return {
    sub: Math.max(0, Math.sin(t*1.7)*0.5+0.5)*0.4,
    bass: Math.max(0, Math.sin(t*1.3)*0.5+0.5)*0.7,
    lowMid: Math.max(0, Math.sin(t*0.7+1.2)*0.5+0.5)*0.4,
    mid: Math.max(0, Math.sin(t*0.9+0.4)*0.5+0.5)*0.5,
    highMid: Math.max(0, Math.sin(t*1.4+0.3)*0.5+0.5)*0.5,
    presence: Math.max(0, Math.sin(t*2.3+0.7)*0.5+0.5)*0.4,
    brilliance: Math.max(0, Math.sin(t*2.7+0.1)*0.5+0.5)*0.4,
    air: Math.max(0, Math.sin(t*3.2+1.1)*0.5+0.5)*0.3,
    centroid: 0.6,
    flux: 0.55,
    crest: 0.6,
    beat,
    rms: 0.5,
    silence: false,
  }
}
const getNowPlaying = (): NowPlaying => ({ title:'Demo', artist:'TGR', bpm:128, segment:'steady', startedAt: Date.now(), trackId: 'demo-track' })

const root = createRoot(document.getElementById('app')!)
root.render(
  React.createElement(VisualizerIsland, {
    presets,
    getMood,
    getAudioFeatures,
    getNowPlaying,
    onPerf(p){ (document.getElementById('hud')!.textContent = `FPS: ${(1000/Math.max(1,p.avgFrameMs)).toFixed(1)}`) },
    width: window.innerWidth,
    height: window.innerHeight
  })
)

// UI controls
document.getElementById('btnLow')!.onclick = ()=>{ energy=0.3; arousal=0.35; valence=-0.1 }
document.getElementById('btnMid')!.onclick = ()=>{ energy=0.6; arousal=0.5; valence=0.05 }
document.getElementById('btnHigh')!.onclick = ()=>{ energy=0.9; arousal=0.75; valence=0.2 }
document.getElementById('btnShuffle')!.onclick = ()=>{ energy=Math.random(); arousal=Math.random(); valence=Math.random()*2-1 }
