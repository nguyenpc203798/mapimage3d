import Image3DViewerWrapper from "@/components/Image3DViewerWrapper";

export default function Home() {
  // Danh sách URL hình ảnh để hiển thị trong bản đồ 3D
  const imageUrls = [
    "/optimized/sample-image.webp",
    "/optimized/sample-image1.webp",
    "/optimized/sample-image2.webp",
    "/optimized/sample-image3.webp",
    "/optimized/sample-image4.webp",
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Bản đồ 3D ghép ảnh</h1>
      <div className="w-full h-[90vh]">
        <Image3DViewerWrapper imageUrls={imageUrls} />
      </div>
    </main>
  );
}
