import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PedestalInputs, CalculatedData } from '../types/pedestal';
import { getBarData } from '../utils/aciData';
import { Camera, Eye, EyeOff, Info } from 'lucide-react';

interface ThreeDViewProps {
  inputs: PedestalInputs;
  data: CalculatedData;
}

const ThreeDView: React.FC<ThreeDViewProps> = ({ inputs, data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const [showConcrete, setShowConcrete] = useState(true);
  const [showRebar, setShowRebar] = useState(true);
  const [showBaseplate, setShowBaseplate] = useState(true);
  const [showBolts, setShowBolts] = useState(true);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; text: string }>({ visible: false, x: 0, y: 0, text: '' });

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const interactableObjectsRef = useRef<THREE.Object3D[]>([]);
  const hoveredObjectRef = useRef<THREE.Object3D | null>(null);

  // Materials
  const materials = useMemo(() => {
    return {
      concrete: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.25,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      concreteEdge: new THREE.LineBasicMaterial({ color: 0x94a3b8, opacity: 0.5, transparent: true }),
      vBar: new THREE.MeshStandardMaterial({
        color: 0x475569, // Darker steel
        roughness: 0.6,
        metalness: 0.7,
      }),
      vBarHighlight: new THREE.MeshStandardMaterial({
        color: 0x3b82f6, // Blue highlight
        roughness: 0.4,
        metalness: 0.8,
      }),
      tBar: new THREE.MeshStandardMaterial({
        color: 0x64748b, // Lighter steel
        roughness: 0.6,
        metalness: 0.7,
      }),
      tBarHighlight: new THREE.MeshStandardMaterial({
        color: 0x0ea5e9, // Light blue highlight
        roughness: 0.4,
        metalness: 0.8,
      }),
      baseplate: new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.5,
        metalness: 0.8,
      }),
      bolt: new THREE.MeshStandardMaterial({
        color: 0xd97706, // Bronze/Orange tint for bolts
        roughness: 0.4,
        metalness: 0.9,
      }),
      grout: new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        roughness: 0.9,
        metalness: 0.0,
      })
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(inputs.pedestalLength * 1.5, inputs.pedestalHeight * 1.2, inputs.pedestalWidth * 1.5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.id = 'three-canvas';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, inputs.pedestalHeight / 2, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(inputs.pedestalLength, inputs.pedestalHeight * 2, inputs.pedestalWidth);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    const d = Math.max(inputs.pedestalLength, inputs.pedestalWidth) * 1.5;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-inputs.pedestalLength, inputs.pedestalHeight / 2, -inputs.pedestalWidth);
    scene.add(fillLight);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Mouse move handler for raycasting
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current || !camera || !scene) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(interactableObjectsRef.current, false);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (hoveredObjectRef.current !== object) {
          // Reset previous hovered object
          if (hoveredObjectRef.current) {
            const prevUserData = hoveredObjectRef.current.userData;
            if (prevUserData.type === 'vBar') (hoveredObjectRef.current as THREE.Mesh).material = materials.vBar;
            if (prevUserData.type === 'tBar') (hoveredObjectRef.current as THREE.Mesh).material = materials.tBar;
          }
          
          // Set new hovered object
          hoveredObjectRef.current = object;
          const userData = object.userData;
          if (userData.type === 'vBar') (object as THREE.Mesh).material = materials.vBarHighlight;
          if (userData.type === 'tBar') (object as THREE.Mesh).material = materials.tBarHighlight;
          
          setTooltip({
            visible: true,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            text: userData.info
          });
          containerRef.current.style.cursor = 'pointer';
        } else {
          // Update tooltip position
          setTooltip(prev => ({ ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top }));
        }
      } else {
        if (hoveredObjectRef.current) {
          const prevUserData = hoveredObjectRef.current.userData;
          if (prevUserData.type === 'vBar') (hoveredObjectRef.current as THREE.Mesh).material = materials.vBar;
          if (prevUserData.type === 'tBar') (hoveredObjectRef.current as THREE.Mesh).material = materials.tBar;
          hoveredObjectRef.current = null;
          setTooltip(prev => ({ ...prev, visible: false }));
          containerRef.current.style.cursor = 'default';
        }
      }
    };
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    
    const handleMouseLeave = () => {
      if (hoveredObjectRef.current) {
        const prevUserData = hoveredObjectRef.current.userData;
        if (prevUserData.type === 'vBar') (hoveredObjectRef.current as THREE.Mesh).material = materials.vBar;
        if (prevUserData.type === 'tBar') (hoveredObjectRef.current as THREE.Mesh).material = materials.tBar;
        hoveredObjectRef.current = null;
      }
      setTooltip(prev => ({ ...prev, visible: false }));
      if (containerRef.current) containerRef.current.style.cursor = 'default';
    };
    containerRef.current.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
        containerRef.current.removeChild(renderer.domElement);
      }
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [materials, inputs.pedestalLength, inputs.pedestalWidth, inputs.pedestalHeight]);

  // Rebuild scene when data changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear previous objects except lights
    const objectsToRemove: THREE.Object3D[] = [];
    scene.children.forEach(child => {
      if (!(child instanceof THREE.Light)) {
        objectsToRemove.push(child);
      }
    });
    
    objectsToRemove.forEach(obj => {
      scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      } else if (obj instanceof THREE.Group) {
        obj.children.forEach(child => {
          if (child instanceof THREE.Mesh) child.geometry.dispose();
        });
      }
    });

    interactableObjectsRef.current = [];

    // XYZ Axis Helper
    const axisLength = Math.max(inputs.pedestalLength, inputs.pedestalWidth, inputs.pedestalHeight) * 0.6;
    const axisGroup = new THREE.Group();
    
    // X axis (red) - along pedestal length
    const xAxisMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(axisLength, 0, 0)
    ]);
    axisGroup.add(new THREE.Line(xAxisGeom, xAxisMat));
    // X arrowhead
    const xCone = new THREE.Mesh(
      new THREE.ConeGeometry(axisLength * 0.03, axisLength * 0.1, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    xCone.position.set(axisLength, 0, 0);
    xCone.rotation.z = -Math.PI / 2;
    axisGroup.add(xCone);

    // Y axis (green) - vertical
    const yAxisMat = new THREE.LineBasicMaterial({ color: 0x22c55e, linewidth: 2 });
    const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, axisLength, 0)
    ]);
    axisGroup.add(new THREE.Line(yAxisGeom, yAxisMat));
    // Y arrowhead
    const yCone = new THREE.Mesh(
      new THREE.ConeGeometry(axisLength * 0.03, axisLength * 0.1, 8),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    yCone.position.set(0, axisLength, 0);
    axisGroup.add(yCone);

    // Z axis (blue) - along pedestal width
    const zAxisMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
    const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, axisLength)
    ]);
    axisGroup.add(new THREE.Line(zAxisGeom, zAxisMat));
    // Z arrowhead
    const zCone = new THREE.Mesh(
      new THREE.ConeGeometry(axisLength * 0.03, axisLength * 0.1, 8),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
    );
    zCone.position.set(0, 0, axisLength);
    zCone.rotation.x = Math.PI / 2;
    axisGroup.add(zCone);

    // Position at corner origin (top-left of concrete in plan = -L/2, 0, -W/2)
    axisGroup.position.set(-inputs.pedestalLength / 2, 0, -inputs.pedestalWidth / 2);
    scene.add(axisGroup);

    // Concrete Pedestal
    if (showConcrete) {
      const geometry = new THREE.BoxGeometry(inputs.pedestalLength, inputs.pedestalHeight, inputs.pedestalWidth);
      const mesh = new THREE.Mesh(geometry, materials.concrete);
      mesh.position.y = inputs.pedestalHeight / 2;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(edges, materials.concreteEdge);
      line.position.y = inputs.pedestalHeight / 2;
      scene.add(line);
      
      // Ground plane for shadow catching
      const planeGeom = new THREE.PlaneGeometry(inputs.pedestalLength * 5, inputs.pedestalWidth * 5);
      const planeMat = new THREE.ShadowMaterial({ opacity: 0.2 });
      const plane = new THREE.Mesh(planeGeom, planeMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = 0;
      plane.receiveShadow = true;
      scene.add(plane);
    }

    // Grout
    if (showBaseplate) {
      const groutGeom = new THREE.BoxGeometry(inputs.pedestalLength, inputs.groutThickness, inputs.pedestalWidth);
      const groutMesh = new THREE.Mesh(groutGeom, materials.grout);
      groutMesh.position.y = inputs.pedestalHeight + inputs.groutThickness / 2;
      groutMesh.receiveShadow = true;
      groutMesh.castShadow = true;
      scene.add(groutMesh);

      // Baseplate
      const bpGeom = new THREE.BoxGeometry(inputs.baseplateLength, inputs.baseplateThickness, inputs.baseplateWidth);
      const bpMesh = new THREE.Mesh(bpGeom, materials.baseplate);
      bpMesh.position.y = inputs.pedestalHeight + inputs.groutThickness + inputs.baseplateThickness / 2;
      bpMesh.receiveShadow = true;
      bpMesh.castShadow = true;
      scene.add(bpMesh);
    }

    // Rebar
    if (showRebar) {
      const vBar = getBarData(inputs.verticalBarSize);
      const tBar = getBarData(inputs.tieBarSize);
      const vRadius = vBar.diameter / 2;
      const tRadius = tBar.diameter / 2;
      
      // Bend radius (ACI: inside bend diameter is 4db for #3-#5, so radius is 2db)
      const bendRadius = tBar.diameter * 2;

      // Vertical Bars
      const vGeom = new THREE.CylinderGeometry(vRadius, vRadius, inputs.pedestalHeight - inputs.clearance * 2, 8);
      // Shift geometry so origin is at bottom
      vGeom.translate(0, (inputs.pedestalHeight - inputs.clearance * 2) / 2, 0);
      
      data.verticalBars.forEach((bar, index) => {
        const mesh = new THREE.Mesh(vGeom, materials.vBar);
        mesh.position.set(bar.x, inputs.clearance, bar.y);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { 
          type: 'vBar', 
          info: `Vertical Bar ${index + 1}\nSize: #${inputs.verticalBarSize}\nDia: ${vBar.diameter}"` 
        };
        scene.add(mesh);
        interactableObjectsRef.current.push(mesh);
      });

      // Helper to create rounded tie paths
      const createTieMesh = (path: THREE.CurvePath<THREE.Vector3>, info: string) => {
        const tubeGeom = new THREE.TubeGeometry(path, Math.max(20, Math.floor(path.getLength() * 2)), tRadius, 6, false);
        const mesh = new THREE.Mesh(tubeGeom, materials.tBar);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type: 'tBar', info };
        scene.add(mesh);
        interactableObjectsRef.current.push(mesh);
      };

      // Ties
      data.ties.forEach((tie, index) => {
        const y = tie.z; // In 3D, z from 2D is y
        const info = `Tie ${index + 1}\nType: ${tie.type}\nSize: #${inputs.tieBarSize} @ ${inputs.tieSpacing}"`;

        if (tie.type === 'outer' && tie.width && tie.length) {
          // Create a rounded rectangle path
          const path = new THREE.CurvePath<THREE.Vector3>();
          const hw = tie.length / 2;
          const hd = tie.width / 2;
          const r = bendRadius;
          
          // Points for corners
          const p1 = new THREE.Vector3(hw - r, y, hd);
          const p2 = new THREE.Vector3(-hw + r, y, hd);
          const p3 = new THREE.Vector3(-hw, y, hd - r);
          const p4 = new THREE.Vector3(-hw, y, -hd + r);
          const p5 = new THREE.Vector3(-hw + r, y, -hd);
          const p6 = new THREE.Vector3(hw - r, y, -hd);
          const p7 = new THREE.Vector3(hw, y, -hd + r);
          const p8 = new THREE.Vector3(hw, y, hd - r);

          // 135 degree hook at start (top right corner)
          const hookLen = Math.max(3, 6 * tBar.diameter);
          const hookStart = new THREE.Vector3(hw - r - hookLen * Math.cos(Math.PI/4), y, hd - r - hookLen * Math.sin(Math.PI/4));
          path.add(new THREE.LineCurve3(hookStart, new THREE.Vector3(hw - r - r * Math.cos(Math.PI/4), y, hd - r - r * Math.sin(Math.PI/4))));
          
          // Add arcs and lines
          // Top edge
          path.add(new THREE.LineCurve3(p1, p2));
          // Top left corner
          path.add(new THREE.QuadraticBezierCurve3(p2, new THREE.Vector3(-hw, y, hd), p3));
          // Left edge
          path.add(new THREE.LineCurve3(p3, p4));
          // Bottom left corner
          path.add(new THREE.QuadraticBezierCurve3(p4, new THREE.Vector3(-hw, y, -hd), p5));
          // Bottom edge
          path.add(new THREE.LineCurve3(p5, p6));
          // Bottom right corner
          path.add(new THREE.QuadraticBezierCurve3(p6, new THREE.Vector3(hw, y, -hd), p7));
          // Right edge
          path.add(new THREE.LineCurve3(p7, p8));
          // Top right corner (closing)
          path.add(new THREE.QuadraticBezierCurve3(p8, new THREE.Vector3(hw, y, hd), p1));
          
          // 135 degree hook at end
          const hookEnd = new THREE.Vector3(hw - r - hookLen * Math.cos(Math.PI/4), y, hd - r - hookLen * Math.sin(Math.PI/4));
          // Slight offset to avoid z-fighting
          hookEnd.y -= tBar.diameter;
          const hookEndStart = new THREE.Vector3(hw - r - r * Math.cos(Math.PI/4), y - tBar.diameter, hd - r - r * Math.sin(Math.PI/4));
          path.add(new THREE.LineCurve3(new THREE.Vector3(hw - r, y, hd), hookEndStart));
          path.add(new THREE.LineCurve3(hookEndStart, hookEnd));

          createTieMesh(path, info);
        } 
        else if ((tie.type === 'crosstie_x' && tie.startX !== undefined && tie.endX !== undefined && tie.y !== undefined) || 
                 (tie.type === 'crosstie_y' && tie.startY !== undefined && tie.endY !== undefined && tie.x !== undefined) ||
                 (tie.type === 'user_c_tie' && tie.points && tie.points.length === 2)) {
          
          let pStart, pEnd;
          if (tie.type === 'crosstie_x') {
            pStart = new THREE.Vector3(tie.startX, y, tie.y);
            pEnd = new THREE.Vector3(tie.endX, y, tie.y);
          } else if (tie.type === 'crosstie_y') {
            pStart = new THREE.Vector3(tie.x, y, tie.startY);
            pEnd = new THREE.Vector3(tie.x, y, tie.endY);
          } else {
            pStart = new THREE.Vector3(tie.points![0].x, y, tie.points![0].y);
            pEnd = new THREE.Vector3(tie.points![1].x, y, tie.points![1].y);
          }

          const path = new THREE.CurvePath<THREE.Vector3>();
          const dir = new THREE.Vector3().subVectors(pEnd, pStart).normalize();
          const perp = new THREE.Vector3(-dir.z, 0, dir.x); // Perpendicular in XZ plane
          
          const r = bendRadius;
          const hookLen = Math.max(3, 6 * tBar.diameter);
          
          // 135 degree hook at start
          const hook1Dir = new THREE.Vector3().addVectors(dir, perp).normalize();
          const h1Start = new THREE.Vector3().copy(pStart).addScaledVector(dir, r).addScaledVector(hook1Dir, hookLen);
          const h1End = new THREE.Vector3().copy(pStart).addScaledVector(dir, r);
          path.add(new THREE.LineCurve3(h1Start, h1End));
          
          // Main straight segment
          const mStart = new THREE.Vector3().copy(pStart).addScaledVector(dir, r);
          const mEnd = new THREE.Vector3().copy(pEnd).subScaledVector(dir, r);
          path.add(new THREE.LineCurve3(mStart, mEnd));
          
          // 90 degree hook at end
          const h2Start = new THREE.Vector3().copy(pEnd).subScaledVector(dir, r);
          const h2End = new THREE.Vector3().copy(pEnd).subScaledVector(dir, r).addScaledVector(perp, hookLen);
          path.add(new THREE.QuadraticBezierCurve3(h2Start, pEnd, new THREE.Vector3().copy(pEnd).addScaledVector(perp, r)));
          path.add(new THREE.LineCurve3(new THREE.Vector3().copy(pEnd).addScaledVector(perp, r), h2End));

          createTieMesh(path, info);
        }
        else if (tie.type === 'user_closed' && tie.points && tie.points.length === 4) {
          // Simplified closed tie for user defined
          const path = new THREE.CurvePath<THREE.Vector3>();
          for (let i = 0; i < 4; i++) {
            const p1 = tie.points[i];
            const p2 = tie.points[(i + 1) % 4];
            path.add(new THREE.LineCurve3(
              new THREE.Vector3(p1.x, y, p1.y),
              new THREE.Vector3(p2.x, y, p2.y)
            ));
          }
          createTieMesh(path, info);
        }
      });
    }

    // Anchor Bolts
    if (showBolts) {
      const boltDia = typeof inputs.boltDiameter === 'number' ? inputs.boltDiameter : 1.0;
      const totalLen = inputs.boltTotalLength;
      
      const boltGeom = new THREE.CylinderGeometry(boltDia / 2, boltDia / 2, totalLen, 12);
      boltGeom.translate(0, totalLen / 2, 0); // Origin at bottom
      
      const nutHeight = boltDia;
      const nutRadius = boltDia * 0.866;
      const nutGeom = new THREE.CylinderGeometry(nutRadius, nutRadius, nutHeight, 6);
      
      inputs.bolts.forEach((bolt, index) => {
        const boltGroup = new THREE.Group();
        
        const topY = inputs.pedestalHeight + inputs.boltProjection;
        const bottomY = topY - totalLen;
        
        const mesh = new THREE.Mesh(boltGeom, materials.bolt);
        mesh.position.set(0, bottomY, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        boltGroup.add(mesh);

        // Top Nut
        const topNut = new THREE.Mesh(nutGeom, materials.bolt);
        const topNutY = inputs.pedestalHeight + inputs.groutThickness + inputs.baseplateThickness + nutHeight / 2;
        topNut.position.set(0, topNutY, 0);
        topNut.castShadow = true;
        boltGroup.add(topNut);

        // Bottom Nut
        const bottomNut = new THREE.Mesh(nutGeom, materials.bolt);
        const bottomNutY = bottomY + inputs.threadLengthAtBottom - nutHeight / 2;
        bottomNut.position.set(0, bottomNutY, 0);
        bottomNut.castShadow = true;
        boltGroup.add(bottomNut);

        boltGroup.position.set(bolt.x, 0, bolt.y);
        scene.add(boltGroup);
      });
    }

  }, [inputs, data, showConcrete, showRebar, showBaseplate, showBolts, materials]);

  const setCameraView = (view: 'top' | 'front' | 'side' | 'iso') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const dist = Math.max(inputs.pedestalLength, inputs.pedestalHeight, inputs.pedestalWidth) * 1.5;

    switch (view) {
      case 'top':
        camera.position.set(0, dist * 1.5, 0);
        break;
      case 'front':
        camera.position.set(0, inputs.pedestalHeight / 2, dist);
        break;
      case 'side':
        camera.position.set(dist, inputs.pedestalHeight / 2, 0);
        break;
      case 'iso':
        camera.position.set(dist * 0.8, dist * 0.8, dist * 0.8);
        break;
    }
    controls.target.set(0, inputs.pedestalHeight / 2, 0);
    controls.update();
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-50">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="absolute z-50 bg-slate-900 text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none whitespace-pre-line border border-slate-700"
          style={{ 
            left: tooltip.x + 15, 
            top: tooltip.y + 15,
            transform: 'translate(0, 0)'
          }}
        >
          {tooltip.text}
        </div>
      )}
      
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-3">
        <div className="bg-white/95 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-slate-200/60 flex flex-col gap-1">
          <button onClick={() => setShowConcrete(!showConcrete)} className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${showConcrete ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}>
            {showConcrete ? <Eye size={14} /> : <EyeOff size={14} />} Concrete
          </button>
          <button onClick={() => setShowRebar(!showRebar)} className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${showRebar ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}>
            {showRebar ? <Eye size={14} /> : <EyeOff size={14} />} Rebar
          </button>
          <button onClick={() => setShowBaseplate(!showBaseplate)} className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${showBaseplate ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}>
            {showBaseplate ? <Eye size={14} /> : <EyeOff size={14} />} Baseplate
          </button>
          <button onClick={() => setShowBolts(!showBolts)} className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${showBolts ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}>
            {showBolts ? <Eye size={14} /> : <EyeOff size={14} />} Bolts
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-slate-200/60 flex flex-col gap-1">
          <button onClick={() => setCameraView('top')} className="px-3 py-2 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2 transition-colors">
            <Camera size={14} /> Top
          </button>
          <button onClick={() => setCameraView('front')} className="px-3 py-2 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2 transition-colors">
            <Camera size={14} /> Front
          </button>
          <button onClick={() => setCameraView('side')} className="px-3 py-2 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2 transition-colors">
            <Camera size={14} /> Side
          </button>
          <button onClick={() => setCameraView('iso')} className="px-3 py-2 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-2 transition-colors">
            <Camera size={14} /> Iso
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-slate-200/60">
        <Info size={14} className="text-blue-500" />
        <span className="text-[11px] font-medium text-slate-600">Hover over rebars for details. Drag to rotate, scroll to zoom.</span>
      </div>
    </div>
  );
};

export default ThreeDView;
