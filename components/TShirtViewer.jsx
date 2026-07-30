"use client";

import React, { useRef, Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  useTexture,
  Decal,
  OrbitControls,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

// ── Decal projected onto the shirt ────────────────────────────────────────────
function ShirtDecal({
  targetMesh,
  decal,
}: {
  targetMesh: THREE.Mesh;
  decal: {
    src: string;
    scale?: number;
    rotation?: number;
    offsetX?: number;
    offsetY?: number;
    side?: "front" | "back";
  };
}) {
  const texture = useTexture(decal.src);

  useEffect(() => {
    if (!texture) return;
    if ("colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  const { position, rotation, scale } = useMemo(() => {
    if (!targetMesh || !targetMesh.geometry) {
      return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
    }

    targetMesh.geometry.computeBoundingBox();
    const bbox = targetMesh.geometry.boundingBox!.clone();
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const isBack = decal.side === "back";
    
    // Compute Z position slightly offset from mesh surface boundary
    const zPos = isBack
      ? bbox.min.z - size.z * 0.05
      : bbox.max.z + size.z * 0.05;

    const baseScale = Math.min(size.x, size.y) * 0.55 * (decal.scale || 1);
    const depth = Math.max(size.x, size.y, size.z) * 0.5;

    const posX = center.x + (decal.offsetX || 0) * size.x * 0.4;
    const posY = center.y + size.y * 0.12 + (decal.offsetY || 0) * size.y * 0.4;

    return {
      position: [posX, posY, zPos] as [number, number, number],
      rotation: [0, isBack ? Math.PI : 0, decal.rotation || 0] as [
        number,
        number,
        number
      ],
      scale: [baseScale, baseScale, depth] as [number, number, number],
    };
  }, [
    targetMesh,
    decal.src,
    decal.scale,
    decal.rotation,
    decal.offsetX,
    decal.offsetY,
    decal.side,
  ]);

  return (
    <Decal
      mesh={{ current: targetMesh }}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-4}
        roughness={0.8}
        toneMapped={false}
      />
    </Decal>
  );
}

// ── The actual GLB model ──────────────────────────────────────────────────────
function TShirtModel({
  color,
  decal,
  autoRotate = true,
}: {
  color: string;
  decal: any;
  autoRotate?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/tshirt.glb");

  // Clone so color changes don't mutate the cached asset
  const cloned = React.useMemo(() => scene.clone(true), [scene]);
  const [targetMesh, setTargetMesh] = useState<THREE.Mesh | null>(null);

  // Apply color to every mesh in the model, and find the target mesh
  useEffect(() => {
    const hexColor = new THREE.Color(color);
    let best: THREE.Mesh | null = null;
    let bestVolume = 0;

    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (!mesh.userData.materialCloned) {
          mesh.material = (mesh.material as THREE.Material).clone();
          mesh.userData.materialCloned = true;
        }
        (mesh.material as THREE.MeshStandardMaterial).color.set(hexColor);
        mesh.material.needsUpdate = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.geometry) {
          mesh.geometry.computeBoundingBox();
          const bb = mesh.geometry.boundingBox!;
          const size = new THREE.Vector3();
          bb.getSize(size);
          const volume = size.x * size.y * size.z;
          if (volume > bestVolume) {
            bestVolume = volume;
            best = mesh;
          }
        }
      }
    });

    setTargetMesh(best);
  }, [color, cloned]);

  // Gentle auto-rotation
  useFrame((_, delta) => {
    if (group.current && autoRotate) {
      group.current.rotation.y += delta * 0.2;
    }
  });

  // Center & scale model
  const { scale, center } = React.useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 2.6 / maxDim;
    const c = new THREE.Vector3();
    box.getCenter(c);
    return { scale: s, center: c };
  }, [cloned]);

  return (
    <group ref={group}>
      <primitive
        object={cloned}
        scale={scale}
        position={[-center.x * scale, -center.y * scale, -center.z * scale]}
      />
      {decal && targetMesh && (
        <Suspense fallback={null}>
          <ShirtDecal targetMesh={targetMesh} decal={decal} />
        </Suspense>
      )}
    </group>
  );
}

useGLTF.preload("/tshirt.glb");

// ── Loading placeholder ───────────────────────────────────────────────────────
function Loader() {
  return (
    <mesh>
      <torusGeometry args={[0.4, 0.08, 16, 60]} />
      <meshStandardMaterial color="#9ca3af" />
    </mesh>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
export default function TShirtViewer({
  color,
  decal = null,
  autoRotate = true,
}: {
  color: string;
  decal?: any;
  autoRotate?: boolean;
}) {
  const controlsRef = useRef<any>();
  const autoRotateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, -0.4, 0);
      controlsRef.current.update();
    }
  }, []);

  useEffect(() => {
    setIsAutoRotating(autoRotate);
    return () => {
      if (autoRotateTimerRef.current) {
        clearTimeout(autoRotateTimerRef.current);
      }
    };
  }, [autoRotate]);

  const handleControlsStart = () => {
    if (!autoRotate) return;
    setIsAutoRotating(false);
    if (autoRotateTimerRef.current) {
      clearTimeout(autoRotateTimerRef.current);
    }
  };

  const handleControlsEnd = () => {
    if (!autoRotate) return;
    if (autoRotateTimerRef.current) {
      clearTimeout(autoRotateTimerRef.current);
    }
    autoRotateTimerRef.current = setTimeout(() => {
      setIsAutoRotating(true);
    }, 5500);
  };

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.8, 3.2], fov: 60 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />
      <pointLight position={[0, -4, 4]} intensity={0.3} />

      <Environment preset="city" />

      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.3}
        scale={5}
        blur={2}
        far={2}
      />

      <Suspense fallback={<Loader />}>
        <TShirtModel
          color={color}
          decal={decal}
          autoRotate={isAutoRotating && autoRotate}
        />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={2.8}
        maxDistance={4.0}
        autoRotate={isAutoRotating && autoRotate}
        onStart={handleControlsStart}
        onEnd={handleControlsEnd}
        enableDamping={true}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}
