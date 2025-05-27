"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useCursor, useTexture, Loader } from "@react-three/drei";
import * as THREE from "three";
import { getOptimizedImageUrl, preloadImages } from "@/utils/imageOptimizer";
import { Suspense } from "react";

interface Image3DViewerProps {
  imageUrls: string[];
}

// Tạo image loader có cache
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = "anonymous";

const ImageFrame = ({ url, position, index, onClick, isClicked, isHovered }: { 
  url: string;
  position: [number, number, number];
  index: number;
  onClick: (index: number) => void;
  isClicked: boolean;
  isHovered: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Sử dụng URL đã tối ưu hóa
  const optimizedUrl = useMemo(() => getOptimizedImageUrl(url), [url]);
  
  // Sử dụng useTexture để load và cache texture
  const texture = useTexture(optimizedUrl, (texture) => {
    // Tối ưu hóa texture sau khi tải
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    texture.anisotropy = 1; // Giảm anisotropy filtering để tăng hiệu suất
  });

  // Cập nhật scale dựa trên trạng thái, sử dụng useFrame để animation mượt hơn
  useFrame((state) => {
    if (meshRef.current) {
      const targetScaleX = isClicked ? 1.1 : 1;
      const targetScaleY = isClicked ? 1.1 : 1;
      
      meshRef.current.scale.x = THREE.MathUtils.lerp(
        meshRef.current.scale.x,
        targetScaleX,
        0.1
      );
      meshRef.current.scale.y = THREE.MathUtils.lerp(
        meshRef.current.scale.y,
        targetScaleY,
        0.1
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default"; 
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(index);
      }}
    >
      <planeGeometry args={[8, 8]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
};

const ImageGrid = ({ imageUrls }: { imageUrls: string[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [clicked, setClicked] = useState<number | null>(null);

  useCursor(hovered !== null);

  // Tính toán vị trí của các ảnh trong lưới 2x2 chỉ một lần
  const positions = useMemo(() => {
    return imageUrls.slice(0, 4).map((_, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const spacing = 8.5;
      return [(col - 0.5) * spacing, (0.5 - row) * spacing, 0] as [number, number, number];
    });
  }, [imageUrls.length]);

  // Tạo hàm xử lý click với useCallback để tránh tạo lại hàm
  const handleClick = useCallback((index: number) => {
    setClicked((prevClicked) => (prevClicked === index ? null : index));
  }, []);

  // Preload images
  useEffect(() => {
    preloadImages(imageUrls);
  }, [imageUrls]);

  return (
    <group>
      {imageUrls.slice(0, 4).map((url, index) => (
        <ImageFrame
          key={index}
          url={url}
          position={positions[index]}
          index={index}
          onClick={handleClick}
          isClicked={clicked === index}
          isHovered={hovered === index}
        />
      ))}
    </group>
  );
};

// Fallback component khi đang tải
const LoadingFallback = () => {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 5, 0.1]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </group>
  );
};

const Image3DViewer = ({ imageUrls }: Image3DViewerProps) => {
  // Tối ưu hiệu suất render bằng cách sử dụng deferredRender và low pixel ratio
  return (
    <div className="w-full h-screen">
      <Canvas 
        camera={{ position: [0, 0, 25], fov: 50 }}
        dpr={[1, 1.5]} // Giới hạn pixel ratio để tăng hiệu suất
        performance={{ min: 0.5 }} // Tự động điều chỉnh chất lượng dựa vào FPS
        gl={{ 
          antialias: false, // Tắt antialias để tăng hiệu suất
          powerPreference: 'high-performance', 
          alpha: false, 
          depth: true 
        }}
      >
        <color attach="background" args={['#f0f0f0']} />
        <ambientLight intensity={0.5} />
        <Suspense fallback={<LoadingFallback />}>
          <ImageGrid imageUrls={imageUrls} />
        </Suspense>
        <OrbitControls
          enablePan={true}
          enableRotate={true}
          enableZoom={true}
          panSpeed={0.8}
          rotateSpeed={0.8}
          zoomSpeed={0.8}
          minDistance={5} // Giới hạn mức zoom tối thiểu
          maxDistance={50} // Giới hạn mức zoom tối đa
        />
      </Canvas>
      <Loader />
    </div>
  );
};

export default Image3DViewer; 