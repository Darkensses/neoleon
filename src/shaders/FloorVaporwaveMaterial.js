import * as THREE from "three";
import React, { useMemo } from "react";
import { useFrame } from "react-three-fiber";

// FIX #extension GL_OES_standard_derivatives : enable
class VaporwaveMaterialImpl extends THREE.ShaderMaterial {
  constructor(parameters = {}) {
    super(parameters);
    this.setValues(parameters);
    this._speed = { value: 6 };
    this._time = { value: 0 };
  }
  //uniforms = { time: { value: 0 }, speed: { value: 6} };

  onBeforeCompile(shader) {
    shader.uniforms.speed = this._speed;
    shader.uniforms.time = this._time;

    shader.vertexShader = `
        uniform float speed;
        uniform float time;
        varying vec3 vPos;
        ${shader.vertexShader}`;

    shader.vertexShader.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
			vec2 tuv = uv;
			float t = time * 0.001 * speed;
			vPos = transformed;`
    );

    shader.fragmentShader = `
        #ifdef GL_OES_standard_derivatives
        #extension GL_OES_standard_derivatives : enable
        #endif
        uniform float speed;
		uniform float time;
		varying vec3 vPos;
		float line(vec3 position, float width, vec3 step){
			vec3 tempCoord = position / step;
			vec2 coord = tempCoord.xz;
			coord.y -= time * speed / 2.;
			vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord * width);
			float line = min(grid.x, grid.y);
			return min(line, 1.0);
		}
        ${shader.fragmentShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
      `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
      `
			float l = line(vPos, 1.0, vec3(2.0)); // grid line width
			vec3 base = mix(vec3(0, 0.75, 0), vec3(0), smoothstep(0., 0., abs(vPos.x))); //ROAD COLOR
			vec3 c = mix(outgoingLight, base, l);
			gl_FragColor = vec4(c, diffuseColor.a);`
    );
  }

  get speed() {
    return this._speed.value;
  }
  set speed(v) {
    this._speed.value = v;
  }

  get time() {
    return this._time.value;
  }
  set time(v) {
    this._time.value = v;
  }
}

export const FloorVaporwaveMaterial = React.forwardRef(({...props}, ref) => {
    const material = useMemo(() => new VaporwaveMaterialImpl(), []);
    //useFrame((state,delta) => material && (material.time += delta));
    return <primitive dispose={null} object={material} ref={ref} attach="material" {...props}/>
})
