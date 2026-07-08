import React from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 80]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </>
  );
}

export default function App() {
  return (
    <div style={styles.root}>
      <Canvas shadows>
        <color attach="background" args={["#0f172a"]} />
        <PerspectiveCamera makeDefault position={[0, 6, 12]} fov={50} />
        <Scene />
      </Canvas>
    </div>
  );
}

const styles = {
  root: {
    position: "fixed",
    inset: 0,
    background: "#0f172a"
  }
};
