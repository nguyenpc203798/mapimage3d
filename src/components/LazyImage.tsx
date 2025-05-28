"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface LazyImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  placeholderUrl?: string;
}

/**
 * Component LazyImage với tính năng lazy loading và hiệu ứng fade-in
 */
export default function LazyImage({
  src,
  alt,
  className = "",
  placeholderUrl,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Reset trạng thái loading khi src thay đổi
  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <div className="relative overflow-hidden w-full h-full">
      {!isLoaded && (
        <div 
          className={`absolute inset-0 ${placeholderUrl ? '' : 'bg-gray-200 animate-pulse'}`}
          style={placeholderUrl ? { backgroundImage: `url(${placeholderUrl})`, backgroundSize: 'cover' } : {}}
        />
      )}
      <Image
        src={src}
        alt={alt || "Hình ảnh"}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoadingComplete={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
} 