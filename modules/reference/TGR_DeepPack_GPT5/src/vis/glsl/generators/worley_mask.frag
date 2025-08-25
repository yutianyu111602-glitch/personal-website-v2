precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
float worley(vec2 uv){
  uv *= 6.0;
  vec2 i = floor(uv);
  vec2 f = fract(uv);
  float d = 1.0;
  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 g = vec2(float(x),float(y));
      vec2 o = vec2(hash(i+g), hash(i+g+1.7));
      vec2 r = g + o - f;
      d = min(d, dot(r,r));
    }
  }
  return 1.0 - sqrt(d);
}
void main(){
  float c = worley(vUv);
  gl_FragColor = vec4(vec3(c),1.0);
}
