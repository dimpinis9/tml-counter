"use client";

import { useEffect, useRef } from "react";

export function DepthPhoto({
  imageSrc,
  depthSrc,
  label,
  motionEnabled,
  movement,
}: {
  imageSrc: string;
  depthSrc: string;
  label: string;
  motionEnabled: boolean;
  movement: { x: number; y: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const movementRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    movementRef.current = motionEnabled ? movement : { x: 0, y: 0 };
  }, [motionEnabled, movement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    if (!gl || gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 1) return;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;

    const mesh = createGrid(72, 46);
    const positionBuffer = gl.createBuffer();
    const uvBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    if (!positionBuffer || !uvBuffer || !indexBuffer) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    const imageTexture = createTexture(gl);
    const depthTexture = createTexture(gl);
    if (!imageTexture || !depthTexture) return;

    let cancelled = false;
    let animationFrame = 0;
    let currentX = 0;
    let currentY = 0;
    const cleanupRef = {
      current: () => {
        cancelAnimationFrame(animationFrame);
      },
    };

    void Promise.all([
      loadTexture(gl, imageTexture, imageSrc),
      loadTexture(gl, depthTexture, depthSrc),
    ]).then(([imageAspect]) => {
      if (cancelled) return;
      gl.useProgram(program);

      const positionLocation = gl.getAttribLocation(program, "aPosition");
      const uvLocation = gl.getAttribLocation(program, "aUv");
      const movementLocation = gl.getUniformLocation(program, "uMovement");
      const scaleLocation = gl.getUniformLocation(program, "uScale");
      const imageLocation = gl.getUniformLocation(program, "uImage");
      const depthLocation = gl.getUniformLocation(program, "uDepth");

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.enableVertexAttribArray(uvLocation);
      gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.uniform1i(imageLocation, 0);
      gl.uniform1i(depthLocation, 1);

      const resizeObserver = new ResizeObserver(() => resizeCanvas(canvas, gl));
      resizeObserver.observe(canvas);
      resizeCanvas(canvas, gl);

      const render = () => {
        const target = movementRef.current;
        currentX += (target.x - currentX) * 0.075;
        currentY += (target.y - currentY) * 0.075;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.uniform2f(movementLocation, currentX, currentY);
        const canvasAspect = canvas.width / canvas.height;
        const scaleX =
          canvasAspect > imageAspect ? imageAspect / canvasAspect : 1;
        const scaleY =
          canvasAspect > imageAspect ? 1 : canvasAspect / imageAspect;
        gl.uniform2f(scaleLocation, scaleX, scaleY);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawElements(
          gl.TRIANGLES,
          mesh.indices.length,
          gl.UNSIGNED_SHORT,
          0,
        );
        animationFrame = requestAnimationFrame(render);
      };
      render();

      canvas.dataset.ready = "true";
      cleanupRef.current = () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(animationFrame);
      };
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      cleanupRef.current();
      gl.deleteTexture(imageTexture);
      gl.deleteTexture(depthTexture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(uvBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteProgram(program);
    };
  }, [depthSrc, imageSrc]);

  return (
    <canvas
      aria-label={`${label} interactive depth view`}
      className="stage-depth-canvas"
      ref={canvasRef}
      role="img"
    />
  );
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createTexture(gl: WebGLRenderingContext) {
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

function loadTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  src: string,
) {
  return new Promise<number>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      resolve(image.naturalWidth / image.naturalHeight);
    };
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

function createGrid(columns: number, rows: number) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      const v = row / rows;
      positions.push(u * 2 - 1, v * 2 - 1);
      uvs.push(u, v);
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const topLeft = row * (columns + 1) + column;
      const bottomLeft = (row + 1) * (columns + 1) + column;
      indices.push(
        topLeft,
        bottomLeft,
        topLeft + 1,
        topLeft + 1,
        bottomLeft,
        bottomLeft + 1,
      );
    }
  }

  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
) {
  const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
  const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
  const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }
}

const vertexShaderSource = `
  attribute vec2 aPosition;
  attribute vec2 aUv;
  uniform sampler2D uDepth;
  uniform vec2 uMovement;
  uniform vec2 uScale;
  varying vec2 vUv;

  void main() {
    float depth = texture2D(uDepth, aUv).r;
    float relativeDepth = depth - 0.48;
    vec2 depthShift = uMovement * relativeDepth * 0.075;
    vec2 position = (aPosition + depthShift) * uScale * 1.035;
    float perspective = 1.0 + relativeDepth * 0.035;
    gl_Position = vec4(position * perspective, 0.0, 1.0);
    vUv = aUv - depthShift * 0.52;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform sampler2D uImage;
  varying vec2 vUv;

  void main() {
    vec2 safeUv = clamp(vUv, vec2(0.002), vec2(0.998));
    vec4 color = texture2D(uImage, safeUv);
    gl_FragColor = vec4(color.rgb, 1.0);
  }
`;
