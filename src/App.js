import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { OrbitControls, Stars } from "drei";
import * as THREE from "three";
import { Canvas, extend, useFrame, useLoader, useThree } from 'react-three-fiber';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import cerrosilla from "./assets/cerromitad2.glb";
import "./App.css";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass'
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"

extend({EffectComposer, RenderPass, FilmPass, UnrealBloomPass})

function CerroModel() {  
  let model = useLoader(GLTFLoader, cerrosilla);
  
  return (      
    <group
      position={[40, -74, -300]}
      scale={[50, 50, 50]}
      rotation={[(-2 * Math.PI) / 180, (110 * Math.PI) / 180, 0]}
    >
      <mesh {...model.nodes["EXPORT_GOOGLE_SAT_WM"]}>
        <meshBasicMaterial attach="material" color="#448AFF" wireframe fog={false}/>
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
    speed: { value: 1 },
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
      position={[0, 0, 0]}
      ref={grid}
      args={[limit * 2, division, "#00eece", "#00eece"]}
      material={GridShader}  
      material-uniforms-speed-value={1}    
    />    
  );
}

function mathRandom(num = 8) {
  var numValue = - Math.random() * num + Math.random() * num;
  return numValue;
};

function City () {
  let ref = useRef();

  const dummy = useMemo(() => new THREE.Object3D(), [])
  let cityLimit = (limit * 2) - 20;
  let builds = useMemo(() => {
    const sideLeft = [];
    const sideRight = [];
    for(let i = 0; i < 150; i++) {
      sideLeft.push({
        position: {x: Math.random() * (-limit + 20) - 10, y: 0, z: Math.random() * cityLimit - (cityLimit/2)},
        scale: {x: 0.9+mathRandom(1-0.9), y: 0.1+Math.abs(mathRandom(8)), z: 0.9+mathRandom(1-0.9)}
      });
      sideRight.push({
        position: {x: Math.random() * (limit - 20) + 10, y: 0, z: Math.random() * cityLimit - (cityLimit/2)},
        scale: {x: 0.9+mathRandom(1-0.9), y: 0.1+Math.abs(mathRandom(8)), z: 0.9+mathRandom(1-0.9)}
      })         
    }
    return {sideLeft, sideRight};
  },[cityLimit]);

  useLayoutEffect(() => {
    
  },[])

  useEffect(() => {
    builds.sideLeft.forEach((build, i) => {
      dummy.position.set(build.position.x, build.position.y, build.position.z);
      dummy.scale.set(build.scale.x * 5, build.scale.y * 5, build.scale.z * 5)
      dummy.position.setY((build.scale.y*5)/2)
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix)
    });

    builds.sideRight.forEach((build, i) => {
      dummy.position.set(build.position.x, build.position.y, build.position.z);
      dummy.scale.set(build.scale.x * 5, build.scale.y * 5, build.scale.z * 5)
      dummy.position.setY((build.scale.y*5)/2)
      dummy.updateMatrix();
      ref.current.setMatrixAt(i+150, dummy.matrix)
    });
    ref.current.instanceMatrix.needsUpdate = true    
  }, [builds.sideLeft, builds.sideRight, dummy])

  return(
    <>
      <directionalLight position={[10, 1, 1]} color="#ffffff" />
      <directionalLight position={[-1, -1, -1]} color="#ffd738" />
      <ambientLight color="#ffffff" />
      <instancedMesh ref={ref} args={[null, null, 300]}>
        <boxGeometry attach="geometry" args={[1,1,1]}/>
        <meshPhongMaterial attach="material" color="#880E4F" flatShading={true} />
      </instancedMesh>
    </>
  )
}

function Floor() {
  return(
    <mesh rotation={[-Math.PI / 2,0,0]}>
      <planeGeometry attach="geometry" args={[limit*2, limit*2]}/>
      <meshPhongMaterial attach="material" color="#880E4F" flatShading={true} />
    </mesh>      
  )
}

function Effects() {
  const composer = useRef();
  const {gl, size, scene, camera} = useThree();
  const aspect = useMemo(() => new THREE.Vector2(size.width, size.height), [
    size,
  ])
  useEffect(() => void composer.current.setSize(size.width, size.height), [size])
  useFrame(() => composer.current.render(), 1)
//strength, radius, threshold
  return(
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" scene={scene} camera={camera} />
      <filmPass attachArray="passes" args={[0.25, 0.4, 640, false]} />
      <unrealBloomPass attachArray="passes" args={[aspect, 2.9, 0, 0.24]} />
    </effectComposer>
  )
}

function App() {
  let ref = useRef();
  return (
    <div className="App">
      <div className="App__credits">
        <a href="https://www.facebook.com/neoleon2025" target="_blank" rel="noopener noreferrer">Neoleon 2025</a>
        <a href="https://github.com/Darkensses/neoleon" target="_blank" rel="noopener noreferrer">Github</a>
        <a href="https://github.com/Darkensses" target="_blank" rel="noopener noreferrer">@Darkensses</a>
        <a href="https://github.com/Laborico" target="_blank" rel="noopener noreferrer">@Laborico</a>        
      </div>
      <Canvas 
        camera={{ position: [0, 30, 100], rotation:[-0.30,0,0], fov: 60 }} 
        onClick={()=>console.log(ref.current.object)}
        onCreated={({ gl }) => {      
          gl.clear(true,true,true)    
          gl.clearColor()
          gl.setClearColor(new THREE.Color(0x17001a))
        }}
      >
        <Effects/>
        <Stars
          radius={100} // Radius of the inner sphere (default=100)
          depth={50} // Depth of area where stars should fit (default=50)
          count={5000} // Amount of stars (default=5000)
          factor={6} // Size factor (default=4)
          saturation={0} // Saturation 0-1 (default=0)
          fade // Faded dots (default=false)          
        />                
        <Suspense fallback="Loading...">
          <CerroModel />
        </Suspense>
        <fog attach="fog" args={[0x17001a, 50, 120]} />
        <Floor/>
        <GridPlane />
        <City/>
        <OrbitControls ref={ref}/>
        
      </Canvas>
    </div>
  );
}

//cyberpurple: 500960,17001a

export default App;