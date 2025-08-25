precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
#include "../common.glsl"
void main(){
  vec2 dir = normalize(vec2(sin(uTime*0.3), cos(uTime*0.23)));
  vec3 acc=vec3(0.0); float w=0.0;
  for(int i=-6;i<=6;i++){
    float t = float(i)/6.0;
    vec2 p = vUv + dir * t * 0.01;
    float s = fbm(p*6.0);
    float ww = 1.0 - abs(t);
    acc += vec3(s)*ww; w += ww;
  }
  vec3 c = acc/max(w,1e-4);
  gl_FragColor = vec4(c,1.0);
}
