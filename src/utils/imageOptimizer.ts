/**
 * Tiện ích tối ưu hóa hình ảnh cho ứng dụng 3D
 */

import { StaticImageData } from "next/image";

// Cache cho hình ảnh đã tối ưu
const optimizedImageCache = new Map<string, string>();

/**
 * Tạo URL cho hình ảnh đã tối ưu với các tham số
 */
export const getOptimizedImageUrl = (url: string): string => {
  // Nếu hình ảnh đã được tối ưu và lưu trong cache, trả về URL đã cache
  if (optimizedImageCache.has(url)) {
    return optimizedImageCache.get(url)!;
  }

  // Kiểm tra nếu đây là hình ảnh trên hệ thống hoặc URL ngoài
  const isExternalUrl = url.startsWith('http');
  
  if (isExternalUrl) {
    // Nếu là URL ngoài, thêm tham số để tối ưu hình ảnh thông qua CDN hoặc service
    // Ví dụ: https://images.weserv.nl/ là một dịch vụ resize và tối ưu hình ảnh
    const optimizedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=512&output=webp&q=70`;
    optimizedImageCache.set(url, optimizedUrl);
    return optimizedUrl;
  } else {
    // Nếu là hình ảnh local, sử dụng Next.js Image API
    // Không cần thay đổi URL vì Image3DViewer sẽ tải trực tiếp
    optimizedImageCache.set(url, url);
    return url;
  }
};

/**
 * Tìm kích thước tối ưu cho texture dựa trên GPU
 * WebGL thường hoạt động tốt nhất với kích thước là bội số của 2
 */
export const findOptimalTextureSize = (originalSize: number): number => {
  // Tìm kích thước là bội số của 2 gần với kích thước gốc nhất
  const sizes = [256, 512, 1024, 2048];
  
  // Tìm kích thước phù hợp nhất, không lớn hơn 1024 để đảm bảo hiệu suất
  for (const size of sizes) {
    if (originalSize <= size || size === 1024) {
      return size;
    }
  }
  
  return 1024; // Mặc định cho các hình ảnh lớn
};

/**
 * Tải trước nhiều hình ảnh để cải thiện hiệu suất
 */
export const preloadImages = (urls: string[]): void => {
  urls.forEach(url => {
    const img = new Image();
    img.src = getOptimizedImageUrl(url);
  });
}; 