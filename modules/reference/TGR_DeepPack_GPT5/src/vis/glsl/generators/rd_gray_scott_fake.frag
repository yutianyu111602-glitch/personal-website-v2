precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
#include "../common.glsl"
void main(){
  float a = fbm(vUv*5.0 + uTime*0.02);
  float b = fbm(vUv*9.0 - uTime*0.03 + 3.14);
  float c = smoothstep(0.4, 0.7, a) * (1.0 - smoothstep(0.2,0.6,b));
  gl_FragColor = vec4(vec3(c),1.0);
}
