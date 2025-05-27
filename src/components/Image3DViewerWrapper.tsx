"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { preloadImages } from "@/utils/imageOptimizer";

// Sử dụng dynamic import với loading suspense
const Image3DViewer = dynamic(() => import("@/components/Image3DViewer"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4">Đang tải trình xem 3D...</p>
      </div>
    </div>
  ),
  ssr: false,
});

interface Image3DViewerWrapperProps {
  imageUrls: string[];
}

export default function Image3DViewerWrapper({ imageUrls }: Image3DViewerWrapperProps) {
  // Preload images khi component mount để cải thiện hiệu suất
  useEffect(() => {
    // Preload tất cả hình ảnh để chuẩn bị trước khi render
    preloadImages(imageUrls);
  }, [imageUrls]);

  return <Image3DViewer imageUrls={imageUrls} />;
} 