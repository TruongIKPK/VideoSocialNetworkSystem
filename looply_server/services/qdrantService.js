import { QdrantClient } from "@qdrant/js-client-rest";

// Lazy initialization - client will be created when first accessed
let _qdrantClient = null;
let _qdrantInitialized = false;

function initializeQdrantClient() {
  if (_qdrantInitialized) return;

  // Validate Qdrant configuration
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;

  // Debug: Log environment variables status
  if (process.env.NODE_ENV !== 'production') {
    console.log("🔍 Qdrant Environment Variables Check:");
    console.log(`   QDRANT_URL: ${qdrantUrl || 'NOT SET'}`);
    console.log(`   QDRANT_API_KEY: ${qdrantApiKey ? 'Set (hidden)' : 'NOT SET'}`);
  }

  if (!qdrantUrl) {
    console.warn("⚠️  QDRANT_URL is not set in environment variables. Qdrant features will be disabled.");
    console.warn("   Please set QDRANT_URL to your Qdrant cluster URL (e.g., https://your-cluster.qdrant.io)");
  } else {
    // Initialize Qdrant client
    _qdrantClient = new QdrantClient({
      url: qdrantUrl,
      apiKey: qdrantApiKey,
    });
    console.log("✅ Qdrant client initialized successfully");
  }

  _qdrantInitialized = true;
}

// Getter function for lazy initialization
export function getQdrantClient() {
  initializeQdrantClient();
  return _qdrantClient;
}

const COLLECTION_NAME = "videos";

/**
 * Initialize Qdrant collection if it doesn't exist
 */
export async function initializeCollection() {
  const qdrantClient = getQdrantClient();
  
  if (!qdrantClient) {
    console.warn("Qdrant client not initialized. Skipping collection initialization.");
    return;
  }

  try {
    // Check if collection exists
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (col) => col.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      // Create collection with 128 dimensions (matching our embedding size)
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 128,
          distance: "Cosine",
        },
      });
      console.log(`✅ Qdrant collection '${COLLECTION_NAME}' created successfully`);
    } else {
      console.log(`✅ Qdrant collection '${COLLECTION_NAME}' already exists`);
    }
  } catch (error) {
    console.error("❌ Error initializing Qdrant collection:", error.message);
    if (error.cause) {
      console.error("   Cause:", error.cause.message || error.cause);
    }
    // Don't throw - allow system to work without Qdrant
  }
}

/**
 * Convert MongoDB ObjectId to Qdrant-compatible ID (hash)
 * @param {string} objectId - MongoDB ObjectId string
 * @returns {number} - Numeric ID for Qdrant
 */
function objectIdToQdrantId(objectId) {
  // Simple hash of ObjectId string to number
  let hash = 0;
  for (let i = 0; i < objectId.length; i++) {
    const char = objectId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Upsert video embedding to Qdrant
 * @param {string} videoId - Video ID (MongoDB ObjectId as string)
 * @param {Array<number>} embedding - Embedding vector
 * @param {Object} metadata - Additional metadata (title, description, etc.)
 * @returns {Promise<void>}
 */
export async function upsertVideoEmbedding(videoId, embedding, metadata = {}) {
  const qdrantClient = getQdrantClient();
  
  if (!qdrantClient) {
    console.warn("Qdrant client not initialized. Skipping embedding upsert.");
    return;
  }

  try {
    const qdrantId = objectIdToQdrantId(videoId);
    
    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: qdrantId,
          vector: embedding,
          payload: {
            videoId: videoId,
            title: metadata.title || "",
            description: metadata.description || "",
            userId: metadata.userId || "",
            createdAt: metadata.createdAt || new Date().toISOString(),
            moderationStatus: metadata.moderationStatus || "pending",
          },
        },
      ],
    });
    console.log(`Video embedding upserted to Qdrant: ${videoId} (Qdrant ID: ${qdrantId})`);
  } catch (error) {
    console.error("Error upserting video embedding to Qdrant:", error);
    // Don't throw - allow system to work without Qdrant
  }
}

/**
 * Search for similar videos
 * @param {Array<number>} embedding - Query embedding vector
 * @param {number} limit - Number of results to return
 * @param {Object} filter - Optional filter (e.g., { moderationStatus: "approved" })
 * @returns {Promise<Array>} - Array of similar videos with scores
 */
export async function searchSimilarVideos(embedding, limit = 10, filter = {}) {
  const qdrantClient = getQdrantClient();
  
  if (!qdrantClient) {
    console.warn("Qdrant client not initialized. Returning empty search results.");
    return [];
  }

  try {
    const queryFilter = {
      must: [],
    };

    // Add moderation status filter if provided
    if (filter.moderationStatus) {
      queryFilter.must.push({
        key: "moderationStatus",
        match: { value: filter.moderationStatus },
      });
    }

    // Add user filter if provided (to exclude own videos)
    if (filter.excludeUserId) {
      queryFilter.must.push({
        key: "userId",
        match: { value: { any: [filter.excludeUserId] } },
      });
    }

    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: embedding,
      limit: limit,
      filter: Object.keys(queryFilter.must).length > 0 ? queryFilter : undefined,
      with_payload: true,
    });

    return searchResult.map((result) => ({
      videoId: result.payload.videoId,
      score: result.score,
      title: result.payload.title,
      description: result.payload.description,
    }));
  } catch (error) {
    console.error("Error searching similar videos in Qdrant:", error);
    return [];
  }
}

/**
 * Delete video embedding from Qdrant
 * @param {string} videoId - Video ID (MongoDB ObjectId)
 * @returns {Promise<void>}
 */
export async function deleteVideoEmbedding(videoId) {
  const qdrantClient = getQdrantClient();
  
  if (!qdrantClient) {
    console.warn("Qdrant client not initialized. Skipping embedding deletion.");
    return;
  }

  try {
    const qdrantId = objectIdToQdrantId(videoId);
    await qdrantClient.delete(COLLECTION_NAME, {
      wait: true,
      points: [qdrantId],
    });
    console.log(`Video embedding deleted from Qdrant: ${videoId} (Qdrant ID: ${qdrantId})`);
  } catch (error) {
    console.error("Error deleting video embedding from Qdrant:", error);
    // Don't throw - allow system to work without Qdrant
  }
}

