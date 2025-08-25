precision highp float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform sampler2D uPrev;
uniform sampler2D uFlow;  // RG: flow, A unused
uniform sampler2D uTexA;  // grayscale mask/texture
uniform sampler2D uTexB;  // grayscale pattern
uniform vec2 uRes;
uniform float uTime;
uniform float uWeight;
uniform int uMode;

#include "./common.glsl"
#include "./brdf-metal.glsl"

vec2 flow(vec2 uv){
  vec3 f = texture2D(uFlow, uv).rgb;
  return (f.rg - 0.5) * 0.02; // 默认位移幅度
}
vec3 sampleSrc(vec2 uv, float amp){
  vec2 disp = flow(uv)*amp;
  return texture2D(uSrc, clamp(uv + disp,0.0,1.0)).rgb;
}
float maskTex(vec2 uv){ return texture2D(uTexA, uv).r; }
float maskPat(vec2 uv){ return texture2D(uTexB, uv).r; }

vec3 modeLumaSoftOverlay(vec3 c, vec2 uv){
  float L = luma(c);
  float m = mix(1.0, maskPat(uv)*1.2, 0.5);
  return mix(c, c*(0.95 + 0.08*L)*m, uWeight);
}
vec3 modeSMix(vec3 c, vec2 uv){
  float L = luma(c); vec3 g = vec3(L);
  vec3 mix1 = mix(c, g, 0.35 * (0.6+0.4*maskTex(uv)));
  return mix(c, mix1, uWeight);
}
vec3 modeOkLabLightness(vec3 c, vec2 uv){
  vec3 lab = rgb2oklab(c); lab.x = clamp(lab.x + 0.08*uWeight*(0.7+0.3*maskTex(uv)), 0.0, 1.0);
  return oklab2rgb(lab);
}
vec3 modeBoundedDodge(vec3 c, vec2 uv){
  vec3 r = clamp(c/(1.0-0.15*uWeight), 0.0, 1.0);
  return mix(c, r, 0.7+0.3*maskTex(uv));
}
vec3 modeSoftBurn(vec3 c, vec2 uv){
  return mix(c, c*(0.9 - 0.25*uWeight), uWeight*(0.6+0.4*maskPat(uv)));
}
vec3 modeStructureMix(vec3 c, vec2 uv){
  vec3 src = sampleSrc(uv, 2.0); // 2x flow distort
  float e = smoothstep(0.05,0.5, abs(dFdx(luma(src))) + abs(dFdy(luma(src))) );
  return mix(c, mix(c, vec3(e), 0.3), uWeight*0.6);
}
vec3 modeDualCurve(vec3 c, vec2 uv){
  vec3 d = sampleSrc(uv, 1.5);
  return mix(c, pow(d, vec3(1.0/(1.0 + 0.5*uWeight))), uWeight);
}
vec3 modeSpecularGrad(vec3 c, vec2 uv){
  vec3 spec = metalSpec(uv, uSrc, uRes);
  spec *= (0.7 + 0.3*maskTex(uv));
  return mix(c, clamp(c + spec, 0.0, 1.0), 0.5*uWeight);
}
vec3 modeGrainMerge(vec3 c, vec2 uv){
  float g = snoise(uv*uRes*0.7 + uTime*1.7);
  return c + (g-0.5)*0.05*uWeight;
}
vec3 modeEdgeTint(vec3 c, vec2 uv){
  vec2 px = 1.0/uRes;
  float l = luma(texture2D(uSrc, uv+vec2(-px.x,0)).rgb);
  float r = luma(texture2D(uSrc, uv+vec2( px.x,0)).rgb);
  float t = luma(texture2D(uSrc, uv+vec2(0, px.y)).rgb);
  float b = luma(texture2D(uSrc, uv+vec2(0,-px.y)).rgb);
  float e = smoothstep(0.05,0.5, abs(l-r)+abs(t-b));
  vec3 tint = vec3(0.95, 0.98, 1.05);
  return mix(c, c*tint, e*0.6*uWeight);
}
vec3 modeTemporalTrail(vec3 c, vec2 uv){
  vec3 prev = texture2D(uPrev, uv).rgb;
  return mix(c, prev, clamp(uWeight, 0.0, 0.95));
}

void main(){
  vec3 src = texture2D(uSrc, vUv).rgb;
  vec3 col = src;
  if (uMode==0) col = modeLumaSoftOverlay(src, vUv);
  else if (uMode==1) col = modeSMix(src, vUv);
  else if (uMode==2) col = modeOkLabLightness(src, vUv);
  else if (uMode==3) col = modeBoundedDodge(src, vUv);
  else if (uMode==4) col = modeSoftBurn(src, vUv);
  else if (uMode==5) col = modeStructureMix(src, vUv);
  else if (uMode==6) col = modeDualCurve(src, vUv);
  else if (uMode==7) col = modeSpecularGrad(src, vUv);
  else if (uMode==8) col = modeGrainMerge(src, vUv);
  else if (uMode==9) col = modeEdgeTint(src, vUv);
  else if (uMode==10) col = modeTemporalTrail(src, vUv);
  gl_FragColor = vec4(col, 1.0);
}
