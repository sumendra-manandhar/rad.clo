"use client";

import React, { useRef, Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree, createPortal } from "@react-three/fiber";
import {
  useGLTF,
  Decal,
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { getLocation } from "@/lib/print-locations";

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

// Artwork with a solid white background (e.g. the gallery JPGs) would show as
// a white square on coloured shirts. For images with no transparency, make
// the white that touches the image border transparent with a flood fill —
// white *inside* the artwork (eyes, letter holes) is left alone.
function knockOutBackground(img) {
  const max = 1024;
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * s));
  const h = Math.max(1, Math.round(img.height * s));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  for (let i = 3; i < px.length; i += 4) if (px[i] < 250) return canvas; // already has transparency

  const isBg = (i) => px[i] > 235 && px[i + 1] > 235 && px[i + 2] > 235;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!isBg(p * 4)) continue;
    px[p * 4 + 3] = 0;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
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

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      let source = img;
      try {
        source = knockOutBackground(img);
      } catch (err) {
        // Cross-origin image without CORS headers: use it as-is.
        console.warn("[TShirtViewer] couldn't process design background:", err);
      }
      const tex = new THREE.CanvasTexture(source);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      setTexture(tex);
    };
    img.onerror = (err) => console.error("[TShirtViewer] failed to load design image:", src, err);
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return texture;
}

// ── One print, projected onto every shirt panel it overlaps ───────────────────
// Each Decal is rendered *inside* its panel mesh (via createPortal) because
// drei's Decal builds geometry in the mesh's own local space. This model's
// panels are stored Z-up and stood upright by a -90° parent rotation, so a
// decal attached anywhere else misses that rotation and lies flat under the
// shirt.
function PrintDecal({ src, placement, onLoaded }) {
  const texture = useDecalTexture(src);
  useEffect(() => {
    if (texture) onLoaded(src);
  }, [texture, src, onLoaded]);

  // Artwork width comes from the placement; height follows its aspect ratio.
  const fit = useMemo(() => {
    const img = texture?.image;
    const aspect = img?.width && img?.height ? img.width / img.height : 1;
    return [placement.width, placement.width / aspect];
  }, [texture, placement]);

  if (!texture) return null;

  return placement.panels.map(({ mesh, position, rotation, unit }) => (
    <React.Fragment key={mesh.uuid}>
      {createPortal(
        <DecalBoundary>
          <PanelDecal
            mesh={mesh}
            position={position}
            rotation={rotation}
            scale={[fit[0] * unit, fit[1] * unit, placement.depth * unit]}
            texture={texture}
          />
        </DecalBoundary>,
        mesh
      )}
    </React.Fragment>
  ));
}

function PanelDecal({ mesh, position, rotation, scale, texture }) {
  const meshRef = useMemo(() => ({ current: mesh }), [mesh]);
  return (
    <Decal mesh={meshRef} position={position} rotation={rotation} scale={scale}>
      <meshStandardMaterial
        map={texture}
        transparent
        // drei defaults depthTest to false, which draws the print through the
        // fabric from every angle. Keep it on so the shirt hides it correctly.
        depthTest
        polygonOffset
        polygonOffsetFactor={-4}
        roughness={0.85}
        toneMapped={false}
      />
    </Decal>
  );
}

// Dyed cotton never looks pitch black: the fibres scatter light, so folds
// and knit stay visible. Lift very dark colours slightly (in linear space,
// darkest colours the most) and add a soft fabric sheen. Only the 3D preview
// changes; orders keep the exact colour picked.
const WHITE = new THREE.Color(1, 1, 1);
function fabricColor(hex) {
  const c = new THREE.Color(hex);
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  const lift = 0.035 * (1 - Math.min(1, lum / 0.2));
  c.r = lift + c.r * (1 - lift);
  c.g = lift + c.g * (1 - lift);
  c.b = lift + c.b * (1 - lift);
  return c;
}
function sheenFor(hex) {
  return new THREE.Color(hex).lerp(WHITE, 0.55).multiplyScalar(0.3);
}

const UP = new THREE.Vector3(0, 1, 0);
const OUTWARD = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  left: new THREE.Vector3(1, 0, 0), // wearer's left = +X when the front faces +Z
  right: new THREE.Vector3(-1, 0, 0),
};

// ── The actual GLB model ──────────────────────────────────────────────────────
const SPIN_SECONDS = 1.1;
const TURN = Math.PI * 2;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function TShirtModel({ color, prints, autoRotate = true, onReady, spin = 0, onSpinHalfway }) {
  const group = useRef();

  // One full turn each time `spin` changes. onSpinHalfway fires when the back
  // faces the camera, so the caller can swap the print out of sight.
  const spinAnim = useRef(null);
  const lastSpin = useRef(spin);
  const halfway = useRef(onSpinHalfway);
  useEffect(() => {
    halfway.current = onSpinHalfway;
  });
  useEffect(() => {
    if (spin === lastSpin.current) return;
    lastSpin.current = spin;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      halfway.current?.();
      return;
    }
    const from = group.current?.rotation.y ?? 0;
    // Always finish facing front, even if a new spin starts mid-turn.
    const to = Math.ceil((from + Math.PI) / TURN) * TURN;
    spinAnim.current = { t: 0, from, to, swapped: false };
  }, [spin]);
  // Artwork images that have finished loading (see the ready check below)
  const [loadedSrcs, setLoadedSrcs] = useState(() => new Set());
  const markLoaded = useCallback(
    (src) => setLoadedSrcs((prev) => (prev.has(src) ? prev : new Set(prev).add(src))),
    []
  );
  const { scene } = useGLTF("/tshirt.glb");

  // Clone so color changes don't mutate the cached asset
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Collect the shirt panels once, before any decal meshes are attached to
  // them, with each panel's transform and bounds relative to the model root.
  const { panels, rootBox } = useMemo(() => {
    cloned.updateWorldMatrix(true, true);
    const rootInv = cloned.matrixWorld.clone().invert();
    const panels = [];
    const rootBox = new THREE.Box3();
    cloned.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return;
      obj.material = obj.material.clone();
      // Soft cotton sheen (the model's material is MeshPhysicalMaterial)
      if ("sheen" in obj.material) {
        obj.material.sheen = 1;
        obj.material.sheenRoughness = 0.85;
      }
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (!obj.geometry.attributes.normal) obj.geometry.computeVertexNormals();
      obj.geometry.computeBoundingBox();
      const toRoot = rootInv.clone().multiply(obj.matrixWorld);
      const box = obj.geometry.boundingBox.clone().applyMatrix4(toRoot);
      rootBox.union(box);
      panels.push({ mesh: obj, box, fromRoot: toRoot.clone().invert() });
    });
    return { panels, rootBox };
  }, [cloned]);

  useEffect(() => {
    const base = fabricColor(color);
    const sheen = sheenFor(color);
    panels.forEach(({ mesh }) => {
      mesh.material.color.copy(base);
      if (mesh.material.sheenColor) mesh.material.sheenColor.copy(sheen);
      mesh.material.needsUpdate = true;
    });
  }, [color, panels]);

  // Gentle auto-rotation (paused when user is dragging via OrbitControls)
  useFrame((_, delta) => {
    if (!group.current) return;
    const a = spinAnim.current;
    if (a) {
      a.t = Math.min(1, a.t + delta / SPIN_SECONDS);
      const angle = a.from + (a.to - a.from) * easeInOutCubic(a.t);
      group.current.rotation.y = angle;
      if (!a.swapped && angle >= a.to - Math.PI) {
        a.swapped = true;
        halfway.current?.();
      }
      if (a.t >= 1) {
        group.current.rotation.y = a.to % TURN;
        spinAnim.current = null;
      }
      return;
    }
    if (autoRotate) group.current.rotation.y += delta * 0.2; // Adjust rotation speed here
  });

  // Center & scale the model to fit nicely — compute once per loaded model
  const { scale, center } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 2.6 / maxDim;
    const c = new THREE.Vector3();
    box.getCenter(c);
    return { scale: s, center: c };
  }, [cloned]);

  // Resolve each print (area in inches from lib/print-locations + the
  // customer's placement inside it) to a point on the fabric, then into
  // every overlapping panel's local space.
  const placements = useMemo(() => {
    if (!prints?.length || rootBox.isEmpty()) return [];
    const size = rootBox.getSize(new THREE.Vector3());
    const mid = rootBox.getCenter(new THREE.Vector3());
    const inch = size.y / 31; // the model is roughly a 31″-long garment

    cloned.updateWorldMatrix(true, true);
    const rootToWorld = cloned.matrixWorld.clone();
    const worldToRoot = rootToWorld.clone().invert();
    const raycaster = new THREE.Raycaster();
    const meshes = panels.map((p) => p.mesh);

    return prints
      .map((print) => {
        const loc = getLocation(print.location);
        if (!loc || !print.src) return null;
        const pl = print.placement ?? { x: 0.5, y: 0.3, w: 0.5, rotation: 0 };
        const normal = OUTWARD[loc.view];
        const sleeve = loc.view === "left" || loc.view === "right";
        // Viewer's right when looking at this side of the shirt.
        const right = UP.clone().cross(normal).normalize();

        // Artwork centre, in inches from the centre line (the area's own
        // offset, e.g. left chest, plus its spot inside the area) and from the
        // top of the shoulders.
        const dx = ((loc.cx ?? 0) + (pl.x - 0.5) * loc.inches.w) * inch;
        const down = (loc.top + pl.y * loc.inches.h) * inch;
        const aim = new THREE.Vector3(mid.x, rootBox.max.y - down, mid.z).addScaledVector(right, dx);

        // Fire a ray at the shirt from outside to find the fabric surface.
        const far = Math.max(size.x, size.z) * 4;
        raycaster.set(
          aim.clone().addScaledVector(normal, far).applyMatrix4(rootToWorld),
          normal.clone().negate().transformDirection(rootToWorld)
        );
        const hit = raycaster.intersectObjects(meshes, false)[0];
        const point = hit
          ? hit.point.clone().applyMatrix4(worldToRoot)
          : aim.clone().addScaledVector(normal, (sleeve ? size.x : size.z) / 2);

        const width = pl.w * loc.inches.w * inch;
        // Shallow projection: deep enough to wrap the curve of the fabric,
        // too shallow to reach the opposite side of the shirt.
        const depth = sleeve ? size.x * 0.12 : size.z * 0.35;

        const reach = Math.max(width * 1.5, depth);
        const decalBox = new THREE.Box3().setFromCenterAndSize(point, new THREE.Vector3(reach, reach, reach));

        const panelPlacements = panels
          .filter((p) => p.box.intersectsBox(decalBox))
          .map(({ mesh, fromRoot }) => {
            const rot = new THREE.Matrix4().extractRotation(fromRoot);
            const z = normal.clone().applyMatrix4(rot).normalize();
            const yAxis = UP.clone().applyMatrix4(rot).normalize();
            const xAxis = yAxis.clone().cross(z).normalize();
            yAxis.copy(z).cross(xAxis);
            // The studio's rotation is clockwise as seen by the customer.
            const basis = new THREE.Matrix4()
              .makeBasis(xAxis, yAxis, z)
              .multiply(new THREE.Matrix4().makeRotationZ(-(pl.rotation || 0)));
            const e = new THREE.Euler().setFromRotationMatrix(basis);
            const s = new THREE.Vector3();
            fromRoot.decompose(new THREE.Vector3(), new THREE.Quaternion(), s);
            return {
              mesh,
              position: point.clone().applyMatrix4(fromRoot).toArray(),
              rotation: [e.x, e.y, e.z],
              unit: s.x,
            };
          });

        return { key: print.id ?? print.location, src: print.src, placement: { width, depth, panels: panelPlacements } };
      })
      .filter(Boolean);
  }, [prints, panels, rootBox, cloned]);

  // Ready once the shirt and every print's artwork are loaded.
  const allLoaded = placements.every((p) => loadedSrcs.has(p.src));

  return (
    <group ref={group}>
      {allLoaded && <ReadySignal onReady={onReady} />}
      <primitive
        object={cloned}
        scale={scale}
        // position computed from the model center so the model stays fixed
        position={[-center.x * scale, -center.y * scale, -center.z * scale]}
      />
      {placements.map((p) => (
        <PrintDecal key={`${p.key}:${p.src.slice(-40)}`} src={p.src} placement={p.placement} onLoaded={markLoaded} />
      ))}
    </group>
  );
}

// ── Turns the camera to face a print location ────────────────────────────────
const VIEW_ANGLE = { front: 0, back: Math.PI, left: Math.PI / 2, right: -Math.PI / 2 };

function ViewFocus({ view, nonce }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const target = useRef(null);

  useEffect(() => {
    target.current = view ? VIEW_ANGLE[view] : null;
  }, [view, nonce]);

  // Let the visitor take over as soon as they start dragging.
  useEffect(() => {
    if (!controls) return;
    const cancel = () => (target.current = null);
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
  }, [controls]);

  useFrame((_, dt) => {
    if (target.current == null || !controls) return;
    const offset = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    const diff = Math.atan2(Math.sin(target.current - sph.theta), Math.cos(target.current - sph.theta));
    if (Math.abs(diff) < 0.003) {
      target.current = null;
      return;
    }
    sph.theta += diff * Math.min(1, dt * 6);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
    controls.update();
  });

  return null;
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

// Calls onReady once, after the first frame with the shirt and all its
// prints on screen. Mounted by TShirtModel only when everything is loaded.
function ReadySignal({ onReady }) {
  const sent = useRef(false);
  useFrame(() => {
    if (sent.current || !onReady) return;
    sent.current = true;
    onReady?.();
  });
  return null;
}

// ── Main exported component ───────────────────────────────────────────────────
// prints: [{ id?, location, src, placement }] — see lib/print-locations
// view:   "front" | "back" | "left" | "right" — turns the camera to face it
//         (bump viewNonce to re-focus the same view after the user dragged)
export default function TShirtViewer({
  color,
  prints = [],
  view = null,
  viewNonce = 0,
  autoRotate = true,
  onReady,
  spin,
  onSpinHalfway,
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
      // preserveDrawingBuffer lets the customizer snapshot the canvas
      // (canvas.toDataURL) as an order preview for the admin.
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
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

      {/* Soft studio lighting, built in the browser. drei's presets download
          an HDR file from GitHub; if that's slow or blocked the whole canvas
          stays hidden, so nothing here is fetched. */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2} position={[0, 4, 3]} scale={[8, 3, 1]} />
        <Lightformer intensity={1.2} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer intensity={1.2} position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer intensity={0.8} position={[0, 1, -5]} rotation-y={Math.PI} scale={[8, 4, 1]} />
        <Lightformer intensity={0.4} position={[0, -4, 0]} rotation-x={-Math.PI / 2} scale={[8, 8, 1]} />
      </Environment>

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
          prints={prints}
          autoRotate={isAutoRotating && autoRotate}
          onReady={onReady}
          spin={spin}
          onSpinHalfway={onSpinHalfway}
        />
      </Suspense>

      <ViewFocus view={view} nonce={viewNonce} />

      {/* OrbitControls – drag pauses auto-rotation and it resumes after 10 seconds */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
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
