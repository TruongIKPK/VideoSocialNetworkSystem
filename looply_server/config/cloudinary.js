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

/**
 * Make thumbnail (derived asset) public in Cloudinary
 * @param {string} thumbnailUrl - Cloudinary thumbnail URL from eager transformation
 * @returns {Promise<string>} - Public thumbnail URL
 */
export async function makeThumbnailPublic(thumbnailUrl) {
  try {
    configureCloudinary();
    
    // Extract public ID from thumbnail URL
    const thumbnailPublicId = getPublicIdFromUrl(thumbnailUrl);
    if (!thumbnailPublicId) {
      console.warn('[makeThumbnailPublic] Could not extract public ID from thumbnail URL');
      return thumbnailUrl;
    }

    // Make thumbnail public using explicit API
    const result = await cloudinary.uploader.explicit(thumbnailPublicId, {
      type: 'upload',
      resource_type: 'image',
      access_mode: 'public',
    });

    // Return the public URL
    return result.secure_url || thumbnailUrl;
  } catch (error) {
    console.error('Error making thumbnail public:', error);
    // Return original URL as fallback
    return thumbnailUrl;
  }
}

/**
 * Generate thumbnail URL from video URL using Cloudinary transformation
 * This creates a dynamic thumbnail URL without storing a separate file
 * @param {string} videoUrl - Cloudinary video URL
 * @param {string} publicId - Cloudinary public ID (optional, will be extracted from URL if not provided)
 * @param {Object} options - Transformation options
 * @param {number} options.width - Thumbnail width (default: 320)
 * @param {number} options.height - Thumbnail height (default: 240)
 * @param {number} options.offset - Time offset in seconds to capture frame (default: 1, takes frame at 1 second)
 * @returns {string} - Thumbnail URL
 */
export function generateThumbnailUrl(videoUrl, publicId = null, options = {}) {
  if (!videoUrl) return null;

  try {
    configureCloudinary();
    
    // Extract public ID from URL if not provided
    const videoPublicId = publicId || getPublicIdFromUrl(videoUrl);
    if (!videoPublicId) {
      // If not a Cloudinary URL, return null or fallback
      return null;
    }

    const {
      width = 320,
      height = 240,
      offset = 1, // Capture frame at 1 second
    } = options;

    // Generate thumbnail URL using Cloudinary transformation
    // Transformation: w_320,h_240,c_fill,q_auto,f_jpg,so_1
    // - w_320, h_240: width and height
    // - c_fill: crop mode fill
    // - q_auto: automatic quality
    // - f_jpg: format JPEG
    // - so_1: start offset 1 second (capture frame at 1 second)
    const thumbnailUrl = cloudinary.url(videoPublicId, {
      resource_type: 'video',
      transformation: [
        {
          width: width,
          height: height,
          crop: 'fill',
          quality: 'auto',
          format: 'jpg',
          start_offset: offset,
        }
      ]
    });

    return thumbnailUrl;
  } catch (error) {
    console.error('Error generating thumbnail URL:', error);
    // Fallback: return null or original video URL
    return null;
  }
}

export default cloudinary;
