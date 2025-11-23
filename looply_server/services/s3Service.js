import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getS3Bucket } from "../config/aws.js";
import fs from "fs";

/**
 * Upload video to S3 as private
 * @param {string} filePath - Local file path
 * @param {string} keyName - S3 object key (e.g., userId/videoId.mp4)
 * @returns {Promise<string>} - S3 key name
 */
export async function uploadVideoToS3(filePath, keyName) {
  const s3Client = getS3Client();
  
  // Check if S3 client is available
  if (!s3Client) {
    console.warn("⚠️  S3 client is not configured. Skipping S3 upload.");
    console.warn("   To enable S3 upload, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment variables.");
    return null; // Return null instead of throwing error
  }

  // Log that we're using S3
  console.log(`📤 Uploading to S3: ${keyName}`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}. Skipping S3 upload.`);
    return null; // Return null instead of throwing error
  }

  try {
    const fileStream = fs.createReadStream(filePath);
    const bucketName = getS3Bucket();
    
    const uploadParams = {
      Bucket: bucketName,
      Key: keyName,
      Body: fileStream,
      ContentType: "video/mp4",
      // No ACL specified - defaults to private
    };

    console.log(`📦 Using S3 Bucket: ${bucketName}`);
    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`✅ Video uploaded to S3: ${keyName}`);
    return keyName;
  } catch (error) {
    console.error("❌ Error uploading video to S3:", error.message || error);
    if (error.message?.includes("bucket does not exist")) {
      console.error(`   Please verify bucket name: ${getS3Bucket()}`);
      console.error(`   And region: ${process.env.AWS_REGION || "ap-southeast-2"}`);
    }
    // Don't throw - let caller handle gracefully
    return null;
  }
}

/**
 * Get presigned URL for private S3 object
 * @param {string} keyName - S3 object key
 * @param {number} expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} - Presigned URL
 */
export async function getPresignedUrl(keyName, expiresIn = 3600) {
  const s3Client = getS3Client();
  
  if (!s3Client) {
    console.warn("⚠️  S3 client is not configured. Cannot generate presigned URL.");
    return null;
  }

  try {
    const bucketName = getS3Bucket();
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: keyName,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return null; // Return null instead of throwing
  }
}

/**
 * Delete video from S3
 * @param {string} keyName - S3 object key
 * @returns {Promise<void>}
 */
export async function deleteVideoFromS3(keyName) {
  const s3Client = getS3Client();
  
  if (!s3Client) {
    console.warn("S3 client is not configured. Skipping S3 deletion.");
    return;
  }

  try {
    const bucketName = getS3Bucket();
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: keyName,
    });

    await s3Client.send(command);
    console.log(`Video deleted from S3: ${keyName}`);
  } catch (error) {
    console.error("Error deleting video from S3:", error);
    throw error;
  }
}



