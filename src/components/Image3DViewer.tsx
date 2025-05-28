"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useCursor, useTexture, Loader, Html } from "@react-three/drei";
import * as THREE from "three";
import { getOptimizedImageUrl } from "@/utils/imageOptimizer";
import { Suspense } from "react";
import randomPoints from "@/data/random_points.json";
import LazyImage from "@/components/LazyImage";
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// Interface cho dữ liệu điểm từ JSON
interface Point {
  x: number;
  y: number;
}

interface PointsData {
  points: Point[];
}

interface Image3DViewerProps {
  imageUrls: string[];
}

// Interface cho sự kiện Three.js mở rộng
interface ThreePointerEvent extends THREE.Event {
  point: THREE.Vector3;
  stopPropagation: () => void;
}

// Component OrbitControls tùy chỉnh để giới hạn xoay
const CustomOrbitControls = () => {
  // Sử dụng any để tránh vấn đề type từ three.js
  const controlsRef = useRef(null);
  
  // Giới hạn góc xoay và đổi tính năng chuột
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current as unknown as OrbitControlsImpl;
      
      // Giới hạn góc xoay theo trục X (vertical rotation)
      controls.minPolarAngle = Math.PI / 3; // 30 độ từ trên xuống
      controls.maxPolarAngle = Math.PI / 1.2; // 90 độ (horizontal)
      
      // Giới hạn góc xoay theo trục Y (horizontal rotation)
      controls.minAzimuthAngle = -Math.PI / 3; // -60 độ
      controls.maxAzimuthAngle = Math.PI / 3; // +60 độ
      
      // Đổi tính năng chuột
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
      };
    }
  }, []);
  
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableRotate={true}
      enableZoom={true}
      panSpeed={0.8}
      rotateSpeed={0.8}
      zoomSpeed={0.8}
      minDistance={5}
      maxDistance={50}
    />
  );
};

// Tạo image loader có cache
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = "anonymous";

// Component hiển thị điểm ảnh nhỏ
const PointImage = ({ position, imageUrl, index }: { 
  position: [number, number, number];
  imageUrl: string;
  index: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  
  // Sử dụng URL đã tối ưu hóa
  const optimizedUrl = useMemo(() => getOptimizedImageUrl(imageUrl), [imageUrl]);
  
  // Sử dụng texture chất lượng thấp cho điểm ảnh nhỏ
  const texture = useTexture(optimizedUrl, (texture) => {
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    texture.anisotropy = 1;
  });

  useCursor(hovered);

  // Hiệu ứng hover
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.2 : 1;
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1);
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.1);
    }
  });

  // Xử lý sự kiện hover
  const handlePointerOver = useCallback((e: ThreePointerEvent) => {
    e.stopPropagation();
    setHovered(true);
    setShowPopup(true);
  }, []);
  
  // Xử lý sự kiện rời ra khỏi điểm ảnh
  const handlePointerOut = useCallback(() => {
    setHovered(false);
    setShowPopup(false);
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <planeGeometry args={[0.22, 0.18]} />
      <meshBasicMaterial map={texture} transparent opacity={0.9} />
      {showPopup && (
        <Html
          position={[0, 0, 0.1]}
          style={{
            pointerEvents: "none",
            width: "500px",
            height: "300px",
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
            zIndex: 1000,
            transform: "translate(-50%, -100%)",
          }}
          distanceFactor={10}
          center
          // Hiển thị popup ngay phía trên điểm ảnh
          portal={{ current: document.body }}
        >
          <div className="relative w-full h-full overflow-hidden rounded-md">
            <div className="absolute inset-0">
              <LazyImage
                src={optimizedUrl}
                alt={`Ảnh chi tiết ${index}`}
                width={500}
                height={500}
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute bottom-2 left-2 right-2 px-3 py-1 bg-black/50 text-white text-sm rounded-md">
              Ảnh {index + 1}
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
};

// Component hiển thị tất cả các điểm ảnh
const PointsCloud = ({ imageUrls }: { imageUrls: string[] }) => {
  const [pointsData, setPointsData] = useState<Point[]>([]);
  
  // Tải dữ liệu điểm từ file JSON
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const response = await fetch('/api/points');
        const data = await response.json() as PointsData;
        setPointsData(data.points);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu điểm API:', error);
        
        // Fallback: sử dụng dữ liệu từ file đã import
        setPointsData(randomPoints.points);
      }
    };
    
    fetchPoints();
  }, []);

  // Chuyển đổi tọa độ điểm sang không gian 3D
  const points = useMemo(() => {
    if (!pointsData.length) return [];
    
    // Tính toán giới hạn tọa độ để căn chỉnh vào không gian 3D
    const xValues = pointsData.map(p => p.x);
    const yValues = pointsData.map(p => p.y);
    
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Tỷ lệ để chuyển đổi tọa độ sang không gian 3D (-10 đến 10)
    const scaleX = 20 / width;
    const scaleY = 20 / height;
    
    return pointsData.map(point => {
      const normalizedX = (point.x - minX) * scaleX - 10;
      const normalizedY = 10 - (point.y - minY) * scaleY; // Đảo ngược trục Y
      
      return {
        position: [normalizedX, normalizedY, 0] as [number, number, number],
        originalPoint: point
      };
    });
  }, [pointsData]);


  return (
    <group>
      {points.map((point, index) => (
        <PointImage
          key={index}
          position={point.position}
          imageUrl={imageUrls[index % imageUrls.length]}
          index={index}
        />
      ))}
    </group>
  );
};

// Fallback component khi đang tải
// const LoadingFallback = () => {
//   return (
//     <group>
//       <mesh position={[0, 0, 0]}>
//         <boxGeometry args={[5, 5, 0.1]} />
//         <meshStandardMaterial color="gray" />
//       </mesh>
//     </group>
//   );
// };

const Image3DViewer = ({ imageUrls }: Image3DViewerProps) => {
  return (
    <div className="w-full h-full">
      <Canvas 
        camera={{ position: [0, 0, 25], fov: 50 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{ 
          antialias: false,
          powerPreference: 'high-performance', 
          alpha: false, 
          depth: true 
        }}
      >
        <color attach="background" args={['#f0f0f0']} />
        <ambientLight intensity={0.5} />
        <Suspense>
          <PointsCloud imageUrls={imageUrls} />
        </Suspense>
        <CustomOrbitControls />
      </Canvas>
      <Loader />
    </div>
  );
};

export default Image3DViewer; 