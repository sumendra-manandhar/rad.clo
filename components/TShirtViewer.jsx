"use client";

import React, { useRef, Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
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

// Loads a texture manually (instead of drei's Suspense-coupled useTexture)
// so a failed load is logged clearly instead of the design just silently
// never appearing. Returns null until the texture is ready.
function useDecalTexture(src) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!src) {
      setTexture(null);
      return;
    }
    let cancelled = false;
    setTexture(null);

    const loader = new THREE.TextureLoader();
    loader.load(
      src,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.error("[TShirtViewer] failed to load design image:", src, err);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [src]);

  return texture;
}

// ── Decal projected onto one shirt panel ──────────────────────────────────────
// Rather than guessing a single "main" mesh (which can miss the correct
// panel entirely), we try the decal against every real panel of the shirt.
// Panels the anchor point doesn't actually land near just come out as empty
// geometry (harmless, invisible) — whichever panel it does land on shows
// the design, wrapped correctly to that panel's curved surface.
function ShirtDecal({ mesh, anchor, decal }) {
  const texture = useDecalTexture(decal.src);

  // A stable ref-like object — recreating {current: mesh} on every render
  // was making Decal's internal effect (which depends on this reference)
  // tear down and rebuild every single render instead of only when the
  // mesh actually changes.
  const meshRef = useMemo(() => ({ current: mesh }), [mesh]);

  const scale = useMemo(() => {
    const baseSize = Math.max(anchor.printWidth * (decal.scale || 1), 0.05);
    return [baseSize, baseSize, anchor.depth];
  }, [anchor, decal]);

  // Texture not loaded yet (or failed) — render nothing rather than a
  // blank/white decal square.
  if (!texture) return null;

  return (
    <Decal
      mesh={meshRef}
      position={anchor.position}
      // Two modes, matching the two branches in the `anchor` calculation above:
      //
      // - If we have a Blender-authored anchor, `anchor.rotationOverride` is
      //   an ARRAY [x,y,z]. Passing an array to Decal uses that exact
      //   rotation as-is (no guessing) — this is the reliable path.
      //
      // - Otherwise we pass a NUMBER, which tells drei's Decal to
      //   auto-orient itself to the nearest surface normal (needed for the
      //   fallback heuristic, since we don't know the real surface angle at
      //   the guessed point). Math.PI is a base correction for this model's
      //   normals (otherwise the artwork renders upside down).
      rotation={
        anchor.rotationOverride || Math.PI + (decal.rotation || 0)
      }
      scale={scale}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        // Explicitly true: drei's Decal defaults this to FALSE, which means
        // the design always renders on top of everything regardless of
        // actual depth. This model has layered mesh construction (an outer
        // shell plus an inner lining very close behind it in places), so if
        // the decal's nearest-surface search ever catches a vertex on the
        // inner layer instead of the outer one, depthTest:false made it
        // render straight through the visible fabric — looking like a
        // disconnected floating sticker rather than sitting on the shirt.
        // With depthTest on, that case gets correctly hidden behind the
        // outer surface instead.
        depthTest
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

  // ── Alignment: this is the part that decides WHERE the design sits ──────────
  //
  // Two ways this can work, and it automatically picks whichever is available:
  //
  // 1) BEST — if your .blend/.glb has an object (Empty or small Plane) named
  //    exactly "DecalAnchor_Front" and/or "DecalAnchor_Back", we use ITS
  //    exact position + rotation from Blender directly. This is the reliable
  //    fix: you place the marker exactly on the chest in Blender, export,
  //    and the code just uses it — no guessing involved. See SETUP.md for
  //    the step-by-step Blender instructions.
  //
  // 2) FALLBACK — if no such object exists, we estimate a chest/upper-back
  //    point from the model's overall bounding box (the numbers below —
  //    0.12, 0.55, etc. — are the ones to hand-tune if you don't want to
  //    touch Blender).
  const anchor = useMemo(() => {
    if (!modelBox || modelBox.isEmpty() || !decal) return null;

    const anchorNode = cloned.getObjectByName(
      decal.side === "back" ? "DecalAnchor_Back" : "DecalAnchor_Front"
    );

    if (anchorNode) {
      const size = new THREE.Vector3();
      modelBox.getSize(size);

      // Compute the anchor's transform relative to `cloned` itself (not
      // the whole scene) — this matches the coordinate space the decal
      // geometry gets computed in, regardless of how many empty parent
      // nodes sit between the anchor and the model root in the glTF.
      const savedPos = cloned.position.clone();
      const savedQuat = cloned.quaternion.clone();
      const savedScale = cloned.scale.clone();
      cloned.position.set(0, 0, 0);
      cloned.quaternion.identity();
      cloned.scale.set(1, 1, 1);
      cloned.updateMatrixWorld(true);

      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      anchorNode.matrixWorld.decompose(worldPos, worldQuat, worldScale);
      const euler = new THREE.Euler().setFromQuaternion(worldQuat);

      cloned.position.copy(savedPos);
      cloned.quaternion.copy(savedQuat);
      cloned.scale.copy(savedScale);
      cloned.updateMatrixWorld(true);

      return {
        position: [
          worldPos.x + (decal.offsetX || 0) * size.x * 0.15,
          worldPos.y + (decal.offsetY || 0) * size.y * 0.15,
          worldPos.z,
        ],
        // Use the authored rotation directly instead of the auto-orient
        // number trick — Blender already told us the correct facing.
        rotationOverride: [euler.x, euler.y, euler.z + (decal.rotation || 0)],
        printWidth: Math.min(size.x, size.y) * 0.55,
        depth: Math.max(size.x, size.y, size.z, 0.3) * 0.8,
      };
    }

    // ── Fallback heuristic (no Blender anchor found) ──────────────────────
    const size = new THREE.Vector3();
    modelBox.getSize(size);
    const c = new THREE.Vector3();
    modelBox.getCenter(c);
    const isBack = decal.side === "back";
    const zPos = isBack
      ? modelBox.min.z + size.z * 0.12 // how far in from the BACK face — increase to sit deeper/safer inside the mesh
      : modelBox.max.z - size.z * 0.12; // how far in from the FRONT face
    return {
      position: [
        c.x + (decal.offsetX || 0) * size.x * 0.5,
        c.y + size.y * 0.12 + (decal.offsetY || 0) * size.y * 0.5, // 0.12 = chest height above the model's vertical center — raise/lower this
        zPos,
      ],
      printWidth: Math.min(size.x, size.y) * 0.55, // how wide the design starts out relative to the shirt's width
      depth: Math.max(size.x, size.y, size.z, 0.3) * 0.8,
    };
  }, [modelBox, decal, cloned]);

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
