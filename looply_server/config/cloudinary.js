import { v2 as cloudinary } from 'cloudinary';

// Hàm khởi tạo config (gọi khi cần)
export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
  });
  return cloudinary;
};

export default cloudinary;
