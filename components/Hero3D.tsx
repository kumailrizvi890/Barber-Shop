"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// A slowly rotating faceted gold gem — fits "Fade Kings" without borrowing
// anyone else's Spline scene. Mouse position gives a subtle camera-orbit
// parallax; the gem itself keeps spinning on its own regardless.
export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1.9, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.22,
      flatShading: true,
    });
    const gem = new THREE.Mesh(geometry, material);
    scene.add(gem);

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0xf5f5f0, transparent: true, opacity: 0.18 })
    );
    gem.add(wire);

    scene.add(new THREE.AmbientLight(0x3a3a3a, 1.4));
    const keyLight = new THREE.PointLight(0xffffff, 55, 20);
    keyLight.position.set(4, 4, 5);
    scene.add(keyLight);
    const goldLight = new THREE.PointLight(0xd4af37, 45, 20);
    goldLight.position.set(-4, -2.5, 3);
    scene.add(goldLight);
    const rimLight = new THREE.PointLight(0xffffff, 20, 20);
    rimLight.position.set(0, -4, -4);
    scene.add(rimLight);

    let mouseX = 0;
    let mouseY = 0;
    function onMove(e: MouseEvent) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener("mousemove", onMove);

    function resize() {
      const { clientWidth: w, clientHeight: h } = container!;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf = 0;
    function animate() {
      gem.rotation.y += 0.0045;
      gem.rotation.x += 0.0016;

      camera.position.x += (mouseX * 0.7 - camera.position.x) * 0.025;
      camera.position.y += (-mouseY * 0.7 - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      wire.geometry.dispose();
      (wire.material as THREE.Material).dispose();
      renderer.dispose();
      container!.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
