precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uOffset;
void main(){
  vec2 texel = 1.0/uRes;
  vec4 c = vec4(0.0);
  c += texture2D(uTex, vUv + texel*vec2( uOffset,  uOffset))*0.25;
  c += texture2D(uTex, vUv + texel*vec2(-uOffset,  uOffset))*0.25;
  c += texture2D(uTex, vUv + texel*vec2( uOffset, -uOffset))*0.25;
  c += texture2D(uTex, vUv + texel*vec2(-uOffset, -uOffset))*0.25;
  gl_FragColor = c;
}
