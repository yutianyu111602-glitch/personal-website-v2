// Collection of shader programs for the app

// Shader 1: Flowing Waves - Silver Theme
export const flowingWavesShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform bool hasActiveReminders;
uniform bool hasUpcomingReminders;
uniform bool disableCenterDimming;
varying vec2 vTextureCoord;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
  
  // Mouse direction influence
  vec2 mousePos = iMouse.xy / iResolution.xy;
  vec2 mouseDir = (mousePos - 0.5) * 2.0;
  float mouseInfluence = length(mouseDir) * 0.3;
  
  // Apply subtle mouse direction to wave distortion
  uv += mouseDir * 0.1 * sin(iTime * 0.5);

  for(float i = 1.0; i < 10.0; i++){
    uv.x += 0.6 / i * cos(i * 2.5 * uv.y + iTime + mouseInfluence);
    uv.y += 0.6 / i * cos(i * 1.5 * uv.x + iTime + mouseInfluence);
  }
  
  // Professional silver color palette
  float intensity = 1.0 / abs(sin(iTime - uv.y - uv.x));
  vec3 platinum = vec3(0.88, 0.90, 0.93);     // Pure platinum
  vec3 lightSilver = vec3(0.78, 0.81, 0.85);  // Light silver
  vec3 mediumSilver = vec3(0.65, 0.68, 0.72); // Medium silver
  vec3 darkSilver = vec3(0.48, 0.52, 0.56);   // Dark silver
  
  // Create sophisticated flowing silver gradients
  float gradient = sin(uv.x * 2.0 + iTime * 0.5) * 0.5 + 0.5;
  float secondaryGradient = cos(uv.y * 1.5 + iTime * 0.3) * 0.5 + 0.5;
  
  vec3 baseColor = mix(darkSilver, platinum, gradient);
  baseColor = mix(baseColor, lightSilver, secondaryGradient * 0.6);
  vec3 color = baseColor * intensity * 0.18;
  
  // Add metallic sheen
  float metallicSheen = sin(gradient * 3.14159 + iTime) * 0.1 + 0.9;
  color *= metallicSheen;
  
  fragColor = vec4(color, 1.0);
}

void main() {
  vec2 fragCoord = vTextureCoord * iResolution;
  vec4 color;
  mainImage(color, fragCoord);
  gl_FragColor = color;
}
`;

// Shader 2: Ether - Silver Theme
export const etherShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform bool hasActiveReminders;
uniform bool hasUpcomingReminders;
uniform bool disableCenterDimming;
varying vec2 vTextureCoord;

// Ether by nimitz 2014 - Modified for silver theme
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

#define t iTime
mat2 m(float a){float c=cos(a), s=sin(a);return mat2(c,-s,s,c);}
float map(vec3 p){
    // Mouse direction influence
    vec2 mouseDir = (iMouse.xy / iResolution.xy - 0.5) * 2.0;
    p.xz += mouseDir.xy * 0.2;
    
    p.xz*= m(t*0.4);p.xy*= m(t*0.3);
    vec3 q = p*2.+t;
    return length(p+vec3(sin(t*0.7)))*log(length(p)+1.) + sin(q.x+sin(q.z+sin(q.y)))*0.5 - 1.;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 p = fragCoord.xy/min(iResolution.x, iResolution.y) - vec2(.9, .5);
    p.x += 0.4;
    
    vec3 cl = vec3(0.);
    float d = 2.5;
    
    // Ray marching loop
    for(int i=0; i<=5; i++) {
        vec3 p3d = vec3(0,0,5.) + normalize(vec3(p, -1.))*d;
        float rz = map(p3d);
        float f = clamp((rz - map(p3d+.1))*0.5, -.1, 1.);
        
        // Enhanced silver palette - professional color scheme
        vec3 platinum = vec3(0.85, 0.87, 0.90);    // Pure platinum
        vec3 lightSilver = vec3(0.75, 0.78, 0.82); // Light silver
        vec3 mediumSilver = vec3(0.60, 0.63, 0.67); // Medium silver
        vec3 darkSilver = vec3(0.40, 0.43, 0.47);   // Dark silver
        
        // Create more sophisticated silver gradients
        vec3 baseColor = mix(darkSilver, platinum, f * f) + lightSilver * f * 2.5;
        baseColor = mix(baseColor, mediumSilver, sin(f * 3.14159) * 0.3);
        
        cl = cl*baseColor + smoothstep(2.5, .0, rz)*.7*baseColor;
        d += min(rz, 1.);
    }
    
    // Enhanced mouse interaction with platinum glow
    if(iMouse.x > 0.0 || iMouse.y > 0.0) {
        vec2 mousePos = iMouse.xy;
        float mouseDist = length(p - (mousePos*2.0-vec2(1.0))*0.5);
        float mouseInfluence = smoothstep(0.6, 0.0, mouseDist);
        // Professional silver glow effect
        vec3 platinumGlow = vec3(0.88, 0.90, 0.93);
        cl += platinumGlow * mouseInfluence * 0.6;
    }
    
    // Add subtle silver ambient enhancement
    cl = mix(cl, cl * vec3(0.85, 0.87, 0.90), 0.2);
    
    fragColor = vec4(cl, 1.0);
}

void main() {
    vec2 fragCoord = vTextureCoord * iResolution;
    vec4 color;
    mainImage(color, fragCoord);
    gl_FragColor = color;
}
`;

// Shader 3: Shooting Stars - Silver Theme
export const shootingStarsShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform bool hasActiveReminders;
uniform bool hasUpcomingReminders;
uniform bool disableCenterDimming;
varying vec2 vTextureCoord;

void mainImage(out vec4 O, in vec2 fragCoord) {
  // Professional dark silver background
  O = vec4(0.08, 0.09, 0.12, 1.0);
  
  // Mouse direction influence
  vec2 mouseDir = (iMouse.xy / iResolution.xy - 0.5) * 2.0;
  float mouseInfluence = length(mouseDir);
  
  vec2 b = vec2(0.0, 0.2 + mouseInfluence * 0.1);
  vec2 p;
  mat2 R = mat2(1.0, 0.0, 0.0, 1.0);
  
  // Using a proper GLSL loop structure
  for(int i = 0; i < 20; i++) {
    float fi = float(i) + 1.0;
    
    // Mouse influence on rotation
    float angle = fi + mouseDir.x * 0.5;
    float c = cos(angle);
    float s = sin(angle);
    R = mat2(c, -s, s, c);
    
    float angle2 = fi + 33.0 + mouseDir.y * 0.5;
    float c2 = cos(angle2);
    float s2 = sin(angle2);
    mat2 R2 = mat2(c2, -s2, s2, c2);
    
    // Calculate position with mouse influence
    vec2 coord = fragCoord / iResolution.y * fi * 0.1 + iTime * b;
    coord += mouseDir * 0.05;
    vec2 frac_coord = fract(coord * R2) - 0.5;
    p = R * frac_coord;
    vec2 clamped_p = clamp(p, -b, b);
    
    // Calculate intensity and enhanced silver colors
    float len = length(clamped_p - p);
    if (len > 0.0) {
      // Professional silver color palette for stars
      vec4 silverStar = 1e-3 / len * (cos(p.y / 0.1 + vec4(0.0, 0.15, 0.3, 0.45)) * 0.5 + 0.5);
      
      // Apply professional silver tones
      vec3 starPlatinum = vec3(0.88, 0.90, 0.93);   // Platinum highlight
      vec3 starSilver = vec3(0.75, 0.78, 0.82);     // Pure silver
      vec3 starChrome = vec3(0.62, 0.65, 0.69);     // Chrome accent
      
      // Create silver gradient based on intensity
      float intensity = silverStar.a;
      vec3 silverGradient = mix(starChrome, starPlatinum, intensity * intensity);
      silverStar.rgb = silverGradient * intensity;
      silverStar.rgb += starSilver * intensity * 0.5;
      
      O += silverStar;
    }
  }
  
  // Professional silver theme enhancement
  vec3 silverTone = vec3(0.82, 0.85, 0.88);
  O.rgb = mix(O.rgb, O.rgb * silverTone, 0.4);
  
  // Add subtle platinum shimmer
  float shimmer = sin(fragCoord.x * 0.02 + iTime * 2.0) * 0.05 + 0.95;
  O.rgb *= shimmer;
}

void main() {
  vec2 fragCoord = vTextureCoord * iResolution;
  vec4 color;
  mainImage(color, fragCoord);
  gl_FragColor = color;
}
`;



// Common vertex shader for all shaders
export const vertexShader = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
varying vec2 vTextureCoord;
void main() {
  gl_Position = aVertexPosition;
  vTextureCoord = aTextureCoord;
}
`;

// Shader 4: Black Hole - Silver Theme
export const blackHoleShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform bool hasActiveReminders;
uniform bool hasUpcomingReminders;
uniform bool disableCenterDimming;
varying vec2 vTextureCoord;

#define PI 3.14159265359
#define TAU 6.28318530718

// Hash function for noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Simple noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractional Brownian Motion
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}

// Black hole gravitational lensing effect with mouse influence
vec2 blackHoleLens(vec2 uv, vec2 center, float mass, float time, vec2 mouseDir) {
    vec2 toCenter = uv - center;
    float dist = length(toCenter);
    
    // Mouse influence on black hole mass
    float adjustedMass = mass + length(mouseDir) * 0.5;
    float rs = adjustedMass * 0.1;
    
    if (dist < rs) {
        return vec2(-1000.0, -1000.0);
    }
    
    // Gravitational lensing with mouse direction influence
    float lensing = rs / (dist * dist);
    vec2 direction = normalize(toCenter);
    
    float angle = lensing * 2.0 + time * 0.3 + dot(mouseDir, direction) * 0.5;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    direction = rotation * direction;
    
    vec2 lensedUV = center + direction * (dist + lensing * 0.5);
    return lensedUV;
}

// Professional silver accretion disk color palette
vec3 silverAccretionColor(float angle, float radius, float time) {
    float spiral = sin(angle * 3.0 - radius * 8.0 + time * 2.0) * 0.5 + 0.5;
    float temp = (1.0 - radius) * 2.0 + spiral * 0.3;
    
    // Professional silver color gradients based on temperature
    vec3 color;
    if (temp > 1.5) {
        // Very hot - brilliant platinum
        vec3 platinum = vec3(0.92, 0.94, 0.97);
        vec3 brightSilver = vec3(0.78, 0.82, 0.86);
        color = mix(brightSilver, platinum, (temp - 1.5) * 2.0);
    } else if (temp > 1.0) {
        // Hot - pure silver
        vec3 pureSilver = vec3(0.75, 0.78, 0.82);
        vec3 brightSilver = vec3(0.85, 0.88, 0.92);
        color = mix(pureSilver, brightSilver, (temp - 1.0) * 2.0);
    } else if (temp > 0.5) {
        // Medium - chrome silver
        vec3 chromeSilver = vec3(0.58, 0.62, 0.66);
        vec3 mediumSilver = vec3(0.68, 0.72, 0.76);
        color = mix(chromeSilver, mediumSilver, (temp - 0.5) * 2.0);
    } else {
        // Cool - dark metallic
        vec3 darkMetal = vec3(0.35, 0.38, 0.42);
        vec3 coolSilver = vec3(0.50, 0.54, 0.58);
        color = mix(darkMetal, coolSilver, temp * 2.0);
    }
    
    return color;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = (uv - 0.5) * 2.0;
    
    float aspect = iResolution.x / iResolution.y;
    uv.x *= aspect;
    
    // Mouse direction influence
    vec2 mouseDir = (iMouse.xy / iResolution.xy - 0.5) * 2.0;
    mouseDir.x *= aspect;
    
    vec2 blackHoleCenter = mouseDir * 0.1; // Mouse slightly influences black hole position
    float time = iTime * 0.5;
    
    // Apply gravitational lensing with mouse influence
    vec2 lensedUV = blackHoleLens(uv, blackHoleCenter, 1.0, time, mouseDir);
    
    // Check if we're in the event horizon
    float distToCenter = length(uv - blackHoleCenter);
    float eventHorizon = 0.15;
    
    if (distToCenter < eventHorizon || lensedUV.x < -500.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Calculate position relative to black hole for accretion disk
    vec2 toCenter = uv - blackHoleCenter;
    float radius = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x);
    
    // Accretion disk parameters
    float innerRadius = 0.2;
    float outerRadius = 0.8;
    
    vec3 finalColor = vec3(0.0);
    
    if (radius > innerRadius && radius < outerRadius) {
        float diskMask = smoothstep(innerRadius, innerRadius + 0.05, radius) * 
                        smoothstep(outerRadius, outerRadius - 0.1, radius);
        
        float turbulence = fbm(lensedUV * 5.0 + time * 0.5) * 0.3;
        float adjustedRadius = (radius - innerRadius) / (outerRadius - innerRadius) + turbulence;
        
        float rotationSpeed = 1.0 / (radius * radius + 0.1);
        float spiralAngle = angle + time * rotationSpeed * 3.0;
        
        // Get silver accretion disk color
        vec3 diskColor = silverAccretionColor(spiralAngle, adjustedRadius, time);
        
        float brightness = (1.0 - adjustedRadius) * 2.0;
        brightness *= 1.0 + sin(spiralAngle * 8.0 + time * 4.0) * 0.2;
        brightness *= diskMask;
        brightness *= 0.7 + 0.3 * fbm(lensedUV * 10.0 + time);
        
        finalColor = diskColor * brightness;
        
        float dopplerShift = sin(spiralAngle + time * 2.0) * 0.3 + 0.7;
        finalColor *= dopplerShift;
    }
    
    // Professional silver background stars
    vec2 starUV = lensedUV + time * 0.1;
    float stars = noise(starUV * 20.0);
    if (stars > 0.97) {
        float starBrightness = (stars - 0.97) / 0.03;
        vec3 starColor = vec3(0.85, 0.88, 0.92); // Platinum star color
        finalColor += starColor * starBrightness * 0.6;
    }
    
    // Apply professional silver tone overall
    vec3 professionalSilver = vec3(0.83, 0.86, 0.89);
    finalColor = mix(finalColor, finalColor * professionalSilver, 0.25);
    
    // Add subtle metallic sheen
    float metallicSheen = 1.0 + sin(time * 0.5) * 0.08;
    finalColor *= metallicSheen;
    
    fragColor = vec4(finalColor, 1.0);
}

void main() {
    vec2 fragCoord = vTextureCoord * iResolution;
    vec4 color;
    mainImage(color, fragCoord);
    gl_FragColor = color;
}
`;

// Shader collection for easy access
export const shaders = [
  {
    id: 0,
    name: "Clock Theme",
    fragmentShader: "", // Uses ShaderBackground component
    color: "#9ca3af" // Silver gray
  },
  {
    id: 1,
    name: "Flowing Waves",
    fragmentShader: flowingWavesShader,
    color: "#d8dde2" // Platinum silver
  },
  {
    id: 2,
    name: "Ether",
    fragmentShader: etherShader,
    color: "#c8cdd2" // Professional silver
  },
  {
    id: 3,
    name: "Shooting Stars",
    fragmentShader: shootingStarsShader,
    color: "#d4d9de" // Platinum silver
  },
  {
    id: 4,
    name: "Black Hole",
    fragmentShader: blackHoleShader,
    color: "#374151" // Darkest silver
  }
];