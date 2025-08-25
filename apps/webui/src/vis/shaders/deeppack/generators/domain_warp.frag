precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
#include "../common.glsl"
void main(){
  vec2 p = vUv*3.0;
  float n = fbm(p + 0.5*fbm(p*2.0 + uTime*0.1));
  gl_FragColor = vec4(vec3(n),1.0);
}
