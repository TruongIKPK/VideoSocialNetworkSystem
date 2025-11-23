import Video from "../models/Video.js";
import { getModerationJobStatus, evaluateModerationResults } from "./rekognitionService.js";
import { makeVideoPublic, getPublicIdFromUrl } from "../config/cloudinary.js";
import { generateEmbeddingFromLabels } from "./embeddingService.js";
import { upsertVideoEmbedding } from "./qdrantService.js";

/**
 * Process a single moderation job
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
export async function processModerationJob(videoId) {
  try {
    const video = await Video.findById(videoId);
    
    if (!video) {
      console.error(`Video not found: ${videoId}`);
      return;
    }

    if (!video.rekognitionJobId) {
      console.error(`No Rekognition job ID for video: ${videoId}`);
      return;
    }

    // Get job status
    const jobStatus = await getModerationJobStatus(video.rekognitionJobId);

    if (jobStatus.status === "IN_PROGRESS") {
      console.log(`Moderation job still in progress for video: ${videoId}`);
      return; // Job not ready yet
    }

    if (jobStatus.status === "FAILED") {
      console.error(`Moderation job failed for video: ${videoId}`);
      await Video.findByIdAndUpdate(videoId, {
        moderationStatus: "rejected",
        moderationResults: {
          error: "Moderation job failed",
          status: jobStatus.status,
        },
      });
      return;
    }

    if (jobStatus.status !== "SUCCEEDED") {
      console.log(`Moderation job status: ${jobStatus.status} for video: ${videoId}`);
      return;
    }

    // Job succeeded - evaluate results
    const evaluation = evaluateModerationResults(jobStatus.results);

    // Update video with moderation results
    const updateData = {
      moderationResults: {
        status: jobStatus.status,
        labels: jobStatus.results,
        evaluation: evaluation,
        videoMetadata: jobStatus.videoMetadata,
      },
    };

    if (evaluation.decision === "PASS") {
      // Make Cloudinary video public
      if (video.cloudinaryPublicId) {
        try {
          const publicResult = await makeVideoPublic(video.cloudinaryPublicId);
          console.log(`Video made public: ${videoId}`);
          // Update URL to public URL if available
          if (publicResult.secure_url) {
            updateData.url = publicResult.secure_url;
          } else {
            updateData.url = video.cloudinaryTempUrl || video.url;
          }
        } catch (error) {
          console.error(`Error making video public: ${error.message}`);
          // Keep temp URL if making public fails
          updateData.url = video.cloudinaryTempUrl || video.url;
        }
      } else {
        updateData.url = video.cloudinaryTempUrl || video.url;
      }

      // Update video status
      updateData.moderationStatus = "approved";

      // Generate embedding from labels
      const embedding = generateEmbeddingFromLabels(
        jobStatus.results,
        {
          title: video.title,
          description: video.description,
        }
      );

      if (embedding && embedding.length > 0) {
        updateData.embedding = embedding;

        // Store in Qdrant
        await upsertVideoEmbedding(
          videoId.toString(),
          embedding,
          {
            title: video.title,
            description: video.description,
            userId: video.user._id.toString(),
            createdAt: video.createdAt,
            moderationStatus: "approved",
          }
        );
      }
    } else if (evaluation.decision === "REJECT") {
      updateData.moderationStatus = "rejected";
    } else if (evaluation.decision === "FLAG") {
      updateData.moderationStatus = "flagged";
    }

    await Video.findByIdAndUpdate(videoId, updateData);
    console.log(
      `Moderation completed for video ${videoId}: ${evaluation.decision}`
    );
  } catch (error) {
    console.error(`Error processing moderation job for video ${videoId}:`, error);
    
    // Mark video as rejected on error
    try {
      await Video.findByIdAndUpdate(videoId, {
        moderationStatus: "rejected",
        moderationResults: {
          error: error.message,
        },
      });
    } catch (updateError) {
      console.error(`Error updating video status: ${updateError.message}`);
    }
  }
}

/**
 * Poll and process all pending moderation jobs
 * This should be called periodically (e.g., every 30 seconds)
 */
export async function processPendingModerationJobs() {
  try {
    // Find all videos with pending moderation
    const pendingVideos = await Video.find({
      moderationStatus: "pending",
      rekognitionJobId: { $exists: true, $ne: null },
    }).limit(10); // Process 10 at a time

    console.log(`Processing ${pendingVideos.length} pending moderation jobs`);

    // Process each video
    for (const video of pendingVideos) {
      await processModerationJob(video._id.toString());
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("Error processing pending moderation jobs:", error);
  }
}

/**
 * Start background polling for moderation jobs
 * @param {number} intervalMs - Polling interval in milliseconds (default: 30000 = 30 seconds)
 */
export function startModerationPolling(intervalMs = 30000) {
  console.log(`Starting moderation polling every ${intervalMs}ms`);
  
  // Process immediately on start
  processPendingModerationJobs();
  
  // Then process periodically
  setInterval(() => {
    processPendingModerationJobs();
  }, intervalMs);
}

