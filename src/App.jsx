import React from "react";
import { Canvas } from "@react-three/fiber";

export default function App() {
  return (
    <div style={styles.root}>
      <Canvas shadows>
        <color attach="background" args={["#0f172a"]} />
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
