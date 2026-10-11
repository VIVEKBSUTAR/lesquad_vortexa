'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ProductWithComputed } from '@/lib/types';

interface StockSense3DProps {
  products: ProductWithComputed[];
  mode: 'story' | 'dashboard';
  scrollProgress: number; // 0 to 1
  introCompleted: boolean;
  onIntroComplete?: () => void;
}

export const StockSense3D: React.FC<StockSense3DProps> = ({
  products,
  mode,
  scrollProgress,
  introCompleted,
  onIntroComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    ringGroup: THREE.Group | null;
    warehouseGroup: THREE.Group | null;
    pathCurve: THREE.CatmullRomCurve3 | null;
    dustParticles: THREE.Points | null;
    conveyorRollers: THREE.Mesh[] | null;
    introTl: gsap.core.Timeline | null;
    animFrameId: number | null;
    mouse: { x: number; y: number };
  }>({
    renderer: null,
    scene: null,
    camera: null,
    ringGroup: null,
    warehouseGroup: null,
    pathCurve: null,
    dustParticles: null,
    conveyorRollers: null,
    introTl: null,
    animFrameId: null,
    mouse: { x: 0, y: 0 },
  });

  const scrollProgressRef = useRef(scrollProgress);
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. RENDERER SETUP ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // --- 2. SCENE & CAMERA ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f1ed);
    scene.fog = new THREE.FogExp2(0xf3f1ed, 0.015);

    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    camera.position.set(0, 2.2, 11.5);

    // --- 3. PMREM ENVIRONMENT ---
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    const topLightPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    topLightPlane.position.set(0, 12, 0);
    topLightPlane.rotation.x = Math.PI / 2;

    const sideFillPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshBasicMaterial({ color: 0xc4c0b6 })
    );
    sideFillPlane.position.set(12, 0, 0);
    sideFillPlane.rotation.y = -Math.PI / 2;

    const accentPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshBasicMaterial({ color: 0x0f5c5c })
    );
    accentPlane.position.set(-12, 4, -10);
    accentPlane.rotation.y = Math.PI / 2;

    envScene.add(topLightPlane, sideFillPlane, accentPlane);
    scene.environment = pmrem.fromScene(envScene).texture;

    // --- 4. LIGHTS ---
    const hemiLight = new THREE.HemisphereLight(0xf3f1ed, 0x1c1b19, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffdfa, 1.2);
    keyLight.position.set(6, 12, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdad6ce, 0.5);
    rimLight.position.set(-6, 8, -8);
    scene.add(rimLight);

    // --- 5. MATERIALS ---
    const materials = {
      metal: new THREE.MeshStandardMaterial({ color: 0x9e9e9e, metalness: 0.85, roughness: 0.22 }),
      darkSteel: new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.75, roughness: 0.35 }),
      carbon: new THREE.MeshStandardMaterial({ color: 0x1f1f1f, metalness: 0.4, roughness: 0.6 }),
      accentTeal: new THREE.MeshStandardMaterial({ color: 0x0f5c5c, metalness: 0.2, roughness: 0.45 }),
      woodFlange: new THREE.MeshStandardMaterial({ color: 0x825a38, roughness: 0.85 }),
      wireCoil: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.1, transmission: 0.9, transparent: true, opacity: 0.5 }),
      emissiveFilament: new THREE.MeshStandardMaterial({ color: 0xffe29a, emissive: 0xffa033, emissiveIntensity: 3.5 }),
      kraftCover: new THREE.MeshStandardMaterial({ color: 0xbfa17a, roughness: 0.92 }),
      tinCan: new THREE.MeshStandardMaterial({ color: 0xd8d4cb, metalness: 0.6, roughness: 0.3 }),
      concreteFloor: new THREE.MeshStandardMaterial({ color: 0xe8e5df, roughness: 0.95 }),
      steelRack: new THREE.MeshStandardMaterial({ color: 0x7a7770, metalness: 0.6, roughness: 0.4 }),
      cautionYellow: new THREE.MeshStandardMaterial({ color: 0xb7791f, roughness: 0.6 }),
    };

    // Contact shadow texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sGrad.addColorStop(0, 'rgba(28, 27, 25, 0.35)');
    sGrad.addColorStop(0.5, 'rgba(28, 27, 25, 0.12)');
    sGrad.addColorStop(1, 'rgba(28, 27, 25, 0.0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });

    const createContactShadow = (size = 2.2) => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), shadowMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = 0.01;
      return plane;
    };

    // --- 6. PROCEDURAL PRODUCTS BUILDER ---
    const buildProductModel = (id: string, product: ProductWithComputed) => {
      const group = new THREE.Group();

      switch (id) {
        case 'ROB-01': {
          const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.25, 20), materials.darkSteel);
          const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.4, 20), materials.metal);
          turret.position.y = 0.3;
          const armLower = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.2, 0.24), materials.accentTeal);
          armLower.position.set(0, 0.95, 0);
          const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.35, 16), materials.metal);
          elbow.position.set(0, 1.6, 0);
          elbow.rotation.z = Math.PI / 2;
          const armUpper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.18), materials.darkSteel);
          armUpper.position.set(0.2, 2.0, 0);
          armUpper.rotation.z = -0.3;
          group.add(base, turret, armLower, elbow, armUpper);
          break;
        }
        case 'ROB-02': {
          const centerBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.7), materials.carbon);
          group.add(centerBody);
          [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([ox, oz]) => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 1.0), materials.carbon);
            arm.position.set(ox * 0.5, 0, oz * 0.5);
            arm.rotation.y = Math.atan2(oz, ox) - Math.PI / 2;
            const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 16), materials.metal);
            motor.position.set(ox, 0.1, oz);
            const propGuard = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.02, 8, 24), materials.glass);
            propGuard.rotation.x = Math.PI / 2;
            propGuard.position.set(ox, 0.22, oz);
            group.add(arm, motor, propGuard);
          });
          break;
        }
        case 'HW-01': {
          const stator = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.3), materials.darkSteel);
          const flangeFront = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.12), materials.metal);
          flangeFront.position.z = 0.7;
          const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 16), materials.metal);
          shaft.rotation.x = Math.PI / 2;
          shaft.position.z = 1.05;
          group.add(stator, flangeFront, shaft);
          break;
        }
        case 'HW-02': {
          const core = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16), materials.woodFlange);
          const f1 = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 24), materials.woodFlange);
          f1.position.y = 0.6;
          const f2 = f1.clone();
          f2.position.y = -0.6;
          const woundCable = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.1, 24), materials.wireCoil);
          group.add(core, f1, f2, woundCable);
          break;
        }
        case 'ELEC-01': {
          const pts: THREE.Vector2[] = [];
          for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            pts.push(new THREE.Vector2(0.15 + Math.sin(t * Math.PI) * 0.45, t * 1.3));
          }
          const reflector = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), materials.metal);
          reflector.position.y = 0.2;
          const bulbDome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), materials.glass);
          bulbDome.position.y = 0.75;
          const filament = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 12), materials.emissiveFilament);
          filament.position.y = 0.75;
          group.add(reflector, bulbDome, filament);
          break;
        }
        case 'ELEC-02': {
          const housing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.4), materials.accentTeal);
          housing.position.y = 0.4;
          const topHandle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.15), materials.darkSteel);
          topHandle.position.set(0, 0.85, 0);
          group.add(housing, topHandle);
          break;
        }
        case 'FOOD-01': {
          const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 32), materials.tinCan);
          drum.position.y = 0.7;
          const rimTop = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 8, 32), materials.metal);
          rimTop.rotation.x = Math.PI / 2;
          rimTop.position.y = 1.4;
          group.add(drum, rimTop);
          break;
        }
        case 'STAT-01': {
          const book = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.12), materials.kraftCover);
          book.position.y = 0.7;
          group.add(book);
          break;
        }
      }

      const bbox = new THREE.Box3().setFromObject(group);
      const sphere = bbox.getBoundingSphere(new THREE.Sphere());
      const scaleFactor = 0.9 / (sphere.radius || 1);
      group.scale.set(scaleFactor, scaleFactor, scaleFactor);

      const updatedBox = new THREE.Box3().setFromObject(group);
      group.position.y = -updatedBox.min.y;

      const shadow = createContactShadow(1.8);
      group.add(shadow);

      group.userData = {
        productId: product.id,
        bobPhase: Math.random() * Math.PI * 2,
      };

      return group;
    };

    // --- 7. ORBITAL RING GROUP (Sequence 1) ---
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);
    const ringRadius = 4.3;

    products.slice(0, 8).forEach((prod, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const model = buildProductModel(prod.id, prod);
      model.position.set(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
      model.userData.baseAngle = angle;
      ringGroup.add(model);
    });

    ringGroup.rotation.x = (15 * Math.PI) / 180;

    // --- 8. WAREHOUSE ENVIRONMENT (Flanking the aisles cleanly) ---
    const warehouseGroup = new THREE.Group();
    scene.add(warehouseGroup);

    // Floor with wide runway
    const floorGeo = new THREE.PlaneGeometry(120, 260);
    const floorMesh = new THREE.Mesh(floorGeo, materials.concreteFloor);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, -80);
    warehouseGroup.add(floorMesh);

    // Flanking yellow caution runway lines (wide apart at x = +/- 8m)
    const stripeGeo = new THREE.PlaneGeometry(0.3, 240);
    const stripeL = new THREE.Mesh(stripeGeo, materials.cautionYellow);
    stripeL.rotation.x = -Math.PI / 2;
    stripeL.position.set(-8.5, 0.02, -80);
    const stripeR = stripeL.clone();
    stripeR.position.set(8.5, 0.02, -80);
    warehouseGroup.add(stripeL, stripeR);

    // Chapter 1 Shelf: Placed at x = -13m (Far to the left, flanking the aisle, never overlapping center cards!)
    const rackGroup1 = new THREE.Group();
    [-2.5, 2.5].forEach((rx) => {
      [0, 1.2].forEach((rz) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6.5, 0.12), materials.steelRack);
        post.position.set(rx, 3.25, rz);
        rackGroup1.add(post);
      });
    });
    [1.5, 3.2, 5.0].forEach((sy) => {
      const beamFront = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 0.08), materials.cautionYellow);
      beamFront.position.set(0, sy, 0.6);
      const shelfDeck = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.04, 1.2), materials.metal);
      shelfDeck.position.set(0, sy + 0.05, 0);
      rackGroup1.add(beamFront, shelfDeck);
    });
    const loneBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), materials.kraftCover);
    loneBox.position.set(-1.4, 1.95, 0);
    rackGroup1.add(loneBox);
    rackGroup1.position.set(-13, 0, -32);
    warehouseGroup.add(rackGroup1);

    // Chapter 2 Blueprint Wall: Placed at x = 14m (Far to the right wall)
    const bpWallGeo = new THREE.BoxGeometry(10, 6.5, 0.3);
    const bpWallMat = new THREE.MeshStandardMaterial({ color: 0x0a3d3d, roughness: 0.6, metalness: 0.3 });
    const bpWall = new THREE.Mesh(bpWallGeo, bpWallMat);
    bpWall.position.set(14, 3.25, -54);
    bpWall.rotation.y = -Math.PI / 6;
    const bpGridGeo = new THREE.PlaneGeometry(9, 5.5, 9, 6);
    const bpGridMat = new THREE.MeshBasicMaterial({ color: 0x3f6c8f, wireframe: true, transparent: true, opacity: 0.25 });
    const bpGrid = new THREE.Mesh(bpGridGeo, bpGridMat);
    bpGrid.position.set(0, 0, 0.16);
    bpWall.add(bpGrid);
    warehouseGroup.add(bpWall);

    // Chapter 3 Conveyor: Placed at x = -13m (Flanking the left side)
    const conveyorGroup = new THREE.Group();
    const bedMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 14), materials.darkSteel);
    bedMesh.position.set(0, 0.8, 0);
    conveyorGroup.add(bedMesh);
    const rollers: THREE.Mesh[] = [];
    for (let rz = -6.5; rz <= 6.5; rz += 0.8) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 16), materials.metal);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(0, 1.25, rz);
      conveyorGroup.add(roller);
      rollers.push(roller);
    }
    conveyorGroup.position.set(-13, 0, -76);
    warehouseGroup.add(conveyorGroup);

    // Dust particles
    const dustCount = 200;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 30;
      dustPositions[i + 1] = Math.random() * 8 + 0.5;
      dustPositions[i + 2] = -15 - Math.random() * 110;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xdad6ce, size: 0.05, transparent: true, opacity: 0.5 })
    );
    warehouseGroup.add(dustPoints);

    // Central Straight Corridor Camera Path
    const cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.2, 11.5),
      new THREE.Vector3(0, 2.2, -14),
      new THREE.Vector3(0, 2.4, -32),
      new THREE.Vector3(0, 2.4, -54),
      new THREE.Vector3(0, 2.4, -76),
      new THREE.Vector3(0, 2.4, -98),
      new THREE.Vector3(0, 2.4, -120),
    ]);

    stateRef.current = {
      renderer,
      scene,
      camera,
      ringGroup,
      warehouseGroup,
      pathCurve: cameraPath,
      dustParticles: dustPoints,
      conveyorRollers: rollers,
      introTl: null,
      animFrameId: null,
      mouse: { x: 0, y: 0 },
    };

    // --- 9. MOUSE & RESIZE HANDLERS ---
    const onMouseMove = (e: MouseEvent) => {
      stateRef.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      stateRef.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // --- 10. INTRO TIMELINE ---
    if (!introCompleted) {
      const tl = gsap.timeline({
        onComplete: () => {
          onIntroComplete?.();
        },
      });

      tl.fromTo(ringGroup.rotation, { y: 0 }, { y: Math.PI * 2.8, duration: 4.8, ease: 'power2.inOut' }, 0);
      tl.to(camera.position, { x: 0, y: 2.2, z: -14, duration: 3.2, ease: 'power3.inOut' }, 3.8);

      stateRef.current.introTl = tl;
    } else {
      camera.position.set(0, 2.2, -14);
    }

    // --- 11. RENDER LOOP ---
    const clock = new THREE.Clock();
    const animate = () => {
      const id = requestAnimationFrame(animate);
      stateRef.current.animFrameId = id;

      const time = clock.getElapsedTime();

      if (ringGroup) {
        ringGroup.children.forEach((child) => {
          const uData = child.userData;
          child.position.y = Math.sin(time * 2 + (uData.bobPhase || 0)) * 0.08;
          child.rotation.y += 0.008;
        });
      }

      if (rollers) {
        rollers.forEach((roller) => {
          roller.rotation.x += 0.04;
        });
      }

      if (dustPoints) {
        dustPoints.rotation.y += 0.0004;
      }

      if (introCompleted && cameraPath && modeRef.current === 'story') {
        const p = Math.max(0, Math.min(1, scrollProgressRef.current));
        const curveP = 0.16 + p * 0.84;
        const camTarget = cameraPath.getPoint(Math.min(0.999, curveP));
        const lookTarget = cameraPath.getPoint(Math.min(1, curveP + 0.04));

        const parallaxX = stateRef.current.mouse.x * 0.35;
        const parallaxY = stateRef.current.mouse.y * 0.25;

        camera.position.lerp(
          new THREE.Vector3(camTarget.x + parallaxX, camTarget.y + parallaxY, camTarget.z),
          0.08
        );
        camera.lookAt(lookTarget);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (stateRef.current.animFrameId) {
        cancelAnimationFrame(stateRef.current.animFrameId);
      }
      if (stateRef.current.introTl) {
        stateRef.current.introTl.kill();
      }
      pmrem.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [introCompleted]);

  return (
    <div
      ref={containerRef}
      className={`canvas-backdrop ${mode === 'dashboard' ? 'blurred' : ''}`}
      style={{
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};
