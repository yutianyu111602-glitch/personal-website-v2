
// glsl-generators.template.glsl — 生成器/位移/蒙版算法合集
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uStateA; // 供 Reaction-Diffusion / Lenia 等 ping-pong 状态使用
uniform sampler2D uStateB;

float N21(vec2 p){ return fract(sin(dot(p, vec2(41.0,289.0))) * 43758.5453); }

// ----------------- Simplex 2D（简化版） -----------------
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                      -0.577350269189626, // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
         + i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ; m = m*m ;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

// ----------------- Curl Noise（用于位移场） -----------------
vec2 curl(vec2 uv, float scale){
  float e = 0.01;
  float nx0 = snoise((uv + vec2(0.0,  e))*scale);
  float nx1 = snoise((uv + vec2(0.0, -e))*scale);
  float ny0 = snoise((uv + vec2( e, 0.0))*scale);
  float ny1 = snoise((uv + vec2(-e, 0.0))*scale);
  float cx = ny0 - ny1;
  float cy = nx1 - nx0;
  return normalize(vec2(cx, -cy));
}

// ----------------- Worley（Cellular） -----------------
float worley(vec2 uv, float scale){
  uv *= scale;
  vec2 i = floor(uv);
  vec2 f = fract(uv);
  float d = 1.0;
  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(N21(i + g), N21(i + g + 19.0));
      vec2 p = g + o - f;
      d = min(d, dot(p,p));
    }
  }
  return 1.0 - clamp(d, 0.0, 1.0);
}

// ----------------- Domain Warp -----------------
float domainWarp(vec2 uv, float scale, float amp, int iter){
  float v = 0.0;
  vec2 p = uv*scale;
  for(int i=0;i<5;i++){
    if(i>=iter) break;
    vec2 q = vec2(snoise(p + uTime*0.2), snoise(p*1.3 - uTime*0.15));
    p += q*amp;
    v += snoise(p);
  }
  return v/float(max(1,iter));
}

// ----------------- LIC（近似流丝） -----------------
float lic(vec2 uv, vec2 dir, float len){
  vec2 px = 1.0/uResolution;
  float acc=0.0, w=0.0;
  for(int i=-8;i<=8;i++){
    float t = float(i)/8.0;
    vec2 offs = dir * t * len * px;
    float n = snoise( (uv + offs)*6.0 );
    float ww = 1.0 - abs(t);
    acc += n*ww; w+=ww;
  }
  return acc/max(1e-5,w);
}

// ----------------- Reaction-Diffusion（Gray-Scott 单步） -----------------
// A: uStateA.r, B: uStateA.g
vec4 rdStep(vec2 uv, float F, float K){
  vec2 px = 1.0/uResolution;
  vec2 off[8];
  off[0]=vec2( 1, 0); off[1]=vec2(-1,0); off[2]=vec2(0, 1); off[3]=vec2(0,-1);
  off[4]=vec2( 1, 1); off[5]=vec2(-1,1); off[6]=vec2(1,-1); off[7]=vec2(-1,-1);
  float a = texture2D(uStateA, uv).r;
  float b = texture2D(uStateA, uv).g;
  float lapA=0.0, lapB=0.0;
  for(int i=0;i<4;i++){ lapA += texture2D(uStateA, uv+off[i]*px).r - a; lapB += texture2D(uStateA, uv+off[i]*px).g - b; }
  for(int i=4;i<8;i++){ lapA += 0.5*(texture2D(uStateA, uv+off[i]*px).r - a); lapB += 0.5*(texture2D(uStateA, uv+off[i]*px).g - b); }
  float Da=1.0, Db=0.5;
  float ra = Da*lapA - a*b*b + F*(1.0 - a);
  float rb = Db*lapB + a*b*b - (K+F)*b;
  a += ra*1.0; b += rb*1.0; // dt=1（需调小以稳定）
  return vec4(clamp(a,0.0,1.0), clamp(b,0.0,1.0), 0.0, 1.0);
}

// ----------------- 用法提示 -----------------
// - Curl: 用 curl(uv, scale) * flowAmp 作为位移向量
// - DomainWarp: v=domainWarp(uv, scale, amp, iter) → 用作 mask/roughness
// - Worley: w=worley(uv, scale) → 冰裂/碎片 mask
// - LIC: d=normalize(flow); lic(uv, d, len) → 拉丝质感
// - RD: 在单独的 ping-pong FBO 中运行 rdStep，结果纹理用于混合掩码
