import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';

const DNA = () => {
  const ref = useRef();
  const { scene } = useGLTF('/models/dna.glb'); 

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.005;
    }
  });

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={0.135}
      position={[0, -2, 0]} 
    />
  );
};

const DnaViewer = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 2, 5]} intensity={1} />

      <Suspense fallback={
        <Html>
          <div style={{ color: 'gray' }}>Loading DNA...</div>
        </Html>
      }>
        <DNA />
      </Suspense>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate={true} />
    </Canvas>
  );
};

export default DnaViewer;
