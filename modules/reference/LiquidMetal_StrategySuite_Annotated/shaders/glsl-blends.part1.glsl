// glsl-blends.part1.glsl
// [CURSOR] Keep each function pure; do linear-space ops; tone-map at the end.
// [HUMAN] 这是 12 混合函数的第 1 部分（其余见 part2/part3）。
precision highp float;
uniform sampler2D uBg; uniform sampler2D uPrev; uniform sampler2D uBloom;
uniform vec2 uResolution; uniform float uTime;
uniform float uBrightCap; uniform float uJitter;
uniform float uVividGate; uniform float uFlowRadius; uniform float uLicStrength; uniform float uMaskGain; uniform float uLightPhase;
uniform vec3  uEdgeTintColor;
float luma709(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }
vec3  toLin(vec3 c){ return pow(max(c,0.0), vec3(2.2)); }
vec3  toSRGB(vec3 c){ return pow(max(c,0.0), vec3(1.0/2.2)); }
vec3 film(vec3 x){ return (x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14); }
vec3 overlayLin(vec3 b, vec3 f){ return mix(2.0*b*f, 1.0 - 2.0*(1.0-b)*(1.0-f), step(0.5, b)); }
vec3 screen(vec3 b, vec3 f){ return 1.0 - (1.0-b)*(1.0-f); }
vec3 multiply(vec3 b, vec3 f){ return b*f; }
vec3 colorDodge(vec3 b, vec3 f){ return b / max(vec3(1e-4), 1.0 - f); }
vec3 colorBurn(vec3 b, vec3 f){ return 1.0 - (1.0 - b) / max(f, vec3(1e-4)); }
vec3 softLight(vec3 b, vec3 f){ return (1.0-2.0*f)*b*b + 2.0*f*b; }
vec3 vividLight(vec3 b, vec3 f){ vec3 d=colorDodge(b,max(vec3(0.0),2.0*f-1.0)); vec3 u=colorBurn(b,max(vec3(0.0),1.0-2.0*f)); return mix(u,d,step(0.5,f)); }
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float blueNoise(vec2 uv){ return hash21(uv*vec2(157.0,113.0) + uTime*0.37); }
vec2 sobel(vec2 uv){ vec2 px=1.0/uResolution; float tl=luma709(texture2D(uBg, uv+px*vec2(-1,1)).rgb); float l=luma709(texture2D(uBg, uv+px*vec2(-1,0)).rgb); float bl=luma709(texture2D(uBg, uv+px*vec2(-1,-1)).rgb); float t=luma709(texture2D(uBg, uv+px*vec2(0,1)).rgb); float b=luma709(texture2D(uBg, uv+px*vec2(0,-1)).rgb); float tr=luma709(texture2D(uBg, uv+px*vec2(1,1)).rgb); float r=luma709(texture2D(uBg, uv+px*vec2(1,0)).rgb); float br=luma709(texture2D(uBg, uv+px*vec2(1,-1)).rgb); float gx=(tr+2.0*r+br)-(tl+2.0*l+bl); float gy=(bl+2.0*b+br)-(tl+2.0*t+tr); return vec2(gx,gy); }
// LumaSoftOverlay / SMix / OkLabLightness / BoundedDodge
vec3 Blend_LumaSoftOverlay(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W + (blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg), fL=toLin(fx); vec3 mixL=overlayLin(bL,fL); return toSRGB(film(mix(bL,mixL,w))); }
vec3 Blend_SMix(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W + (blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg), fL=toLin(fx); vec3 m=multiply(bL,fL); vec3 s=screen(bL,fL); vec3 o=mix(m,s,0.5); return toSRGB(film(mix(bL,o,w))); }
vec3 Blend_OkLabLightness(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W + (blueNoise(uv)-0.5)*uJitter; float Lb=luma709(bg), Lf=luma709(fx); float L=mix(Lb,Lf,w); vec3 gain=vec3(L/max(Lb,1e-5)); return clamp(bg*gain,0.0,1.0); }
vec3 Blend_BoundedDodge(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W + (blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg), fL=toLin(fx); vec3 d=clamp(colorDodge(bL,fL),0.0,vec3(2.0)); return toSRGB(film(mix(bL,d,w))); }
