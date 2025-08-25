precision highp float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform float uThresh;
void main(){
  vec3 c = texture2D(uSrc, vUv).rgb;
  float m = max(max(c.r,c.g),c.b);
  vec3 h = smoothstep(uThresh, 1.0, vec3(m))*c;
  gl_FragColor = vec4(h,1.0);
}
