import { S3Client } from "@aws-sdk/client-s3";
import { RekognitionClient } from "@aws-sdk/client-rekognition";

// Lazy initialization - clients will be created when first accessed
let _s3Client = null;
let _rekognitionClient = null;
let _initialized = false;

function initializeAwsClients() {
  if (_initialized) return;

  // Validate AWS credentials
  const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_REGION || "ap-southeast-2";
  const awsS3Bucket = process.env.AWS_S3_BUCKET || "bookstore-s3s";

  // Debug: Log environment variables status
  if (process.env.NODE_ENV !== 'production') {
    console.log("🔍 AWS Environment Variables Check:");
    console.log(`   AWS_ACCESS_KEY_ID: ${awsAccessKeyId ? `Set (${awsAccessKeyId.substring(0, 8)}...)` : 'NOT SET'}`);
    console.log(`   AWS_SECRET_ACCESS_KEY: ${awsSecretAccessKey ? 'Set (hidden)' : 'NOT SET'}`);
    console.log(`   AWS_REGION: ${awsRegion}`);
    console.log(`   AWS_S3_BUCKET: ${awsS3Bucket}`);
  }

  const hasValidCredentials = awsAccessKeyId && awsSecretAccessKey;

  // Log AWS configuration status
  if (hasValidCredentials) {
    console.log("✅ AWS credentials loaded successfully");
    console.log(`   Region: ${awsRegion}`);
    console.log(`   S3 Bucket: ${awsS3Bucket}`);
    console.log(`   Access Key ID: ${awsAccessKeyId.substring(0, 8)}... (hidden for security)`);
    
    // Initialize clients
    _s3Client = new S3Client({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });

    _rekognitionClient = new RekognitionClient({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });
  } else {
    console.warn("⚠️  AWS credentials not configured. S3 and Rekognition features will be disabled.");
    console.warn("   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment variables.");
  }

  _initialized = true;
}

// Getter functions for lazy initialization
export function getS3Client() {
  initializeAwsClients();
  return _s3Client;
}

export function getRekognitionClient() {
  initializeAwsClients();
  return _rekognitionClient;
}

// For backward compatibility - export getters that return the client
export const s3Client = {
  get send() {
    const client = getS3Client();
    return client ? client.send.bind(client) : undefined;
  }
};

export const rekognitionClient = {
  get send() {
    const client = getRekognitionClient();
    return client ? client.send.bind(client) : undefined;
  }
};

// S3 Bucket name - will be read from env when first accessed
export function getS3Bucket() {
  return process.env.AWS_S3_BUCKET || "bookstore-s3s";
}

// Export as getter to ensure it reads from env at runtime
export const S3_BUCKET = getS3Bucket();



