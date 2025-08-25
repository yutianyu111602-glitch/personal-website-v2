// shaders/NewVisuals.glsl — 额外可视化函数（可作蒙版/位移/粗糙度源）
// [CURSOR] Keep param names stable; document default ranges in README.
// [HUMAN] 这些是“素材层”，建议用在 StructureMix / DualCurve 的二级调制上。
precision highp float;
uniform sampler2D uBg, uPrev;
uniform vec2 uResolution;
uniform float uTime;

float N21(vec2 p){ return fract(sin(dot(p, vec2(41.0,289.0))) * 43758.5453); }
vec2  N22(vec2 p){ return vec2(N21(p), N21(p+17.1)); }

float snoise(vec2 v){
  vec2 i=floor(v), f=fract(v);
  float a=dot(N22(i+vec2(0,0)), f-vec2(0,0));
  float b=dot(N22(i+vec2(1,0)), f-vec2(1,0));
  float c=dot(N22(i+vec2(0,1)), f-vec2(0,1));
  float d=dot(N22(i+vec2(1,1)), f-vec2(1,1));
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

float fbm(vec2 p){
  float a=0.5, s=0.0;
  for(int i=0;i<5;i++){ s += a*snoise(p); a*=0.5; p*=2.03; }
  return s;
}

float caustic(vec2 uv){
  float v = fbm(uv*3.0 + uTime*0.07) - 0.5*fbm(uv*6.0 - uTime*0.11);
  return smoothstep(0.4,0.9, v*1.2);
}

float worley(vec2 uv){
  uv*=6.0;
  vec2 i=floor(uv), f=fract(uv);
  float d=1.0;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y));
    vec2 o=N22(i+g);
    vec2 p=g+o-f;
    d=min(d, dot(p,p));
  }
  return 1.0 - clamp(d*1.8, 0.0, 1.0);
}

float polarRipples(vec2 uv){
  vec2 p = (uv - 0.5) * vec2(uResolution.x/uResolution.y, 1.0);
  float r = length(p), a = atan(p.y,p.x);
  return 0.5 + 0.5*sin(12.0*r - 3.0*a + uTime*1.2);
}
