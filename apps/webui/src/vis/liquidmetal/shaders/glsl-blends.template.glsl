// glsl-blends.template.glsl — 12 个 Blend 模板（移植版）
precision highp float;

uniform sampler2D uBg;
uniform sampler2D uPrev;
uniform sampler2D uBloom;
uniform vec2 uResolution;
uniform float uTime;

uniform float uBrightCap;
uniform float uJitter;

uniform float uVividGate;
uniform float uFlowRadius;
uniform float uLicStrength;
uniform float uMaskGain;
uniform float uLightPhase;
uniform vec3  uEdgeTintColor;

float luma709(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3  toLin(vec3 c){ return pow(max(c, 0.0), vec3(2.2)); }
vec3  toSRGB(vec3 c){ return pow(max(c, 0.0), vec3(1.0/2.2)); }
vec3 film(vec3 x){ return (x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14); }

vec3 overlayLin(vec3 b, vec3 f){ return mix(2.0*b*f, 1.0 - 2.0*(1.0-b)*(1.0-f), step(0.5, b)); }
vec3 screen(vec3 b, vec3 f){ return 1.0 - (1.0-b)*(1.0-f); }
vec3 multiply(vec3 b, vec3 f){ return b*f; }

vec3 colorDodge(vec3 b, vec3 f){ return b / max(vec3(1e-4), 1.0 - f); }
vec3 colorBurn(vec3 b, vec3 f){ return 1.0 - (1.0 - b) / max(f, vec3(1e-4)); }
vec3 softLight(vec3 b, vec3 f){ return (1.0-2.0*f)*b*b + 2.0*f*b; }
vec3 vividLight(vec3 b, vec3 f){ vec3 d = colorDodge(b, max(vec3(0.0), 2.0*f-1.0)); vec3 u = colorBurn (b, max(vec3(0.0), 1.0-2.0*f)); return mix(u, d, step(0.5, f)); }

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float blueNoise(vec2 uv){ return hash21(uv*vec2(157.0,113.0) + uTime*0.37); }

vec2 sobel(vec2 uv){
  vec2 px = 1.0 / uResolution;
  float tl = luma709(texture2D(uBg, uv+px*vec2(-1, 1)).rgb);
  float  l = luma709(texture2D(uBg, uv+px*vec2(-1, 0)).rgb);
  float bl = luma709(texture2D(uBg, uv+px*vec2(-1,-1)).rgb);
  float  t = luma709(texture2D(uBg, uv+px*vec2( 0, 1)).rgb);
  float  b = luma709(texture2D(uBg, uv+px*vec2( 0,-1)).rgb);
  float tr = luma709(texture2D(uBg, uv+px*vec2( 1, 1)).rgb);
  float  r = luma709(texture2D(uBg, uv+px*vec2( 1, 0)).rgb);
  float br = luma709(texture2D(uBg, uv+px*vec2( 1,-1)).rgb);
  float gx = (tr + 2.0*r + br) - (tl + 2.0*l + bl);
  float gy = (bl + 2.0*b + br) - (tl + 2.0*t + tr);
  return vec2(gx, gy);
}

float cap(float x){ return min(x, uBrightCap); }
float wobble(float w, vec2 uv){ return w + (blueNoise(uv)-0.5)*uJitter; }

vec3 Blend_LumaSoftOverlay(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg), fL = toLin(fx);
  vec3 mixL = overlayLin(bL, fL);
  vec3 outL = mix(bL, mixL, w);
  return toSRGB(film(outL));
}

vec3 Blend_SMix(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg), fL = toLin(fx);
  vec3 m = multiply(bL,fL); vec3 s = screen(bL,fL);
  vec3 o = mix(m, s, 0.5);
  return toSRGB(film(mix(bL, o, w)));
}

vec3 Blend_BoundedDodge(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg), fL = toLin(fx);
  vec3 d = clamp(colorDodge(bL, fL), 0.0, vec3(2.0));
  vec3 o = mix(bL, d, w);
  return toSRGB(film(o));
}

vec3 Blend_SoftBurn(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg), fL = toLin(fx);
  vec3 t = colorBurn(bL, fL);
  vec3 o = mix(bL, mix(bL, t, 0.6), w);
  return toSRGB(film(o));
}

vec3 Blend_GrainMerge(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg), fL = toLin(fx);
  float n = blueNoise(uv * uResolution.xy);
  vec3 gm = bL + (fL - 0.5) * (0.18 + 0.12*n);
  vec3 o  = mix(bL, clamp(gm,0.0,1.0), w*0.6);
  return toSRGB(film(o));
}

vec3 Blend_StructureMix(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg), fL = toLin(fx);
  vec2 g = sobel(uv);
  float contr = clamp(length(g)*2.0, 0.0, 1.0);
  contr = mix(contr, contr*1.2, uLicStrength);
  vec3 o = mix(bL, overlayLin(bL,fL), w * mix(0.3,1.0, contr));
  return toSRGB(film(o));
}

vec3 Blend_BloomHL(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg);
  vec3 bl = toLin(texture2D(uBloom, uv).rgb);
  float mask = smoothstep(0.65, 0.85, luma709(bL));
  vec3 o = bL + bl * (w * mask);
  return toSRGB(film(clamp(o, 0.0, vec3(uBrightCap))));
}

vec3 Blend_EdgeTint(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg), fL = toLin(fx);
  vec3 diff = abs(fL - bL);
  vec3 tint = normalize(uEdgeTintColor);
  vec3 o = bL + diff * tint * (w * 0.5);
  return toSRGB(film(clamp(o, 0.0, 1.0)));
}

vec3 Blend_DualCurve(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg), fL = toLin(fx);
  vec3 s = softLight(bL,fL);
  vec3 v = clamp(vividLight(bL,fL), 0.0, 2.0);
  vec3 cur = mix(s, v, clamp(uVividGate, 0.0, 1.0));
  vec3 o = mix(bL, cur, w);
  return toSRGB(film(o));
}

vec3 Blend_TemporalTrail(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg), fL = toLin(fx), pL = toLin(texture2D(uPrev, uv).rgb);
  vec2 g = sobel(uv);
  float motion = clamp(length(g)*1.5, 0.0, 1.0);
  float a = mix(0.85, 0.6, motion);
  vec3 trail = mix(fL, pL, a);
  vec3 o = mix(bL, overlayLin(bL, trail), w*0.9);
  return toSRGB(film(o));
}

vec3 Blend_SpecularGrad(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  vec3 bL = toLin(bg), fL = toLin(fx);
  vec2 g = sobel(uv); vec3 n = normalize(vec3(g, 1.0));
  float ang = uLightPhase * 6.2831853;
  vec3 L = normalize(vec3(cos(ang), sin(ang), 0.8));
  float spec = pow(max(dot(n, L), 0.0), 16.0);
  vec3 o = bL + spec * fL * (w*0.6);
  return toSRGB(film(clamp(o, 0.0, 1.0)));
}

vec3 Blend_OkLabLightness(in vec2 uv, in vec3 bg, in vec3 fx, in float W){
  float w = wobble(W, uv);
  float Lb = luma709(bg), Lf = luma709(fx);
  float L = mix(Lb, Lf, w);
  vec3 gain = vec3(L / max(Lb, 1e-5));
  vec3 outc = clamp(bg * gain, 0.0, 1.0);
  return outc;
}


