import Image3DViewerWrapper from "@/components/Image3DViewerWrapper";

export default function Home() {
  // Sử dụng các hình ảnh đã tối ưu hóa
  const imageUrls = [
    "/optimized/sample-image.webp",
    "/optimized/sample-image1.webp",
    "/optimized/sample-image2.webp",
    "/optimized/sample-image3.webp"
  ];

  return (
    <div className="w-full h-screen">
      <Image3DViewerWrapper imageUrls={imageUrls} />
    </div>
  );
}
