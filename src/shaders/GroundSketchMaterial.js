import * as THREE from "three";
import React, { useMemo } from "react";

class SketchMaterialImpl extends THREE.RawShaderMaterial {
  constructor(parameters = {}) {
    super(parameters);
    this.setValues(parameters);
    this._time = { value: 0 };
  }

  uniforms = { time: {value: 0}}

  vertexShader = `      
    attribute vec3 position;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float time;

    varying vec3 vPosition;

    void main() {
    float sin1 = sin((position.x + position.y) * 0.2 + time * 0.5);
    float sin2 = sin((position.x - position.y) * 0.4 + time * 2.0);
    float sin3 = sin((position.x + position.y) * -0.6 + time);
    vec3 updatePosition = vec3(position.x, position.y, position.z + sin1 * 5.0 + sin2 * 2.0 + sin3 * 4.0);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(updatePosition, 1.0);
    }
    `;

  fragmentShader = `
    precision highp float;

    uniform float time;

    varying vec3 vPosition;

    const float duration = 8.0;
    const float delay = 4.0;

    vec3 convertHsvToRgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
    float now = clamp((time - delay) / duration, 0.0, 1.0);
    float opacity = (1.0 - length(vPosition.xy / vec2(512.0))) * 0.6 * now;
    vec3 v = normalize(vPosition);
    vec3 rgb = convertHsvToRgb(vec3(0.5 + (v.x + v.y + v.x) / 40.0 + time * 0.1, 0.4, 1.0));
    gl_FragColor = vec4(rgb, opacity);
    }
    `;

  get time() {
    return this._time.value;
  }
  set time(v) {
    this._time.value = v;
  }
}

export const GroundSketchMaterial = React.forwardRef(({...props}, ref) => {
    const material = useMemo(() => new SketchMaterialImpl(), []);
    return <primitive dispose={null} object={material} ref={ref} attach="material" {...props}/>
})