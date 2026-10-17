import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ArchitectureModelData, RoomLayout } from '../types/architect.ts';
import { calculateSunPosition } from '../utils/architectureRules.ts';

interface ThreeBuildingCanvasProps {
  data: ArchitectureModelData;
  timeOfDay: number; // 0 to 24
  compassHeading: number;
  viewMode: '3d' | 'blueprint';
  isXRayMode: boolean; // X-Ray Mode: Outer walls translucent, interior architecture revealed
  isolatedFloor: number | null; // null means show all floors
  onExportRef?: (exportFn: () => THREE.Object3D | null) => void;
  selectedRoom: string | null;
  onSelectRoom: (roomName: string | null) => void;
}

export const ThreeBuildingCanvas: React.FC<ThreeBuildingCanvasProps> = ({
  data,
  timeOfDay,
  compassHeading,
  viewMode,
  isXRayMode,
  isolatedFloor,
  onExportRef,
  selectedRoom,
  onSelectRoom,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingRootRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // References for floor groups
  const floorGroupsRef = useRef<Map<number, THREE.Group>>(new Map());

  // Check headless environment
  const isHeadless = typeof navigator !== 'undefined' && 
    (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

  // Initialize Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(viewMode === 'blueprint' ? 0x05162a : 0x070b14);
    scene.fog = new THREE.FogExp2(viewMode === 'blueprint' ? 0x05162a : 0x070b14, 0.008);

    // 2. Cameras
    const aspect = width / height;
    const persCamera = new THREE.PerspectiveCamera(40, aspect, 0.5, 500);
    persCamera.position.set(38, 28, 42);
    cameraRef.current = persCamera;

    const orthoFrustum = 32;
    const orthoCamera = new THREE.OrthographicCamera(
      -orthoFrustum * aspect,
      orthoFrustum * aspect,
      orthoFrustum,
      -orthoFrustum,
      1,
      500
    );
    orthoCamera.position.set(0, 60, 0.001);
    orthoCamera.lookAt(0, 0, 0);
    orthoCameraRef.current = orthoCamera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    if (!isHeadless) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(persCamera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 6;
    controls.maxDistance = 140;
    controls.target.set(0, (data.specs.floorsCount * data.specs.ceilingHeight) / 3, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.6);
    hemiLightRef.current = hemiLight;
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(30, 45, 25);
    sunLight.castShadow = !isHeadless;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 160;
    const shadowD = 35;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    sunLightRef.current = sunLight;
    scene.add(sunLight);

    // Fill rim light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);

    // 6. Build Architecture
    const buildingRoot = new THREE.Group();
    buildingRootRef.current = buildingRoot;
    scene.add(buildingRoot);

    constructProceduralBuilding(buildingRoot, data, floorGroupsRef.current, viewMode, isXRayMode);

    if (onExportRef) {
      onExportRef(() => buildingRootRef.current);
    }

    // 7. Animation Loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();

      const activeCamera = viewMode === 'blueprint' ? orthoCameraRef.current! : cameraRef.current!;
      renderer.render(scene, activeCamera);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !cameraRef.current || !orthoCameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      const newAspect = newW / newH;

      persCamera.aspect = newAspect;
      persCamera.updateProjectionMatrix();

      orthoCamera.left = -orthoFrustum * newAspect;
      orthoCamera.right = orthoFrustum * newAspect;
      orthoCamera.top = orthoFrustum;
      orthoCamera.bottom = -orthoFrustum;
      orthoCamera.updateProjectionMatrix();

      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    data.specs.buildingType, 
    data.specs.floorsCount, 
    data.specs.hasBasement, 
    data.specs.hasElevator,
    data.specs.vaastuCompliant,
    data.specs.plotShape,
    data.specs.customRequirements,
    viewMode, 
    isXRayMode
  ]);

  // Update Daylight Simulation
  useEffect(() => {
    if (!sunLightRef.current || !hemiLightRef.current || !sceneRef.current) return;

    const sunData = calculateSunPosition(timeOfDay, compassHeading);

    sunLightRef.current.position.set(sunData.x, sunData.y, sunData.z);
    sunLightRef.current.intensity = sunData.intensity;
    sunLightRef.current.color.set(sunData.sunColor);

    hemiLightRef.current.color.set(sunData.skyColor);
    hemiLightRef.current.groundColor.set(sunData.groundColor);
    hemiLightRef.current.intensity = sunData.ambientIntensity;

    if (viewMode === '3d') {
      sceneRef.current.background = new THREE.Color(sunData.skyColor);
      if (sceneRef.current.fog) {
        sceneRef.current.fog.color.set(sunData.skyColor);
      }
    }
  }, [timeOfDay, compassHeading, viewMode]);

  // Update Floor Isolation Filter & Positioning
  useEffect(() => {
    const siteGround = buildingRootRef.current?.getObjectByName('SiteGround');

    floorGroupsRef.current.forEach((group, floorIndex) => {
      if (isolatedFloor === null) {
        group.visible = true;
        const origFloor = data.floors.find(f => f.floorIndex === floorIndex);
        if (origFloor) {
          group.position.y = 0;
        }
      } else if (floorIndex === isolatedFloor) {
        group.visible = true;
        const origFloor = data.floors.find(f => f.floorIndex === floorIndex);
        if (origFloor) {
          group.position.y = -origFloor.levelY;
        }
      } else {
        group.visible = false;
      }
    });

    if (siteGround) {
      siteGround.visible = isolatedFloor === null;
    }

    if (controlsRef.current) {
      if (isolatedFloor !== null) {
        controlsRef.current.target.set(0, data.specs.ceilingHeight / 2, 0);
      } else {
        controlsRef.current.target.set(0, (data.specs.floorsCount * data.specs.ceilingHeight) / 3, 0);
      }
    }
  }, [isolatedFloor, data.floors, data.specs.floorsCount, data.specs.ceilingHeight]);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

// Procedural 3D Architecture Construction with X-Ray Mode and Full 2D/3D Parity
function constructProceduralBuilding(
  root: THREE.Group,
  data: ArchitectureModelData,
  floorGroupsMap: Map<number, THREE.Group>,
  viewMode: '3d' | 'blueprint',
  isXRayMode: boolean
) {
  floorGroupsMap.clear();

  const width = data.footprintWidthM;
  const depth = data.footprintDepthM;
  const specs = data.specs;
  const isBlueprint = viewMode === 'blueprint';
  const isLShaped = specs.plotShape === 'l_shaped';
  const isCorner = specs.plotShape === 'corner';

  // Materials
  const concreteMat = new THREE.MeshStandardMaterial({
    color: isBlueprint ? 0x1e3a5f : 0xe2e8f0,
    roughness: 0.7,
    metalness: 0.1,
    wireframe: isBlueprint,
  });

  const basementWallMat = new THREE.MeshStandardMaterial({
    color: isBlueprint ? 0x162c47 : 0x475569,
    roughness: 0.9,
    metalness: 0.2,
    wireframe: isBlueprint,
    transparent: isXRayMode,
    opacity: isXRayMode ? 0.25 : 1.0,
  });

  // Exterior Walls Material: In X-Ray mode, outer walls become transparent cyan glass (opacity 0.15)
  const exteriorWallMat = new THREE.MeshPhysicalMaterial({
    color: isBlueprint ? 0x0284c7 : (isXRayMode ? 0x38bdf8 : 0xf8fafc),
    roughness: isXRayMode ? 0.1 : 0.6,
    metalness: isXRayMode ? 0.8 : 0.05,
    wireframe: isBlueprint,
    transparent: isXRayMode,
    opacity: isXRayMode ? 0.15 : 1.0,
    depthWrite: !isXRayMode,
  });

  // Interior Partition Walls Material: Solid, vibrant in X-Ray mode (matching interior architecture)
  const interiorWallMat = new THREE.MeshStandardMaterial({
    color: isBlueprint ? 0x0ea5e9 : 0x0284c7,
    roughness: 0.5,
    metalness: 0.1,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: isBlueprint ? 0x0ea5e9 : 0x0f172a,
    roughness: 0.4,
    metalness: 0.3,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: isBlueprint ? 0x38bdf8 : 0x93c5fd,
    transmission: 0.85,
    opacity: 0.8,
    transparent: true,
    roughness: 0.1,
    ior: 1.5,
  });

  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
  });

  const lawnMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b,
    roughness: 0.85,
  });

  // 1. Terrain & Site Ground Plane
  const siteGroup = new THREE.Group();
  siteGroup.name = 'SiteGround';

  const plotW = Math.max(width + 12, specs.plotDimensions.width * (specs.unitSystem === 'feet' ? 0.3048 : 1));
  const plotD = Math.max(depth + 14, specs.plotDimensions.depth * (specs.unitSystem === 'feet' ? 0.3048 : 1));

  const siteGround = new THREE.Mesh(
    new THREE.PlaneGeometry(plotW * 1.6, plotD * 1.6),
    isBlueprint ? new THREE.MeshBasicMaterial({ color: 0x020f20, wireframe: true }) : lawnMat
  );
  siteGround.rotation.x = -Math.PI / 2;
  siteGround.position.y = -0.05;
  siteGround.receiveShadow = true;
  siteGroup.add(siteGround);

  // Front Road
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(plotW * 2, 8),
    roadMat
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.03, depth / 2 + specs.setbacks.front + 4);
  siteGroup.add(road);

  // Corner Plot: Side Road along East (Right side)
  if (isCorner) {
    const sideRoad = new THREE.Mesh(
      new THREE.PlaneGeometry(8, plotD * 2),
      roadMat
    );
    sideRoad.rotation.x = -Math.PI / 2;
    sideRoad.position.set(width / 2 + specs.setbacks.side + 4, -0.025, 0);
    siteGroup.add(sideRoad);
  }

  // Setback Boundary Lines (Neon Cyan dashed lines)
  const setbackBorderGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-width / 2, 0.05, -depth / 2),
    new THREE.Vector3(width / 2, 0.05, -depth / 2),
    new THREE.Vector3(width / 2, 0.05, depth / 2),
    new THREE.Vector3(-width / 2, 0.05, depth / 2),
    new THREE.Vector3(-width / 2, 0.05, -depth / 2),
  ]);
  const setbackLine = new THREE.Line(
    setbackBorderGeo,
    new THREE.LineDashedMaterial({
      color: 0x06b6d4,
      dashSize: 1,
      gapSize: 0.5,
      linewidth: 2,
    })
  );
  setbackLine.computeLineDistances();
  siteGroup.add(setbackLine);
  root.add(siteGroup);

  // 2. Build Each Floor into its own Group
  data.floors.forEach((floor) => {
    const floorGroup = new THREE.Group();
    floorGroup.name = `Floor_${floor.floorIndex}_${floor.name}`;
    floorGroup.userData = { floorIndex: floor.floorIndex, name: floor.name };
    floorGroupsMap.set(floor.floorIndex, floorGroup);

    const levelY = floor.levelY;
    const h = floor.height;

    if (floor.floorIndex === -1) {
      // BASEMENT FLOOR
      const basementFloor = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.4, depth),
        basementWallMat
      );
      basementFloor.position.set(0, levelY + 0.2, 0);
      basementFloor.receiveShadow = true;
      floorGroup.add(basementFloor);

      const wallThick = 0.35;
      const northWall = new THREE.Mesh(new THREE.BoxGeometry(width, h, wallThick), basementWallMat);
      northWall.position.set(0, levelY + h / 2, -depth / 2 + wallThick / 2);
      northWall.castShadow = true;
      floorGroup.add(northWall);

      const southWall = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, h, wallThick), basementWallMat);
      southWall.position.set(-width * 0.15, levelY + h / 2, depth / 2 - wallThick / 2);
      southWall.castShadow = true;
      floorGroup.add(southWall);

      const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, depth), basementWallMat);
      eastWall.position.set(width / 2 - wallThick / 2, levelY + h / 2, 0);
      eastWall.castShadow = true;
      floorGroup.add(eastWall);

      const westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, depth), basementWallMat);
      westWall.position.set(-width / 2 + wallThick / 2, levelY + h / 2, 0);
      westWall.castShadow = true;
      floorGroup.add(westWall);

      // Access Ramp
      const rampGeo = new THREE.BoxGeometry(width * 0.25, 0.2, 7);
      const ramp = new THREE.Mesh(rampGeo, accentMat);
      ramp.rotation.x = Math.PI / 10;
      ramp.position.set(width * 0.35, levelY + h * 0.4, depth / 2 + 3);
      floorGroup.add(ramp);

      // Render Each Basement Room with Partition Walls & 3D Objects
      floor.rooms.forEach((room) => {
        buildRoom3D(floorGroup, room, levelY, h, isBlueprint, isXRayMode);
      });
    } else if (floor.floorIndex >= 0 && floor.floorIndex < specs.floorsCount) {
      // REGULAR STOREYS (G, 1, 2, 3...)
      const slabThick = 0.32;
      const wallH = h - slabThick;
      const wallThick = 0.24;

      // Base Floor Slab
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.2, slabThick, depth + 0.2),
        concreteMat
      );
      slab.position.set(0, levelY + slabThick / 2, 0);
      slab.receiveShadow = true;
      slab.castShadow = true;
      floorGroup.add(slab);

      // Outer Facades (Becomes Translucent Cyan in X-Ray Mode!)
      // North Facade
      const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(width, wallH, wallThick), exteriorWallMat);
      wallNorth.position.set(0, levelY + wallH / 2 + slabThick, -depth / 2);
      wallNorth.castShadow = !isXRayMode;
      floorGroup.add(wallNorth);

      // South Facade
      const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(width, wallH, wallThick), exteriorWallMat);
      wallSouth.position.set(0, levelY + wallH / 2 + slabThick, depth / 2);
      wallSouth.castShadow = !isXRayMode;
      floorGroup.add(wallSouth);

      // East Facade
      const wallEast = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, depth), exteriorWallMat);
      wallEast.position.set(width / 2, levelY + wallH / 2 + slabThick, 0);
      wallEast.castShadow = !isXRayMode;
      floorGroup.add(wallEast);

      // West Facade
      const wallWest = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, depth), exteriorWallMat);
      wallWest.position.set(-width / 2, levelY + wallH / 2 + slabThick, 0);
      wallWest.castShadow = !isXRayMode;
      floorGroup.add(wallWest);

      // Windows (if not in X-ray mode)
      if (!isXRayMode) {
        const windowGeo = new THREE.BoxGeometry(width * 0.45, wallH * 0.72, 0.1);
        const winSouth = new THREE.Mesh(windowGeo, glassMat);
        winSouth.position.set(0, levelY + wallH / 2 + slabThick, depth / 2 + 0.1);
        floorGroup.add(winSouth);

        const winNorth = new THREE.Mesh(new THREE.BoxGeometry(width * 0.35, wallH * 0.6, 0.1), glassMat);
        winNorth.position.set(-width * 0.2, levelY + wallH / 2 + slabThick, -depth / 2 - 0.1);
        floorGroup.add(winNorth);
      }

      // Balcony (if configured)
      if (floor.floorIndex > 0 && (specs.balconyDirections.east || specs.balconyDirections.south)) {
        const balconyWidth = width * 0.48;
        const balconyDepth = 1.8;
        const balconySlab = new THREE.Mesh(
          new THREE.BoxGeometry(balconyWidth, 0.22, balconyDepth),
          accentMat
        );
        balconySlab.position.set(-width * 0.18, levelY + 0.11, depth / 2 + balconyDepth / 2);
        balconySlab.castShadow = true;
        floorGroup.add(balconySlab);

        const railing = new THREE.Mesh(
          new THREE.BoxGeometry(balconyWidth, 1.1, 0.05),
          glassMat
        );
        railing.position.set(-width * 0.18, levelY + 0.66, depth / 2 + balconyDepth);
        floorGroup.add(railing);
      }

      // Elevator Shaft Structure across floor
      if (specs.hasElevator) {
        const liftShaft = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, wallH, 1.8),
          new THREE.MeshPhysicalMaterial({
            color: 0x06b6d4,
            transmission: 0.6,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.85,
          })
        );
        liftShaft.position.set(0, levelY + wallH / 2 + slabThick, -depth * 0.35);
        floorGroup.add(liftShaft);

        // Polished Gold Elevator Doors
        const liftDoors = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 2.1, 0.06),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
        );
        liftDoors.position.set(0, levelY + 1.25, -depth * 0.35 + 0.92);
        floorGroup.add(liftDoors);
      }

      // Build EVERY Room from floor.rooms with accurate Partition Walls & 3D Objects
      floor.rooms.forEach((room) => {
        buildRoom3D(floorGroup, room, levelY, h, isBlueprint, isXRayMode);
      });
    } else {
      // ROOF TERRACE
      // In X-Ray mode, hide roof slab to show cutaway interior view!
      if (!isXRayMode) {
        const roofSlab = new THREE.Mesh(
          new THREE.BoxGeometry(width + 0.4, 0.35, depth + 0.4),
          concreteMat
        );
        roofSlab.position.set(0, levelY + 0.175, 0);
        roofSlab.castShadow = true;
        roofSlab.receiveShadow = true;
        floorGroup.add(roofSlab);

        const parapetH = 1.0;
        const parapetMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
        const pNorth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, parapetH, 0.2), parapetMat);
        pNorth.position.set(0, levelY + parapetH / 2 + 0.35, -depth / 2 - 0.1);
        floorGroup.add(pNorth);

        const pSouth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, parapetH, 0.2), parapetMat);
        pSouth.position.set(0, levelY + parapetH / 2 + 0.35, depth / 2 + 0.1);
        floorGroup.add(pSouth);

        const pEast = new THREE.Mesh(new THREE.BoxGeometry(0.2, parapetH, depth + 0.4), parapetMat);
        pEast.position.set(width / 2 + 0.1, levelY + parapetH / 2 + 0.35, 0);
        floorGroup.add(pEast);

        const pWest = new THREE.Mesh(new THREE.BoxGeometry(0.2, parapetH, depth + 0.4), parapetMat);
        pWest.position.set(-width / 2 - 0.1, levelY + parapetH / 2 + 0.35, 0);
        floorGroup.add(pWest);

        // Solar Array on Roof (if no helipad taking over center)
        const hasHelipad = floor.rooms.some(r => r.type === 'helipad');
        if (!hasHelipad) {
          const solarGroup = new THREE.Group();
          for (let s = -2; s <= 2; s++) {
            const panel = new THREE.Mesh(
              new THREE.BoxGeometry(2.4, 0.05, 1.4),
              new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 })
            );
            panel.rotation.x = Math.PI / 12;
            panel.position.set(s * 2.8, levelY + 0.8, -depth * 0.2);
            solarGroup.add(panel);
          }
          floorGroup.add(solarGroup);
        }
      }

      // Build Roof Features (Helipad, Gazebo, Pergola)
      floor.rooms.forEach((room) => {
        buildRoom3D(floorGroup, room, levelY, h, isBlueprint, isXRayMode);
      });
    }

    root.add(floorGroup);
  });
}

// Builds individual room with interior partition walls and dedicated 3D objects
function buildRoom3D(
  parentGroup: THREE.Group,
  room: RoomLayout,
  floorLevelY: number,
  floorHeight: number,
  isBlueprint: boolean,
  isXRayMode: boolean
) {
  const rx = room.x;
  const rz = room.z;
  const rw = room.width;
  const rd = room.depth;
  const slabTopY = floorLevelY + 0.34;
  const wallH = floorHeight - 0.34;
  const wallThick = 0.16;

  // 1. Room Floor Surface
  let floorColor = 0x0f172a;
  if (room.type === 'living') floorColor = 0x0e2540;
  else if (room.type === 'kitchen') floorColor = 0x0a2e38;
  else if (room.type === 'bedroom' || room.type === 'master_bedroom') floorColor = 0x172554;
  else if (room.type === 'garage') floorColor = 0x1e293b;
  else if (room.type === 'pool') floorColor = 0x0284c7;
  else if (room.type === 'theater') floorColor = 0x2e1065;
  else if (room.type === 'gym') floorColor = 0x064e3b;
  else if (room.type === 'pooja') floorColor = 0x451a03;
  else if (room.type === 'billiards') floorColor = 0x14532d;
  else if (room.type === 'bar') floorColor = 0x431407;
  else if (room.type === 'gazebo') floorColor = 0x1c1917;
  else if (room.type === 'helipad') floorColor = 0x1e293b;

  const roomFloorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(rw * 0.98, 0.04, rd * 0.98),
    new THREE.MeshStandardMaterial({
      color: isBlueprint ? 0x0284c7 : floorColor,
      roughness: room.type === 'pool' ? 0.1 : 0.6,
      metalness: room.type === 'helipad' ? 0.4 : 0.1,
    })
  );
  roomFloorMesh.position.set(rx, slabTopY + 0.02, rz);
  parentGroup.add(roomFloorMesh);

  // 2. Interior Partition Walls around the Room (Matching 2D Blueprint Room Outlines!)
  // In blueprint mode or 3D mode, draw the partition walls enclosing the room
  if (room.type !== 'terrace' && room.type !== 'pool' && room.type !== 'helipad' && room.type !== 'garden') {
    const intWallMat = new THREE.MeshStandardMaterial({
      color: isBlueprint ? 0x0ea5e9 : (isXRayMode ? 0x38bdf8 : 0x64748b),
      roughness: 0.5,
      metalness: isXRayMode ? 0.3 : 0.05,
    });

    // North wall of room (leave 1m opening for doorway)
    const nWallLeft = new THREE.Mesh(new THREE.BoxGeometry((rw - 1.0) / 2, wallH * 0.92, wallThick), intWallMat);
    nWallLeft.position.set(rx - rw / 4 - 0.25, slabTopY + (wallH * 0.92) / 2, rz - rd / 2 + wallThick / 2);
    parentGroup.add(nWallLeft);

    const nWallRight = new THREE.Mesh(new THREE.BoxGeometry((rw - 1.0) / 2, wallH * 0.92, wallThick), intWallMat);
    nWallRight.position.set(rx + rw / 4 + 0.25, slabTopY + (wallH * 0.92) / 2, rz - rd / 2 + wallThick / 2);
    parentGroup.add(nWallRight);

    // East wall of room
    const eWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH * 0.92, rd), intWallMat);
    eWall.position.set(rx + rw / 2 - wallThick / 2, slabTopY + (wallH * 0.92) / 2, rz);
    parentGroup.add(eWall);

    // West wall of room
    const wWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH * 0.92, rd), intWallMat);
    wWall.position.set(rx - rw / 2 + wallThick / 2, slabTopY + (wallH * 0.92) / 2, rz);
    parentGroup.add(wWall);
  }

  // 3. 3D ARCHITECTURAL OBJECTS INSIDE ROOM (Enriching the 3D Model with real features)
  if (isBlueprint) return; // In blueprint wireframe mode, skip heavy interior mesh details

  if (room.type === 'master_bedroom' || room.type === 'bedroom') {
    // Bed Group
    const bedGroup = new THREE.Group();
    // Mattress
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.5, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 })
    );
    mattress.position.set(0, 0.25, 0);
    bedGroup.add(mattress);

    // Headboard
    const headboard = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 1.1, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
    );
    headboard.position.set(0, 0.55, -1.0);
    bedGroup.add(headboard);

    // Pillows
    const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.45), new THREE.MeshStandardMaterial({ color: 0x93c5fd }));
    pillow1.position.set(-0.55, 0.55, -0.7);
    const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.45), new THREE.MeshStandardMaterial({ color: 0x93c5fd }));
    pillow2.position.set(0.55, 0.55, -0.7);
    bedGroup.add(pillow1);
    bedGroup.add(pillow2);

    bedGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(bedGroup);
  } else if (room.type === 'living') {
    // Sectional L-Sofa + Coffee Table + TV
    const livingGroup = new THREE.Group();
    // Sofa Main
    const sofaMain = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.65, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.7 })
    );
    sofaMain.position.set(0, 0.325, 0.6);
    livingGroup.add(sofaMain);

    // Sofa Chaise
    const sofaChaise = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.65, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.7 })
    );
    sofaChaise.position.set(-0.8, 0.325, -0.4);
    livingGroup.add(sofaChaise);

    // Coffee Table
    const coffeeTable = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.35, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.6 })
    );
    coffeeTable.position.set(0.2, 0.175, -0.2);
    livingGroup.add(coffeeTable);

    livingGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(livingGroup);
  } else if (room.type === 'kitchen') {
    // Kitchen Counter & Dining
    const kitchenGroup = new THREE.Group();
    // L-Counter
    const counter1 = new THREE.Mesh(
      new THREE.BoxGeometry(rw * 0.7, 0.9, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.3 })
    );
    counter1.position.set(0, 0.45, -rd / 2 + 0.5);
    kitchenGroup.add(counter1);

    // Dining Table
    const diningTable = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.75, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
    );
    diningTable.position.set(0, 0.375, 0.4);
    kitchenGroup.add(diningTable);

    kitchenGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(kitchenGroup);
  } else if (room.type === 'garage') {
    // 3D Sedan Car Model
    const carGroup = new THREE.Group();
    // Body
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.6, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
    );
    carBody.position.set(0, 0.45, 0);
    carGroup.add(carBody);

    // Cabin
    const carCabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.5, 2.0),
      new THREE.MeshPhysicalMaterial({ color: 0x0f172a, transmission: 0.8, opacity: 0.9, roughness: 0.1 })
    );
    carCabin.position.set(0, 0.95, -0.2);
    carGroup.add(carCabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const w1 = new THREE.Mesh(wheelGeo, wheelMat);
    w1.rotation.z = Math.PI / 2;
    w1.position.set(-0.95, 0.3, 1.2);
    const w2 = new THREE.Mesh(wheelGeo, wheelMat);
    w2.rotation.z = Math.PI / 2;
    w2.position.set(0.95, 0.3, 1.2);
    const w3 = new THREE.Mesh(wheelGeo, wheelMat);
    w3.rotation.z = Math.PI / 2;
    w3.position.set(-0.95, 0.3, -1.2);
    const w4 = new THREE.Mesh(wheelGeo, wheelMat);
    w4.rotation.z = Math.PI / 2;
    w4.position.set(0.95, 0.3, -1.2);
    carGroup.add(w1, w2, w3, w4);

    carGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(carGroup);
  } else if (room.type === 'pool') {
    // 3D Swimming Pool with Water Depth, Stone Coping, and Sun Loungers
    const poolGroup = new THREE.Group();
    // Recessed pool basin
    const poolWater = new THREE.Mesh(
      new THREE.BoxGeometry(rw * 0.85, 0.3, rd * 0.85),
      new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transmission: 0.7,
        opacity: 0.85,
        roughness: 0.05,
        metalness: 0.1,
      })
    );
    poolWater.position.set(0, 0.15, 0);
    poolGroup.add(poolWater);

    // Stone Coping border
    const border = new THREE.Mesh(
      new THREE.BoxGeometry(rw, 0.08, rd),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 })
    );
    border.position.set(0, 0.04, 0);
    poolGroup.add(border);

    // Sun Lounger Recliners
    const loungerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 1.8), loungerMat);
    l1.position.set(-rw * 0.35, 0.15, rd * 0.35);
    const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 1.8), loungerMat);
    l2.position.set(-rw * 0.15, 0.15, rd * 0.35);
    poolGroup.add(l1, l2);

    poolGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(poolGroup);
  } else if (room.type === 'theater') {
    // 3D Dolby Cinema with Screen & Recliner Rows
    const theaterGroup = new THREE.Group();
    // Curved Projection Screen on front wall
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(rw * 0.8, 1.8, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    screen.position.set(0, 1.4, -rd / 2 + 0.15);
    theaterGroup.add(screen);

    // Recliner Seat Rows (Red Velvet)
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
    for (let r = 0; r < 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), seatMat);
        seat.position.set(c * 0.85, 0.35 + r * 0.2, 0.2 + r * 1.1);
        theaterGroup.add(seat);
      }
    }

    theaterGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(theaterGroup);
  } else if (room.type === 'gym') {
    // 3D Fitness Gym with Treadmill & Dumbbell Rack
    const gymGroup = new THREE.Group();
    // Treadmill
    const treadmillBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.15, 1.9),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    treadmillBase.position.set(-rw * 0.22, 0.1, 0);
    gymGroup.add(treadmillBase);

    const treadmillConsole = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
    );
    treadmillConsole.position.set(-rw * 0.22, 0.65, -0.9);
    gymGroup.add(treadmillConsole);

    // Dumbbell Rack
    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.8, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 })
    );
    rack.position.set(rw * 0.22, 0.4, 0);
    gymGroup.add(rack);

    gymGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(gymGroup);
  } else if (room.type === 'pooja') {
    // 3D Mandir / Pooja Sanctum with Teakwood Altar & Brass Finial
    const mandirGroup = new THREE.Group();
    // Stepped Altar
    const altarBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 })
    );
    altarBase.position.set(0, 0.35, 0);
    mandirGroup.add(altarBase);

    // Golden Temple Shikhar / Dome
    const shikhar = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 })
    );
    shikhar.position.set(0, 1.15, 0);
    mandirGroup.add(shikhar);

    mandirGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(mandirGroup);
  } else if (room.type === 'gazebo') {
    // 3D Rooftop Pergola & Gazebo with 4 Timber Posts & Trellis Canopy
    const gazeboGroup = new THREE.Group();
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
    const postGeo = new THREE.BoxGeometry(0.2, 2.4, 0.2);

    const p1 = new THREE.Mesh(postGeo, timberMat);
    p1.position.set(-rw * 0.4, 1.2, -rd * 0.4);
    const p2 = new THREE.Mesh(postGeo, timberMat);
    p2.position.set(rw * 0.4, 1.2, -rd * 0.4);
    const p3 = new THREE.Mesh(postGeo, timberMat);
    p3.position.set(-rw * 0.4, 1.2, rd * 0.4);
    const p4 = new THREE.Mesh(postGeo, timberMat);
    p4.position.set(rw * 0.4, 1.2, rd * 0.4);
    gazeboGroup.add(p1, p2, p3, p4);

    // Slatted Trellis Roof
    for (let b = -4; b <= 4; b++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(rw * 0.9, 0.08, 0.12), timberMat);
      beam.position.set(0, 2.45, (b * rd * 0.85) / 9);
      gazeboGroup.add(beam);
    }

    // Circular Patio Coffee Table & Seats
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
    );
    table.position.set(0, 0.2, 0);
    gazeboGroup.add(table);

    gazeboGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(gazeboGroup);
  } else if (room.type === 'helipad') {
    // 3D Rooftop Helipad with Circular Landing Pad & Bold 'H' Markings
    const heliGroup = new THREE.Group();
    const padRadius = Math.min(rw, rd) * 0.44;

    // Helipad Disc
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(padRadius, padRadius, 0.06, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.3, roughness: 0.8 })
    );
    pad.position.set(0, 0.03, 0);
    heliGroup.add(pad);

    // White Perimeter Ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(padRadius * 0.85, padRadius * 0.95, 32),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.065, 0);
    heliGroup.add(ring);

    // Center 'H' Emblem (Using 3 boxes)
    const hMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const hLeft = new THREE.Mesh(new THREE.PlaneGeometry(padRadius * 0.2, padRadius * 0.8), hMat);
    hLeft.rotation.x = -Math.PI / 2;
    hLeft.position.set(-padRadius * 0.35, 0.07, 0);
    const hRight = new THREE.Mesh(new THREE.PlaneGeometry(padRadius * 0.2, padRadius * 0.8), hMat);
    hRight.rotation.x = -Math.PI / 2;
    hRight.position.set(padRadius * 0.35, 0.07, 0);
    const hCross = new THREE.Mesh(new THREE.PlaneGeometry(padRadius * 0.6, padRadius * 0.2), hMat);
    hCross.rotation.x = -Math.PI / 2;
    hCross.position.set(0, 0.07, 0);
    heliGroup.add(hLeft, hRight, hCross);

    // 4 Corner Aviation Warning Beacons
    for (let c = 0; c < 4; c++) {
      const angle = (c * Math.PI) / 2 + Math.PI / 4;
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beacon.position.set(Math.cos(angle) * padRadius * 1.05, 0.18, Math.sin(angle) * padRadius * 1.05);
      heliGroup.add(beacon);
    }

    heliGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(heliGroup);
  } else if (room.type === 'billiards') {
    // 3D Billiards / Snooker Table
    const billGroup = new THREE.Group();
    // Green felt table
    const tableMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.8, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 })
    );
    tableMesh.position.set(0, 0.4, 0);
    billGroup.add(tableMesh);

    // Mahogany rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.3 });
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 0.15), railMat);
    railTop.position.set(0, 0.85, -0.7);
    const railBottom = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 0.15), railMat);
    railBottom.position.set(0, 0.85, 0.7);
    billGroup.add(railTop, railBottom);

    billGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(billGroup);
  } else if (room.type === 'bar') {
    // 3D Cocktail Bar Counter with Barstools
    const barGroup = new THREE.Group();
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.05, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.3 })
    );
    counter.position.set(0, 0.525, 0);
    barGroup.add(counter);

    // 3 Barstools
    const stoolMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
    for (let s = -1; s <= 1; s++) {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.75, 12), stoolMat);
      stool.position.set(s * 0.7, 0.375, 0.6);
      barGroup.add(stool);
    }

    barGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(barGroup);
  } else if (room.type === 'office') {
    // 3D Executive Office Desk + Chair + Bookcase
    const offGroup = new THREE.Group();
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.75, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
    );
    desk.position.set(0, 0.375, 0);
    offGroup.add(desk);

    const chair = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.95, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    chair.position.set(0, 0.475, -0.7);
    offGroup.add(chair);

    const bookcase = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.9, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
    );
    bookcase.position.set(0, 0.95, rd / 2 - 0.2);
    offGroup.add(bookcase);

    offGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(offGroup);
  } else if (room.type === 'custom') {
    // User Bespoke Architectural Directive Plinth
    const bespokeGroup = new THREE.Group();
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.8, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.6, roughness: 0.2 })
    );
    pedestal.position.set(0, 0.4, 0);
    bespokeGroup.add(pedestal);

    // Glowing Hologram Disc
    const holoDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    holoDisc.position.set(0, 0.84, 0);
    bespokeGroup.add(holoDisc);

    bespokeGroup.position.set(rx, slabTopY, rz);
    parentGroup.add(bespokeGroup);
  }
}
