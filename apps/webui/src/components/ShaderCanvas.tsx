import { useEffect, useRef, useState } from "react";
import { shaders, vertexShader } from "./util/shaders";
import { useMouseTracker } from "./util/useMouseTracker";

interface ShaderCanvasProps {
  onClick?: () => void;
  shaderId?: number;
}

export const ShaderCanvas = ({ 
  onClick, 
  shaderId = 1
}: ShaderCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const mousePositionRef = useRef<[number, number]>([0.5, 0.5]);
  const programInfoRef = useRef<any>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Get the selected shader
  const selectedShader = shaders.find(s => s.id === shaderId) || shaders[0];

  // Use optimized mouse tracker
  useMouseTracker({
    onMouseMove: (position) => {
      // Convert to WebGL coordinates (flip Y and normalize)
      const x = position.normalizedX;
      const y = 1.0 - position.normalizedY; // Flip Y coordinate for WebGL
      
      // Only update if mouse is active or smoothly transition to center
      if (position.isActive) {
        mousePositionRef.current = [x, y];
      } else {
        // Smoothly transition to center when mouse is inactive
        const current = mousePositionRef.current;
        const centerX = 0.5;
        const centerY = 0.5;
        const smoothing = 0.02; // Slower transition to center
        
        mousePositionRef.current = [
          current[0] + (centerX - current[0]) * smoothing,
          current[1] + (centerY - current[1]) * smoothing
        ];
      }
    },
    smoothing: 0.08, // Smooth mouse following
    throttleMs: 8 // ~120fps for smooth animation
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }

    const gl = canvas.getContext("webgl", {
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // Use the vertex shader and selected fragment shader
    const vsSource = vertexShader;
    const fsSource = selectedShader.fragmentShader;
    
    // Initialize shader program
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) {
      console.error("Failed to create shader program");
      return;
    }

    programInfoRef.current = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      },
      uniformLocations: {
        iResolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
        iTime: gl.getUniformLocation(shaderProgram, 'iTime'),
        iMouse: gl.getUniformLocation(shaderProgram, 'iMouse'),
        hasActiveReminders: gl.getUniformLocation(shaderProgram, 'hasActiveReminders'),
        hasUpcomingReminders: gl.getUniformLocation(shaderProgram, 'hasUpcomingReminders'),
        disableCenterDimming: gl.getUniformLocation(shaderProgram, 'disableCenterDimming'),
      },
    };

    // Create buffers
    const buffers = initBuffers(gl);
    let startTime = performance.now(); // Use performance.now for better precision

    // Resize function with optimizations
    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Limit pixel ratio for performance
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      
      canvas.width = displayWidth * pixelRatio;
      canvas.height = displayHeight * pixelRatio;
      
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    // Initial resize
    resizeCanvas();
    
    // Debounced resize listener
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };
    
    window.addEventListener('resize', debouncedResize, { passive: true });

    // Optimized render function with reduced FPS
    let lastFrameTime = 0;
    const targetFPS = 45; // Reduced from 60 to 45 for better performance
    const frameInterval = 1000 / targetFPS;
    
    const render = (currentTime: number) => {
      // Throttle to target FPS
      if (currentTime - lastFrameTime < frameInterval) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      
      lastFrameTime = currentTime;
      const elapsedTime = (currentTime - startTime) / 1000;
      
      // Get the current mouse position from ref
      const mousePos = mousePositionRef.current;
      
      drawScene(
        gl!, 
        programInfoRef.current, 
        buffers, 
        elapsedTime, 
        canvas.width, 
        canvas.height,
        mousePos
      );
      
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
      
      // Clean up WebGL resources
      if (gl && shaderProgram) {
        gl.deleteProgram(shaderProgram);
      }
    };
  }, [shaderId, selectedShader.fragmentShader]);

  // Initialize shader program
  function initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return null;

    // Create the shader program
    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return null;

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Check if it linked successfully
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  }

  // Load shader
  function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Check if compilation succeeded
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  // Initialize buffers
  function initBuffers(gl: WebGLRenderingContext) {
    // Create a buffer for positions
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0,
      -1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a buffer for texture coordinates
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    const textureCoordinates = [
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

    // Create a buffer for indices
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = [
      0, 1, 2,
      0, 2, 3,
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer,
    };
  }

  // Draw the scene
  function drawScene(
    gl: WebGLRenderingContext, 
    programInfo: any, 
    buffers: any, 
    currentTime: number, 
    width: number, 
    height: number,
    mousePos: [number, number]
  ) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set shader uniforms
    gl.uniform2f(programInfo.uniformLocations.iResolution, width, height);
    gl.uniform1f(programInfo.uniformLocations.iTime, currentTime);
    gl.uniform2f(programInfo.uniformLocations.iMouse, mousePos[0] * width, mousePos[1] * height);
    gl.uniform1i(programInfo.uniformLocations.hasActiveReminders, 0);
    gl.uniform1i(programInfo.uniformLocations.hasUpcomingReminders, 0);
    gl.uniform1i(programInfo.uniformLocations.disableCenterDimming, 1);

    // Set vertex position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      2,        // 2 components per vertex
      gl.FLOAT, // the data is 32-bit floats
      false,    // don't normalize
      0,        // stride
      0         // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    // Set texture coordinate attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
      programInfo.attribLocations.textureCoord,
      2,        // 2 components per vertex
      gl.FLOAT, // the data is 32-bit floats
      false,    // don't normalize
      0,        // stride
      0         // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

    // Draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.drawElements(
      gl.TRIANGLES,
      6,                // vertex count
      gl.UNSIGNED_SHORT,// type
      0                 // offset
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full" 
      style={{ 
        zIndex: 0,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
};