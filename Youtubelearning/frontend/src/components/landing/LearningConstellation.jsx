import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, OrbitControls, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Node({ position, label, color }) {
  return (
    <Float speed={1.8} rotationIntensity={0.7} floatIntensity={0.9}>
      <mesh position={position}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} roughness={0.35} />
        <Html distanceFactor={7} position={[0, 0.35, 0]} center>
          <div className="rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[11px] font-semibold text-white shadow-2xl backdrop-blur-md">
            {label}
          </div>
        </Html>
      </mesh>
    </Float>
  );
}

function Connections({ points }) {
  const geometry = useMemo(() => {
    const vertices = [];
    for (let i = 0; i < points.length; i += 1) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      vertices.push(...current, ...next);
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return buffer;
  }, [points]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#60a5fa" transparent opacity={0.34} />
    </lineSegments>
  );
}

function Scene() {
  const groupRef = useRef(null);
  const nodes = [
    { label: "Video", color: "#60a5fa", position: [-1.8, 0.7, 0] },
    { label: "Quiz", color: "#a78bfa", position: [1.5, 0.8, -0.25] },
    { label: "Notes", color: "#22d3ee", position: [-0.2, -1.05, 0.35] },
    { label: "AI Tutor", color: "#34d399", position: [0.1, 0.05, 1.25] },
  ];

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });

  return (
    <>
      <ambientLight intensity={0.75} />
      <pointLight position={[2, 3, 4]} intensity={1.8} color="#93c5fd" />
      <pointLight position={[-4, -2, 2]} intensity={1.1} color="#a78bfa" />
      <Sparkles count={80} scale={[5.2, 3.2, 3.2]} size={1.35} speed={0.35} color="#bfdbfe" />
      <group ref={groupRef}>
        <Connections points={nodes.map((node) => node.position)} />
        {nodes.map((node) => (
          <Node key={node.label} {...node} />
        ))}
        <mesh>
          <torusKnotGeometry args={[0.58, 0.045, 160, 14]} />
          <meshStandardMaterial color="#f8fafc" emissive="#2563eb" emissiveIntensity={0.35} metalness={0.35} roughness={0.25} />
        </mesh>
      </group>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.45} />
    </>
  );
}

export default function LearningConstellation() {
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-[0_30px_120px_rgba(37,99,235,0.22)]">
      <div className="absolute inset-x-6 top-5 z-10 flex items-center justify-between text-xs text-white/70">
        <span>Interactive Learning Graph</span>
        <span className="rounded-full bg-white/10 px-3 py-1">drag to explore</span>
      </div>
      <Canvas camera={{ position: [0, 0.35, 5.2], fov: 45 }} dpr={[1, 1.6]}>
        <Scene />
      </Canvas>
    </div>
  );
}
