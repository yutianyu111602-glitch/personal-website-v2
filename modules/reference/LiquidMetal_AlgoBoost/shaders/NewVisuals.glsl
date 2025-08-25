
// NewVisuals.glsl — 额外酷炫算法集合（可拼装为节点 or 蒙版）
precision highp float;
uniform sampler2D uBg, uPrev;
uniform vec2 uResolution;
uniform float uTime;

// -------- 1) CurlDisplaceUV（流场位移） --------
vec2 N2(vec2 p){ return vec2(fract(sin(dot(p,vec2(27.1,61.7)))*43758.5453),
                             fract(sin(dot(p,vec2(19.3,31.1)))*23421.631)); }
float snoise(vec2 v){
  vec2 i=floor(v), f=fract(v);
  float a=dot(N2(i+vec2(0,0)), f-vec2(0,0));
  float b=dot(N2(i+vec2(1,0)), f-vec2(1,0));
  float c=dot(N2(i+vec2(0,1)), f-vec2(0,1));
  float d=dot(N2(i+vec2(1,1)), f-vec2(1,1));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
vec2 curl(vec2 uv, float sc){
  float e=0.01;
  float nx0=snoise((uv+vec2(0,e))*sc);
  float nx1=snoise((uv+vec2(0,-e))*sc);
  float ny0=snoise((uv+vec2(e,0))*sc);
  float ny1=snoise((uv+vec2(-e,0))*sc);
  return normalize(vec2(ny0-ny1, nx1-nx0));
}
vec2 curlDisplace(vec2 uv, float amp, float sc){
  vec2 v = curl(uv*sc + uTime*0.05, 1.0);
  return uv + v * (amp / uResolution);
}

// -------- 2) CausticMix（焦散调制） --------
float fbm(vec2 p){
  float a=0.5, s=0.0;
  for(int i=0;i<5;i++){ s += a*snoise(p); a*=0.5; p*=2.03; }
  return s;
}
float caustic(vec2 uv){
  float v = fbm(uv*3.0 + uTime*0.07) - 0.5*fbm(uv*6.0 - uTime*0.11);
  return smoothstep(0.4,0.9, v*1.2);
}

// -------- 3) WorleyCrack（冰裂掩码） --------
float worley(vec2 uv){
  uv*=6.0;
  vec2 i=floor(uv), f=fract(uv);
  float d=1.0;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y));
    vec2 o=N2(i+g);
    vec2 p=g+o-f;
    d=min(d, dot(p,p));
  }
  return 1.0 - clamp(d*1.8, 0.0, 1.0);
}

// -------- 4) AnisoStreak（各向异性拉丝高光） --------
vec3 anisoStreak(vec2 uv, vec3 base){
  vec2 dir = normalize(vec2(0.8, 0.2)); // 可作为 uniform
  float l = fbm(uv*vec2(12.0,2.0));
  float s = smoothstep(0.75, 0.92, l);
  vec3 spec = vec3(s) * 0.6;
  return clamp(base + spec, 0.0, 1.0);
}

// -------- 5) PolarRipples（极坐标涟漪） --------
float polarRipples(vec2 uv){
  vec2 p = (uv - 0.5) * vec2(uResolution.x/uResolution.y, 1.0);
  float r = length(p), a = atan(p.y,p.x);
  return 0.5 + 0.5*sin(12.0*r - 3.0*a + uTime*1.2);
}

// -------- 6) SpectralBloom（基于亮度的谱化 Bloom） --------
vec3 spectralBloom(vec2 uv, sampler2D tex){
  vec3 c = texture2D(tex, uv).rgb;
  float l = dot(c, vec3(0.299,0.587,0.114));
  vec3 s = vec3(smoothstep(0.7,0.95,l));
  // 简化的色散：RGB 轻微错位采样
  vec2 px = 1.0/uResolution;
  vec3 bloom = vec3(
    texture2D(tex, uv + px*vec2( 1, 0)).r,
    texture2D(tex, uv + px*vec2( 0, 1)).g,
    texture2D(tex, uv + px*vec2(-1, 0)).b
  );
  return mix(c, clamp(c + bloom*0.6, 0.0, 1.0), s);
}
