// glsl-blends.part3.glsl
// EdgeTint / DualCurve / TemporalTrail / SpecularGrad
precision highp float;
uniform sampler2D uBg; uniform sampler2D uPrev;
uniform vec2 uResolution; uniform float uTime;
uniform float uJitter; uniform float uVividGate; uniform float uLightPhase; uniform vec3 uEdgeTintColor;
float luma709(vec3 c); vec3 toLin(vec3 c); vec3 toSRGB(vec3 c); vec3 film(vec3 x); vec2 sobel(vec2 uv);
float blueNoise(vec2 uv); vec3 softLight(vec3 b, vec3 f); vec3 vividLight(vec3 b, vec3 f); vec3 overlayLin(vec3 b, vec3 f);

vec3 Blend_EdgeTint(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W+(blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg), fL=toLin(fx); vec3 diff=abs(fL-bL); vec3 tint=normalize(uEdgeTintColor); vec3 o=bL+diff*tint*(w*0.5); return toSRGB(film(clamp(o,0.0,1.0))); }
vec3 Blend_DualCurve(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W+(blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg), fL=toLin(fx); vec3 s=softLight(bL,fL); vec3 v=clamp(vividLight(bL,fL),0.0,2.0); vec3 cur=mix(s,v,clamp(uVividGate,0.0,1.0)); return toSRGB(film(mix(bL,cur,w))); }
vec3 Blend_TemporalTrail(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W+(blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg), fL=toLin(fx), pL=toLin(texture2D(uPrev,uv).rgb); vec2 g=sobel(uv); float motion=clamp(length(g)*1.5,0.0,1.0); float a=mix(0.85,0.6,motion); vec3 trail=mix(fL,pL,a); vec3 o=mix(bL,overlayLin(bL,trail),w*0.9); return toSRGB(film(o)); }
vec3 Blend_SpecularGrad(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W+(blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg), fL=toLin(fx); vec2 g=sobel(uv); vec3 n=normalize(vec3(g,1.0)); float ang=uLightPhase*6.2831853; vec3 L=normalize(vec3(cos(ang),sin(ang),0.8)); float spec=pow(max(dot(n,L),0.0),16.0); vec3 o=bL+spec*fL*(w*0.6); return toSRGB(film(clamp(o,0.0,1.0))); }
