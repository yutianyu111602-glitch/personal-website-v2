import { useEffect, useRef } from 'react';
import { useMouseTracker } from './util/useMouseTracker';

export const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePositionRef = useRef<[number, number]>([0.5, 0.5]);

  // Use optimized mouse tracker
  useMouseTracker({
    onMouseMove: (position) => {
      // Convert to shader coordinates
      const x = position.normalizedX;
      const y = 1.0 - position.normalizedY; // Flip Y coordinate for WebGL
      
      if (position.isActive) {
        mousePositionRef.current = [x, y];
      } else {
        // Smoothly transition to center when mouse is inactive
        const current = mousePositionRef.current;
        const centerX = 0.5;
        const centerY = 0.5;
        const smoothing = 0.015; // Slower transition to center
        
        mousePositionRef.current = [
          current[0] + (centerX - current[0]) * smoothing,
          current[1] + (centerY - current[1]) * smoothing
        ];
      }
    },
    smoothing: 0.06, // Smooth mouse following
    throttleMs: 8 // ~120fps for smooth animation
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    
    if (!gl) return;

    // Set canvas size
    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Limit for performance
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      
      canvas.width = displayWidth * pixelRatio;
      canvas.height = displayHeight * pixelRatio;
      
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();

    // Debounced resize listener
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };
    
    window.addEventListener('resize', debouncedResize, { passive: true });

    // Vertex shader source
    const vertexShaderSource = `
      attribute vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

    // Fragment shader with highly optimized silver clock theme
    const fragmentShaderSource = `
      precision lowp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      // Simplified palette function
      vec3 palette(float t) {
        return vec3(0.7, 0.75, 0.8) + vec3(0.1, 0.1, 0.15) * cos(6.28 * t + vec3(0.0, 0.33, 0.67));
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
        vec2 uv0 = uv;
        vec3 finalColor = vec3(0.0);
        
        // Simplified mouse interaction
        vec2 mouse = (u_mouse * 2.0 - u_resolution.xy) / u_resolution.y;
        float mouseEffect = 1.0 + 0.05 * sin(distance(uv, mouse) * 3.0 - u_time);
        
        // Reduced to 2 iterations for better performance
        for (float i = 0.0; i < 2.0; i++) {
          uv = fract(uv * 1.3) - 0.5;
          
          float d = length(uv) * exp(-length(uv0) * 0.5);
          vec3 col = palette(length(uv0) + i * 0.5 + u_time * 0.2);
          
          d = sin(d * 6.0 + u_time * mouseEffect) / 6.0;
          d = abs(d);
          d = 0.015 / d;
          
          finalColor += col * d;
        }
        
        // Simplified metallic effect
        float metallic = 0.1 + 0.03 * sin(length(uv0) * 6.0 + u_time * 0.5);
        finalColor = mix(finalColor, vec3(0.65, 0.7, 0.75), metallic);
        
        // Simpler radial pattern
        float angle = atan(uv0.y, uv0.x);
        finalColor += sin(angle * 8.0) * 0.01;
        
        gl_FragColor = vec4(finalColor * 0.7, 1.0);
      }
    `;

    // Create shader function
    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    };

    // Create program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    // Set up vertices for full screen quad
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Optimized animation loop with lower FPS for better performance
    const startTime = performance.now();
    let lastFrameTime = 0;
    const targetFPS = 45; // Reduced from 60 to 45 for better performance
    const frameInterval = 1000 / targetFPS;
    let animationId: number;
    
    const animate = (currentTime: number) => {
      // Throttle to target FPS
      if (currentTime - lastFrameTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime = currentTime;
      const time = (currentTime - startTime) / 1000;
      
      // Get mouse position
      const mousePos = mousePositionRef.current;
      const mouseX = mousePos[0] * canvas.width;
      const mouseY = mousePos[1] * canvas.height;
      
      gl.useProgram(program);
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(mouseLocation, mouseX, mouseY);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
      
      // Clean up WebGL resources
      if (gl && program) {
        gl.deleteProgram(program);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
};