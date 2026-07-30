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

// Small safety net: if projecting a decal onto a particular shirt panel
// fails for any reason, swallow it and just skip that panel instead of
// breaking the rest of the viewer.
class DecalBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn("[TShirtViewer] skipped a decal panel:", err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ── Decal projected onto one shirt panel ──────────────────────────────────────
// Rather than guessing a single "main" mesh (which can miss the correct
// panel entirely), we try the decal against every real panel of the shirt.
// Panels the anchor point doesn't actually land near just come out as empty
// geometry (harmless, invisible) — whichever panel it does land on shows
// the design, wrapped correctly to that panel's curved surface.
function ShirtDecal({ mesh, anchor, decal }) {
  const texture = useTexture(decal.src);

  useEffect(() => {
    if (!texture) return;
    if ("colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  const scale = useMemo(() => {
    const baseSize = Math.max(anchor.printWidth * (decal.scale || 1), 0.05);
    return [baseSize, baseSize, anchor.depth];
  }, [anchor, decal]);

  return (
    <Decal
      mesh={{ current: mesh }}
      position={anchor.position}
      // IMPORTANT: this must be a NUMBER, not an array like [0, isBack ? Math.PI : 0, ...].
      // A number tells drei's Decal to auto-orient itself to the nearest
      // surface normal, which is what makes it wrap a curved surface
      // correctly instead of stamping on at a fixed flat angle. An array
      // skips that auto-orientation step entirely — that was the main
      // cause of the design not sitting properly on the shirt.
      // Math.PI is added as a base correction for this model's surface
      // normals (otherwise the artwork renders upside down); the design's
      // own rotation slider is layered on top of that.
      rotation={Math.PI + (decal.rotation || 0)}
      scale={scale}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-4}
        roughness={0.85}
        toneMapped={false}
      />
    </Decal>
  );
}

// ── The actual GLB model ──────────────────────────────────────────────────────
function TShirtModel({ color, decal, autoRotate = true }) {
  const group = useRef();
  const { scene } = useGLTF("/tshirt.glb");

  // Clone so color changes don't mutate the cached asset
  const cloned = React.useMemo(() => scene.clone(true), [scene]);
  const [meshList, setMeshList] = useState([]);
  const [modelBox, setModelBox] = useState(null);

  // Apply color to every mesh in the model (unchanged) — and, separately,
  // collect the mesh list + overall bounding box used for decal placement.
  useEffect(() => {
    const hexColor = new THREE.Color(color);
    const list = [];
    const box = new THREE.Box3();

    cloned.traverse((obj) => {
      if (obj.isMesh) {
        if (!obj.userData.materialCloned) {
          obj.material = obj.material.clone();
          obj.userData.materialCloned = true;
        }
        obj.material.color.set(hexColor);
        obj.material.needsUpdate = true;
        obj.castShadow = true;
        obj.receiveShadow = true;

        if (obj.geometry) {
          if (!obj.geometry.attributes.normal) obj.geometry.computeVertexNormals();
          obj.geometry.computeBoundingBox();
          box.union(obj.geometry.boundingBox);
          list.push(obj);
        }
      }
    });

    setMeshList(list);
    setModelBox(box);
  }, [color, cloned]);

  // Gentle auto-rotation (paused when user is dragging via OrbitControls)
  useFrame((_, delta) => {
    if (group.current && autoRotate) {
      group.current.rotation.y += delta * 0.2; // Adjust rotation speed here
    }
  });

  // Center & scale the model to fit nicely — compute once per loaded model
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

  // A single canonical chest/back anchor point (in model-local space) that
  // every panel attempt aims at — keeps placement consistent no matter
  // which panel ends up actually catching it.
  const anchor = useMemo(() => {
    if (!modelBox || modelBox.isEmpty() || !decal) return null;
    const size = new THREE.Vector3();
    modelBox.getSize(size);
    const c = new THREE.Vector3();
    modelBox.getCenter(c);
    const isBack = decal.side === "back";
    const zPos = isBack
      ? modelBox.min.z + size.z * 0.12
      : modelBox.max.z - size.z * 0.12;
    return {
      position: [
        c.x + (decal.offsetX || 0) * size.x * 0.5,
        c.y + size.y * 0.12 + (decal.offsetY || 0) * size.y * 0.5,
        zPos,
      ],
      printWidth: Math.min(size.x, size.y) * 0.55,
      // Generous depth so the projection box always fully pierces the
      // fabric, regardless of small inaccuracies in the anchor point above.
      depth: Math.max(size.x, size.y, size.z, 0.3) * 0.8,
    };
  }, [modelBox, decal]);

  return (
    <group ref={group}>
      <primitive
        object={cloned}
        scale={scale}
        // position computed from the model center so the model stays fixed
        position={[-center.x * scale, -center.y * scale, -center.z * scale]}
      >
        {decal &&
          anchor &&
          meshList.map((m, i) => (
            <DecalBoundary key={m.uuid || i}>
              <Suspense fallback={null}>
                <ShirtDecal mesh={m} anchor={anchor} decal={decal} />
              </Suspense>
            </DecalBoundary>
          ))}
      </primitive>
    </group>
  );
}

// Preload so there's no flicker
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
// decal: { src, scale, offsetX, offsetY, rotation, side } | null
export default function TShirtViewer({
  color,
  decal = null,
  autoRotate = true,
}) {
  // Keep a stable ref to OrbitControls so we can set a fixed target once.
  // This prevents the camera from re-centering when the model or materials
  // are updated (for example, when changing shirt colors).
  const controlsRef = useRef();
  const autoRotateTimerRef = useRef(null);
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);

  useEffect(() => {
    if (controlsRef.current) {
      // Tune this target if the shirt sits too high/low in the frame.
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
      // Adjusted camera to better frame the shirt by default. If you want
      // a tighter/looser framing, tweak the Z and Y values here.
      camera={{ position: [0, 0.8, 3.2], fov: 60 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Lighting */}
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

      {/* Environment for realistic reflections */}
      <Environment preset="city" />

      {/* Contact shadow on the ground */}
      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.3}
        scale={5}
        blur={2}
        far={2}
      />

      {/* The shirt */}
      <Suspense fallback={<Loader />}>
        <TShirtModel
          color={color}
          decal={decal}
          autoRotate={isAutoRotating && autoRotate}
        />
      </Suspense>

      {/* OrbitControls – drag pauses auto-rotation and it resumes after 10 seconds */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={2.2}
        maxDistance={4.0}
        autoRotate={isAutoRotating && autoRotate}
        onStart={handleControlsStart}
        onEnd={handleControlsEnd}
        enableDamping={true}
        // This locks the vertical rotation angle
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}
