precision highp float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform float uGain;
vec3 toSRGB(vec3 c){ return pow(max(c,0.0), vec3(1.0/2.2)); }
void main(){
  vec3 c = texture2D(uSrc, vUv).rgb * uGain;
  gl_FragColor = vec4(toSRGB(c), 1.0);
}
