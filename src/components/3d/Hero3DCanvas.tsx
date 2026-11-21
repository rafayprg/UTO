"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Hero3DCanvasProps {
  activeTheme?: "cyan" | "emerald" | "violet" | "ruby" | "amber";
  className?: string;
}

const THEME_COLORS = {
  cyan: {
    primary: 0x06b6d4,
    secondary: 0x3b82f6,
    ambient: 0x0284c7,
    particles: 0x38bdf8,
    core: 0x0ea5e9,
  },
  emerald: {
    primary: 0x10b981,
    secondary: 0x059669,
    ambient: 0x047857,
    particles: 0x34d399,
    core: 0x10b981,
  },
  violet: {
    primary: 0x8b5cf6,
    secondary: 0x6366f1,
    ambient: 0x4f46e5,
    particles: 0xa78bfa,
    core: 0x7c3aed,
  },
  ruby: {
    primary: 0xf43f5e,
    secondary: 0xe11d48,
    ambient: 0xbe123c,
    particles: 0xfb7185,
    core: 0xf43f5e,
  },
  amber: {
    primary: 0xf59e0b,
    secondary: 0xd97706,
    ambient: 0xb45309,
    particles: 0xfcd34d,
    core: 0xf59e0b,
  },
};

export default function Hero3DCanvas({
  activeTheme = "cyan",
  className = "",
}: Hero3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const themeRef = useRef(activeTheme);
  themeRef.current = activeTheme;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL support
    try {
      const canvasTest = document.createElement("canvas");
      const gl =
        canvasTest.getContext("webgl") ||
        canvasTest.getContext("experimental-webgl");
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 650;

    // SCENE
    const scene = new THREE.Scene();

    // CAMERA
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 24;
    camera.position.y = 1;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // GROUPS
    const mainGroup = new THREE.Group();
    const isDesktopInit = width >= 1024;
    mainGroup.position.set(isDesktopInit ? 5.0 : 0, isDesktopInit ? 0.2 : 2.0, 0);
    scene.add(mainGroup);

    // 1. CYBER CORE (Inner Pulsing Sphere)
    const coreGeo = new THREE.IcosahedronGeometry(4.2, 3);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: THEME_COLORS[activeTheme].core,
      roughness: 0.2,
      metalness: 0.8,
      transmission: 0.6,
      thickness: 1.5,
      emissive: THEME_COLORS[activeTheme].primary,
      emissiveIntensity: 0.35,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreMesh);

    // 2. WIREFRAME GEODESIC SHELL
    const wireGeo = new THREE.IcosahedronGeometry(5.4, 2);
    const wireMat = new THREE.MeshStandardMaterial({
      color: THEME_COLORS[activeTheme].primary,
      wireframe: true,
      emissive: THEME_COLORS[activeTheme].primary,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    mainGroup.add(wireMesh);

    // 3. ORBITAL PRIVACY RINGS
    const ringGroup = new THREE.Group();
    mainGroup.add(ringGroup);

    const ringCount = 3;
    const rings: THREE.Mesh[] = [];
    const ringRadii = [7.2, 8.8, 10.4];

    for (let i = 0; i < ringCount; i++) {
      const ringGeo = new THREE.TorusGeometry(ringRadii[i], 0.045, 16, 120);
      const ringMat = new THREE.MeshStandardMaterial({
        color: THEME_COLORS[activeTheme].secondary,
        emissive: THEME_COLORS[activeTheme].primary,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.65,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = (i * Math.PI) / 3.5 + 0.3;
      ring.rotation.y = (i * Math.PI) / 4.2;
      ringGroup.add(ring);
      rings.push(ring);

      // Add orbiting node satellite beads on the rings
      const satCount = 4 + i * 2;
      for (let s = 0; s < satCount; s++) {
        const satGeo = new THREE.SphereGeometry(0.18 + Math.random() * 0.1, 16, 16);
        const satMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: THEME_COLORS[activeTheme].primary,
          emissiveIntensity: 1.2,
        });
        const sat = new THREE.Mesh(satGeo, satMat);
        const angle = (s / satCount) * Math.PI * 2;
        sat.position.set(
          Math.cos(angle) * ringRadii[i],
          Math.sin(angle) * ringRadii[i],
          0
        );
        ring.add(sat);
      }
    }

    // 4. FLOATING DATA STAR DUST / PARTICLES
    const particleCount = 950;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Distribute in a spherical cloud around the core
      const radius = 6 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      scales[i] = Math.random() * 2.5 + 0.5;
    }

    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeo.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

    // Custom circular particle texture
    const pCanvas = document.createElement("canvas");
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext("2d");
    if (pCtx) {
      const gradient = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.3, "rgba(56, 189, 248, 0.8)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      pCtx.fillStyle = gradient;
      pCtx.beginPath();
      pCtx.arc(16, 16, 16, 0, Math.PI * 2);
      pCtx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: THEME_COLORS[activeTheme].particles,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 5. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(
      THEME_COLORS[activeTheme].primary,
      2.5
    );
    dirLight1.position.set(15, 12, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(
      THEME_COLORS[activeTheme].secondary,
      2.0
    );
    dirLight2.position.set(-15, -10, -8);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(
      THEME_COLORS[activeTheme].primary,
      3.5,
      35
    );
    pointLight.position.set(0, 0, 0);
    mainGroup.add(pointLight);

    // MOUSE LISTENER
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 2;
      mouseRef.current.targetY = -(e.clientY / innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // RESIZE LISTENER
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 650;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      const isDesktop = w >= 1024;
      mainGroup.position.set(isDesktop ? 5.0 : 0, isDesktop ? 0.2 : 2.0, 0);
    };

    window.addEventListener("resize", handleResize);

    // ANIMATION LOOP
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001;

      // Smooth mouse lerp
      mouseRef.current.x +=
        (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y +=
        (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Rotate elements
      coreMesh.rotation.y = elapsed * 0.15;
      coreMesh.rotation.x = elapsed * 0.08;

      wireMesh.rotation.y = -elapsed * 0.12;
      wireMesh.rotation.z = elapsed * 0.06;

      // Core pulsating scale
      const pulse = 1 + Math.sin(elapsed * 2.2) * 0.045;
      coreMesh.scale.set(pulse, pulse, pulse);

      // Rings independent rotation
      rings.forEach((ring, idx) => {
        ring.rotation.z = elapsed * (0.12 + idx * 0.06) * (idx % 2 === 0 ? 1 : -1);
      });

      // Slowly rotate particle field
      particles.rotation.y = elapsed * 0.035;
      particles.rotation.x = mouseRef.current.y * 0.15;

      // Parallax camera movement with smooth desktop focal shift
      const isDesktop = (container.clientWidth || window.innerWidth) >= 1024;
      const baseCamX = isDesktop ? 1.5 : 0;
      camera.position.x = baseCamX + mouseRef.current.x * 2.5;
      camera.position.y = 1 + mouseRef.current.y * 2.0;
      camera.lookAt(isDesktop ? 2.5 : 0, 0, 0);

      // Dynamic color interpolation if theme changed
      const currentThemeConfig =
        THEME_COLORS[themeRef.current] || THEME_COLORS.cyan;
      coreMat.color.lerp(new THREE.Color(currentThemeConfig.core), 0.05);
      coreMat.emissive.lerp(new THREE.Color(currentThemeConfig.primary), 0.05);
      wireMat.color.lerp(new THREE.Color(currentThemeConfig.primary), 0.05);
      wireMat.emissive.lerp(new THREE.Color(currentThemeConfig.primary), 0.05);
      particleMat.color.lerp(
        new THREE.Color(currentThemeConfig.particles),
        0.05
      );
      dirLight1.color.lerp(new THREE.Color(currentThemeConfig.primary), 0.05);
      dirLight2.color.lerp(new THREE.Color(currentThemeConfig.secondary), 0.05);
      pointLight.color.lerp(new THREE.Color(currentThemeConfig.primary), 0.05);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      // Clean up Three.js objects
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTexture.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeTheme]);

  if (!webGLSupported) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-indigo-950/80 ${className}`}
      >
        <div className="text-center p-8 text-cyan-400">
          <div className="w-48 h-48 rounded-full border border-cyan-500/30 animate-pulse mx-auto flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-cyan-400/60 flex items-center justify-center">
              <span className="text-xs uppercase tracking-widest text-cyan-300">
                Local Sandbox
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}
