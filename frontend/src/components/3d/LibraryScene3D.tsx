import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LibraryScene3DProps {
  enableFireplace?: boolean;
  enableWind?: boolean;
}

export const LibraryScene3D: React.FC<LibraryScene3DProps> = ({
  enableFireplace = true,
  enableWind = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x2a1810, 10, 50);
    scene.background = new THREE.Color(0x1a0f08);

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 1, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting - Warm ambient light
    const ambientLight = new THREE.AmbientLight(0xffa040, 0.3);
    scene.add(ambientLight);

    // Fireplace light (warm orange glow)
    const fireplaceLight = new THREE.PointLight(0xff6600, 2, 15);
    fireplaceLight.position.set(-4, 1.5, -2);
    fireplaceLight.castShadow = true;
    scene.add(fireplaceLight);

    // Secondary fireplace glow
    const fireplaceGlow = new THREE.PointLight(0xff8822, 1.5, 10);
    fireplaceGlow.position.set(-4, 0.5, -1.5);
    scene.add(fireplaceGlow);

    // Candle lights scattered around
    const candleLight1 = new THREE.PointLight(0xffaa44, 0.8, 8);
    candleLight1.position.set(3, 2, -1);
    scene.add(candleLight1);

    const candleLight2 = new THREE.PointLight(0xffaa44, 0.6, 6);
    candleLight2.position.set(-2, 2.5, 2);
    scene.add(candleLight2);

    // Directional light for subtle fill
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Fireplace structure
    const fireplaceGroup = new THREE.Group();
    fireplaceGroup.position.set(-4, 0, -3);

    // Fireplace base
    const fireplaceBaseGeo = new THREE.BoxGeometry(3, 1.5, 0.8);
    const fireplaceMat = new THREE.MeshStandardMaterial({
      color: 0x4a3020,
      roughness: 0.9
    });
    const fireplaceBase = new THREE.Mesh(fireplaceBaseGeo, fireplaceMat);
    fireplaceBase.position.y = 0.75;
    fireplaceBase.castShadow = true;
    fireplaceGroup.add(fireplaceBase);

    // Fire particles
    const fireParticlesGeo = new THREE.BufferGeometry();
    const fireParticleCount = 50;
    const firePositions = new Float32Array(fireParticleCount * 3);
    const fireVelocities: number[] = [];

    for (let i = 0; i < fireParticleCount * 3; i += 3) {
      firePositions[i] = (Math.random() - 0.5) * 1.2;
      firePositions[i + 1] = Math.random() * 0.5;
      firePositions[i + 2] = (Math.random() - 0.5) * 0.4;
      fireVelocities.push((Math.random() - 0.5) * 0.02, Math.random() * 0.05 + 0.02, (Math.random() - 0.5) * 0.02);
    }

    fireParticlesGeo.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));

    const fireParticleMat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const fireParticles = new THREE.Points(fireParticlesGeo, fireParticleMat);
    fireParticles.position.set(-4, 1.2, -2.5);
    scene.add(fireParticles);

    // Books floating/scattered
    const bookGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.05);
    const bookColors = [0x8B4513, 0x654321, 0x4a3520, 0x6b4423, 0x7d5c3d];
    const books: THREE.Mesh[] = [];

    for (let i = 0; i < 15; i++) {
      const bookMat = new THREE.MeshStandardMaterial({
        color: bookColors[Math.floor(Math.random() * bookColors.length)],
        roughness: 0.7,
        metalness: 0.1
      });
      const book = new THREE.Mesh(bookGeometry, bookMat);
      book.position.set(
        (Math.random() - 0.5) * 12,
        Math.random() * 0.3 + 0.2,
        (Math.random() - 0.5) * 8
      );
      book.rotation.y = Math.random() * Math.PI;
      book.castShadow = true;
      book.userData.floatSpeed = Math.random() * 0.5 + 0.5;
      book.userData.floatOffset = Math.random() * Math.PI * 2;
      books.push(book);
      scene.add(book);
    }

    // Bookshelves
    const shelfGroup = new THREE.Group();
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.8 });
    
    // Left bookshelf
    const leftShelf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 2), shelfMat);
    leftShelf.position.set(-6, 2, -2);
    leftShelf.castShadow = true;
    scene.add(leftShelf);

    // Right bookshelf
    const rightShelf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 2), shelfMat);
    rightShelf.position.set(6, 2, 0);
    rightShelf.castShadow = true;
    scene.add(rightShelf);

    // Wind particles (dust/paper)
    const windParticlesGeo = new THREE.BufferGeometry();
    const windParticleCount = 80;
    const windPositions = new Float32Array(windParticleCount * 3);
    const windVelocities: number[] = [];

    for (let i = 0; i < windParticleCount * 3; i += 3) {
      windPositions[i] = (Math.random() - 0.5) * 30;
      windPositions[i + 1] = Math.random() * 8;
      windPositions[i + 2] = (Math.random() - 0.5) * 30;
      windVelocities.push(Math.random() * 0.02 - 0.01, Math.random() * 0.01 - 0.005, Math.random() * 0.02 - 0.01);
    }

    windParticlesGeo.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));

    const windParticleMat = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.08,
      transparent: true,
      opacity: 0.4
    });

    const windParticles = new THREE.Points(windParticlesGeo, windParticleMat);
    scene.add(windParticles);

    // Reading chair
    const chairGroup = new THREE.Group();
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x5d4330, roughness: 0.7 });
    
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1), chairMat);
    chairSeat.position.y = 0.8;
    chairSeat.castShadow = true;
    chairGroup.add(chairSeat);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.2), chairMat);
    chairBack.position.set(0, 1.5, -0.4);
    chairBack.castShadow = true;
    chairGroup.add(chairBack);

    chairGroup.position.set(-2, 0, 0);
    chairGroup.rotation.y = Math.PI / 6;
    scene.add(chairGroup);

    // Animation loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.016;

      // Animate fireplace light (flickering)
      if (enableFireplace) {
        fireplaceLight.intensity = 2 + Math.sin(time * 8) * 0.3 + Math.random() * 0.2;
        fireplaceGlow.intensity = 1.5 + Math.sin(time * 5) * 0.2;

        // Animate fire particles
        const firePos = fireParticlesGeo.getAttribute('position').array as Float32Array;
        for (let i = 0; i < fireParticleCount * 3; i += 3) {
          firePos[i] += fireVelocities[i];
          firePos[i + 1] += fireVelocities[i + 1];
          firePos[i + 2] += fireVelocities[i + 2];

          if (firePos[i + 1] > 2) {
            firePos[i] = (Math.random() - 0.5) * 1.2;
            firePos[i + 1] = 0;
            firePos[i + 2] = (Math.random() - 0.5) * 0.4;
          }
        }
        (fireParticlesGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      }

      // Animate candles (subtle flicker)
      candleLight1.intensity = 0.8 + Math.sin(time * 6) * 0.1;
      candleLight2.intensity = 0.6 + Math.sin(time * 7) * 0.08;

      // Animate wind particles
      if (enableWind) {
        const windPos = windParticlesGeo.getAttribute('position').array as Float32Array;
        for (let i = 0; i < windParticleCount * 3; i += 3) {
          windPos[i] += windVelocities[i];
          windPos[i + 1] += windVelocities[i + 1];
          windPos[i + 2] += windVelocities[i + 2];

          if (windPos[i] > 15) windPos[i] = -15;
          if (windPos[i] < -15) windPos[i] = 15;
          if (windPos[i + 1] > 8) windPos[i + 1] = 0;
          if (windPos[i + 1] < 0) windPos[i + 1] = 8;
          if (windPos[i + 2] > 15) windPos[i + 2] = -15;
          if (windPos[i + 2] < -15) windPos[i + 2] = 15;
        }
        (windParticlesGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      }

      // Animate floating books
      books.forEach((book) => {
        book.position.y = 0.2 + Math.sin(time * book.userData.floatSpeed + book.userData.floatOffset) * 0.1;
        book.rotation.y += 0.002;
      });

      // Camera subtle movement
      camera.position.x = Math.sin(time * 0.1) * 0.3;
      camera.position.y = 2 + Math.sin(time * 0.15) * 0.2;
      camera.lookAt(0, 1.5, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      // Dispose geometries and materials
      floorGeometry.dispose();
      floorMaterial.dispose();
      fireplaceBaseGeo.dispose();
      fireplaceMat.dispose();
      fireParticlesGeo.dispose();
      fireParticleMat.dispose();
      bookGeometry.dispose();
      windParticlesGeo.dispose();
      windParticleMat.dispose();
      shelfMat.dispose();
      chairMat.dispose();
      
      books.forEach(book => {
        if (book.material instanceof THREE.Material) book.material.dispose();
      });
      
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [enableFireplace, enableWind]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'linear-gradient(135deg, #1a0f08 0%, #2a1810 100%)' }}
    />
  );
};
