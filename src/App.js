import React, { Suspense, useEffect, useRef } from 'react';
import { OrbitControls, Stars } from "drei";
import * as THREE from "three";
import { Canvas, useFrame, useLoader } from 'react-three-fiber';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import cerrosilla from "./assets/cerromitad2.glb";
import "./App.css";

function CerroModel() {  
  let model = useLoader(GLTFLoader, cerrosilla);
  console.log(model.nodes["EXPORT_GOOGLE_SAT_WM"]);
  return (
    <group
      position={[60, -89, -300]}
      scale={[50, 50, 50]}
      rotation={[(-2 * Math.PI) / 180, (110 * Math.PI) / 180, 0]}
    >
      <mesh {...model.nodes["EXPORT_GOOGLE_SAT_WM"]}>
        <meshBasicMaterial attach="material" color="cyan" wireframe />
      </mesh>
    </group>
  );
}


let limit = 100;
let division = 20;

const GridShader = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    limits: { value: new THREE.Vector2(-limit, limit) },
    speed: { value: 6 },
  },
  vertexShader: `
  uniform float time;
  uniform vec2 limits;
  uniform float speed;

  attribute float moveable;

  varying vec3 vColor;

  void main() {
    vColor = color;
    float limLen = limits.y - limits.x;
    vec3 pos = position;
    if (floor(moveable + 0.5) > 0.5){
      float dist = speed * time;
      float currPos = mod((pos.z + dist) - limits.x, limLen) + limits.x;
      pos.z = currPos;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
  }
  `,
  fragmentShader: `
  varying vec3 vColor;

  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
  `,
  vertexColors: THREE.VertexColors,
});

function GridPlane() {
  let grid = useRef();
  

  useEffect(() => {
    let moveable = [];
    for (let i = 0; i <= division; i++) {
      moveable.push(1, 1, 0, 0);
    }

    grid.current.geometry.addAttribute(
      "moveable",
      new THREE.BufferAttribute(new Uint8Array(moveable), 1)
    );

    console.log(grid);    
  }, []);

  useFrame((state, delta) => {
    grid.current.material.uniforms.time.value += delta;
  });

  return (
    <gridHelper
      position={[0, -15, 0]}
      ref={grid}
      args={[limit * 2, division, "purple", "purple"]}
      material={GridShader}  
      material-uniforms-speed-value={15}    
    />    
  );
}

function App() {
  
  return (
    <div className="App">
      <div className="App__credits">
        <a href="https://www.facebook.com/neoleon2025" target="_blank" rel="noopener noreferrer">Neoleon 2025</a>
        <a href="https://github.com/Darkensses/neoleon" target="_blank" rel="noopener noreferrer">Github</a>
        <a href="https://github.com/Darkensses" target="_blank" rel="noopener noreferrer">@Darkensses</a>
        <a href="https://github.com/Laborico" target="_blank" rel="noopener noreferrer">@Laborico</a>        
      </div>
      <Canvas camera={{ position: [0, -8, 100], fov: 60 }}>
        <Stars
          radius={100} // Radius of the inner sphere (default=100)
          depth={50} // Depth of area where stars should fit (default=50)
          count={5000} // Amount of stars (default=5000)
          factor={4} // Size factor (default=4)
          saturation={0} // Saturation 0-1 (default=0)
          fade // Faded dots (default=false)
        />
        <Suspense fallback="Loading...">
          <CerroModel />
        </Suspense>
        <GridPlane />
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default App;