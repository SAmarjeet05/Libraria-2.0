import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LuxuryLibrarySceneProps {
  className?: string;
}

export const LuxuryLibraryScene: React.FC<LuxuryLibrarySceneProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const booksRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x1a1410, 0.1);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    camera.position.set(0, 2, 8);
    camera.lookAt(0, 1, 0);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Lighting - warm golden tones
    const ambientLight = new THREE.AmbientLight(0xd4a574, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffc966, 0.8, 20);
    pointLight1.position.set(5, 4, 5);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffa500, 0.6, 20);
    pointLight2.position.set(-5, 3, -5);
    pointLight2.castShadow = true;
    scene.add(pointLight2);

    const directionalLight = new THREE.DirectionalLight(0xfff0e6, 0.4);
    directionalLight.position.set(0, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create floating books
    const bookMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.4,
      metalness: 0.2,
    });

    const books: THREE.Mesh[] = [];
    const bookPositions = [
      { x: -3, y: 1, z: -2 },
      { x: -1, y: 1.5, z: -3 },
      { x: 1, y: 0.8, z: -2 },
      { x: 3, y: 1.2, z: -3 },
      { x: 0, y: 2, z: -4 },
      { x: -2, y: 0.5, z: -1 },
      { x: 2, y: 1.8, z: -1.5 },
    ];

    bookPositions.forEach((pos, _idx) => {
      const bookGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.1);
      const book = new THREE.Mesh(bookGeometry, bookMaterial.clone());
      book.position.set(pos.x, pos.y, pos.z);
      book.rotation.set(
        Math.random() * 0.5 - 0.25,
        Math.random() * 0.8 - 0.4,
        Math.random() * 0.3 - 0.15
      );
      book.castShadow = true;
      book.receiveShadow = true;
      (book.userData as any).originalY = pos.y;
      (book.userData as any).floatSpeed = 0.5 + Math.random() * 0.5;
      (book.userData as any).floatAmount = 0.3 + Math.random() * 0.2;
      (book.userData as any).rotationSpeed = 0.005 + Math.random() * 0.003;
      scene.add(book);
      books.push(book);
    });
    booksRef.current = books;

    // Create particles (dust/light particles)
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 15;
      particlePositions[i * 3 + 1] = Math.random() * 8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      particleSpeeds[i] = 0.01 + Math.random() * 0.02;
    }

    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffc966,
      size: 0.1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Store particle speeds in userData
    (particles.userData as any).speeds = particleSpeeds;

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Animate books
      books.forEach((book) => {
        const userData = book.userData as any;
        userData.time = (userData.time || 0) + 0.016;
        
        // Floating motion
        book.position.y =
          userData.originalY + Math.sin(userData.time * userData.floatSpeed) * userData.floatAmount;
        
        // Subtle rotation
        book.rotation.x += userData.rotationSpeed * 0.5;
        book.rotation.y += userData.rotationSpeed;
      });

      // Animate particles
      if (particles) {
        const positions = (particleGeometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        const speeds = (particles.userData as any).speeds;

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] -= speeds[i];

          // Reset particle if it goes below camera
          if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 8;
          }
        }

        (particleGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }

      // Gentle camera rotation
      const time = Date.now() * 0.0001;
      camera.position.x = Math.sin(time * 0.5) * 2;
      camera.position.z = 8 + Math.cos(time * 0.3) * 1;
      camera.lookAt(0, 1, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      bookMaterial.dispose();
      particleMaterial.dispose();
      bookPositions.forEach(() => {
        const book = books.shift();
        if (book) {
          book.geometry.dispose();
        }
      });
      particleGeometry.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full absolute inset-0 ${className}`}
      style={{ background: 'radial-gradient(ellipse at center, #2a1f1a 0%, #0f0a08 100%)' }}
    />
  );
};
