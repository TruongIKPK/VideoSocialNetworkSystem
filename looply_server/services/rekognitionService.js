import {
  StartContentModerationCommand,
  GetContentModerationCommand,
} from "@aws-sdk/client-rekognition";
import { getRekognitionClient, getS3Bucket } from "../config/aws.js";

/**
 * Start content moderation job for video
 * @param {string} s3Key - S3 object key
 * @returns {Promise<string>} - Job ID
 */
export async function startContentModeration(s3Key) {
  const rekognitionClient = getRekognitionClient();
  
  if (!rekognitionClient) {
    throw new Error("Rekognition client is not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.");
  }

  try {
    const bucketName = getS3Bucket();
    const command = new StartContentModerationCommand({
      Video: {
        S3Object: {
          Bucket: bucketName,
          Name: s3Key,
        },
      },
      // Optional: Add notification channel for SNS
      // NotificationChannel: {
      //   SNSTopicArn: process.env.SNS_TOPIC_ARN,
      //   RoleArn: process.env.SNS_ROLE_ARN,
      // },
    });

    const response = await rekognitionClient.send(command);
    console.log(`✅ Content moderation job started: ${response.JobId}`);
    return response.JobId;
  } catch (error) {
    console.error("❌ Error starting content moderation:", error.message || error);
    throw error;
  }
}

/**
 * Get moderation job status and results
 * @param {string} jobId - Rekognition job ID
 * @returns {Promise<Object>} - Job status and results
 */
export async function getModerationJobStatus(jobId) {
  const rekognitionClient = getRekognitionClient();
  
  if (!rekognitionClient) {
    throw new Error("Rekognition client is not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.");
  }

  try {
    const command = new GetContentModerationCommand({
      JobId: jobId,
    });

    const response = await rekognitionClient.send(command);
    return {
      status: response.JobStatus,
      results: response.ModerationLabels || [],
      videoMetadata: response.VideoMetadata,
      nextToken: response.NextToken,
    };
  } catch (error) {
    console.error("Error getting moderation job status:", error.message || error);
    throw error;
  }
}

/**
 * Evaluate moderation results and determine PASS/FLAG/REJECT
 * @param {Array} moderationLabels - Array of moderation labels from Rekognition
 * @returns {Object} - { decision: 'PASS'|'FLAG'|'REJECT', confidence: number, reasons: Array }
 */
export function evaluateModerationResults(moderationLabels) {
  if (!moderationLabels || moderationLabels.length === 0) {
    return {
      decision: "PASS",
      confidence: 1.0,
      reasons: [],
    };
  }

  // Thresholds for moderation
  const REJECT_THRESHOLD = 0.8; // High confidence violations
  const FLAG_THRESHOLD = 0.5; // Medium confidence - needs review

  // Categories that should trigger rejection
  const REJECT_CATEGORIES = [
    "Explicit Nudity",
    "Violence",
    "Visually Disturbing",
    "Rude Gestures",
  ];

  // Categories that should trigger flagging
  const FLAG_CATEGORIES = [
    "Suggestive",
    "Hate Symbols",
    "Gambling",
    "Drugs",
    "Tobacco",
    "Alcohol",
  ];

  let maxConfidence = 0;
  const reasons = [];

  for (const label of moderationLabels) {
    const confidence = label.ModerationLabel?.Confidence || 0;
    const name = label.ModerationLabel?.Name || "";
    const parentName = label.ModerationLabel?.ParentName || "";

    maxConfidence = Math.max(maxConfidence, confidence);

    // Check for reject categories
    if (
      REJECT_CATEGORIES.includes(name) ||
      REJECT_CATEGORIES.includes(parentName)
    ) {
      if (confidence >= REJECT_THRESHOLD) {
        return {
          decision: "REJECT",
          confidence: confidence,
          reasons: [
            `High confidence violation detected: ${name} (${confidence.toFixed(2)})`,
          ],
        };
      } else if (confidence >= FLAG_THRESHOLD) {
        reasons.push(
          `Potential violation: ${name} (${confidence.toFixed(2)})`
        );
      }
    }

    // Check for flag categories
    if (
      FLAG_CATEGORIES.includes(name) ||
      FLAG_CATEGORIES.includes(parentName)
    ) {
      if (confidence >= FLAG_THRESHOLD) {
        reasons.push(
          `Content flagged: ${name} (${confidence.toFixed(2)})`
        );
      }
    }
  }

  // Decision logic
  if (maxConfidence >= REJECT_THRESHOLD && reasons.length > 0) {
    return {
      decision: "REJECT",
      confidence: maxConfidence,
      reasons: reasons,
    };
  } else if (maxConfidence >= FLAG_THRESHOLD || reasons.length > 0) {
    return {
      decision: "FLAG",
      confidence: maxConfidence,
      reasons: reasons,
    };
  } else {
    return {
      decision: "PASS",
      confidence: maxConfidence,
      reasons: [],
    };
  }
}



