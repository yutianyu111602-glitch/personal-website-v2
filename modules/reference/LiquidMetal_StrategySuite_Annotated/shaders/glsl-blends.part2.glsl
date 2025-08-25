// glsl-blends.part2.glsl
// SoftBurn / GrainMerge / StructureMix / BloomHL
precision highp float;
uniform sampler2D uBg; uniform sampler2D uPrev; uniform sampler2D uBloom;
uniform vec2 uResolution; uniform float uTime;
uniform float uBrightCap; uniform float uJitter; uniform float uLicStrength;
float luma709(vec3 c); vec3 toLin(vec3 c); vec3 toSRGB(vec3 c); vec3 film(vec3 x); vec2 sobel(vec2 uv);
float blueNoise(vec2 uv);
vec3 colorBurn(vec3 b, vec3 f);
vec3 overlayLin(vec3 b, vec3 f);

vec3 Blend_SoftBurn(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W+(blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg), fL=toLin(fx); vec3 t=colorBurn(bL,fL); return toSRGB(film(mix(bL,mix(bL,t,0.6),w))); }
vec3 Blend_GrainMerge(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W+(blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg), fL=toLin(fx); float n=blueNoise(uv*uResolution.xy); vec3 gm=bL+(fL-0.5)*(0.18+0.12*n); return toSRGB(film(mix(bL,clamp(gm,0.0,1.0),w*0.6))); }
vec3 Blend_StructureMix(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W+(blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg), fL=toLin(fx); vec2 g=sobel(uv); float contr=clamp(length(g)*2.0,0.0,1.0); contr=mix(contr, contr*1.2, uLicStrength); vec3 o=mix(bL,overlayLin(bL,fL), w*mix(0.3,1.0,contr)); return toSRGB(film(o)); }
vec3 Blend_BloomHL(vec2 uv, vec3 bg, vec3 fx, float W){ float w=W+(blueNoise(uv)-0.5)*uJitter; vec3 bL=toLin(bg); vec3 bl=toLin(texture2D(uBloom,uv).rgb); float mask=smoothstep(0.65,0.85,luma709(bL)); vec3 o=bL+bl*(w*mask); return toSRGB(film(clamp(o,0.0,vec3(uBrightCap)))); }
