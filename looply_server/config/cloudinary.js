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

/**
 * Make video public in Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Cloudinary response
 */
export async function makeVideoPublic(publicId) {
  try {
    configureCloudinary();
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      resource_type: 'video',
      access_mode: 'public',
    });
    return result;
  } catch (error) {
    console.error('Error making video public:', error);
    throw error;
  }
}

/**
 * Make video private in Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Cloudinary response
 */
export async function makeVideoPrivate(publicId) {
  try {
    configureCloudinary();
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      resource_type: 'video',
      access_mode: 'authenticated',
    });
    return result;
  } catch (error) {
    console.error('Error making video private:', error);
    throw error;
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null if not a Cloudinary URL
 */
export function getPublicIdFromUrl(url) {
  if (!url) return null;
  
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
}

export default cloudinary;
