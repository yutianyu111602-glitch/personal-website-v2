precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
#include "../common.glsl"

vec2 curl(vec2 p){
  float e=1.0;
  float n1 = snoise(p + vec2(0.0, e));
  float n2 = snoise(p + vec2(0.0,-e));
  float n3 = snoise(p + vec2( e,0.0));
  float n4 = snoise(p + vec2(-e,0.0));
  float x = n1 - n2;
  float y = n3 - n4;
  return normalize(vec2(x, -y));
}
void main(){
  vec2 p = vUv*4.0 + uTime*0.05;
  vec2 f = curl(p);
  gl_FragColor = vec4(f*0.5+0.5, 0.0, 1.0);
}
