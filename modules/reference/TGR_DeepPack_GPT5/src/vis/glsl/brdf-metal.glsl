precision highp float;
vec3 fresnelSchlick(float cosTheta, vec3 F0){ return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0); }
vec3 normalFromSrc(vec2 uv, sampler2D tex, vec2 res){
  vec2 px = 1.0/res;
  float l = dot(texture2D(tex, uv+vec2(-px.x,0)).rgb, vec3(0.2126,0.7152,0.0722));
  float r = dot(texture2D(tex, uv+vec2( px.x,0)).rgb, vec3(0.2126,0.7152,0.0722));
  float t = dot(texture2D(tex, uv+vec2(0, px.y)).rgb, vec3(0.2126,0.7152,0.0722));
  float b = dot(texture2D(tex, uv+vec2(0,-px.y)).rgb, vec3(0.2126,0.7152,0.0722));
  return normalize(vec3(l-r, b-t, 1.0));
}
vec3 metalSpec(vec2 uv, sampler2D src, vec2 res){
  vec3 N = normalFromSrc(uv, src, res);
  vec3 V = normalize(vec3(0.0,0.0,1.0));
  vec3 L = normalize(vec3(0.5,0.3,0.7));
  vec3 H = normalize(V+L);
  float NoL = max(dot(N,L), 0.0);
  float NoH = max(dot(N,H), 0.0);
  float spec = pow(NoH, 64.0);
  vec3 F0 = vec3(0.97,0.96,0.92);
  vec3 F = fresnelSchlick(NoH, F0);
  return F * spec * NoL;
}
