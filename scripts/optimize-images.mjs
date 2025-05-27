// Script để tối ưu hóa hình ảnh trong thư mục public
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Lấy đường dẫn hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../public');

// Kích thước tối ưu (bội số của 2)
const TARGET_WIDTH = 1024;

// Định dạng hỗ trợ
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png'];

// Tạo thư mục tối ưu nếu chưa tồn tại
const optimizedDir = path.join(publicDir, 'optimized');
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir);
}

// Duyệt qua tất cả các file trong thư mục public
async function optimizeImages() {
  try {
    const files = fs.readdirSync(publicDir);
    
    console.log('Bắt đầu tối ưu hóa hình ảnh...');
    
    for (const file of files) {
      const filePath = path.join(publicDir, file);
      const ext = path.extname(file).toLowerCase();
      
      // Kiểm tra nếu là file ảnh
      if (SUPPORTED_FORMATS.includes(ext) && fs.statSync(filePath).isFile()) {
        const filename = path.parse(file).name;
        const outputPath = path.join(optimizedDir, `${filename}.webp`);
        
        console.log(`Đang tối ưu: ${file}`);
        
        await sharp(filePath)
          .resize({
            width: TARGET_WIDTH,
            withoutEnlargement: true,
            fit: sharp.fit.inside
          })
          .webp({ quality: 80 })
          .toFile(outputPath);
          
        console.log(`  -> Đã tạo: optimized/${filename}.webp`);
      }
    }
    
    console.log('Hoàn tất tối ưu hóa hình ảnh!');
    
  } catch (error) {
    console.error('Lỗi khi tối ưu hóa hình ảnh:', error);
  }
}

// Chạy tiện ích tối ưu hóa
optimizeImages(); 