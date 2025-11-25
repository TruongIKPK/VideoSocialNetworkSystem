/**
 * Generate embedding from Rekognition labels
 * Since we're not using OpenAI or CLIP, we'll create a simple embedding
 * based on the labels and their confidence scores
 * 
 * This creates a feature vector from the moderation labels that can be used
 * for similarity search in Qdrant
 */

/**
 * Generate embedding vector from Rekognition moderation labels
 * @param {Array} moderationLabels - Array of moderation labels from Rekognition
 * @param {Object} videoMetadata - Video metadata (title, description, etc.)
 * @returns {Array<number>} - Embedding vector
 */
export function generateEmbeddingFromLabels(moderationLabels, videoMetadata = {}) {
  // Create a fixed-size embedding vector (128 dimensions)
  // This is a simple approach - in production, you'd want a proper embedding model
  const embeddingSize = 128;
  const embedding = new Array(embeddingSize).fill(0);

  // Extract label names and confidences
  const labels = [];
  const confidences = [];

  if (moderationLabels && moderationLabels.length > 0) {
    for (const label of moderationLabels) {
      const labelName = label.ModerationLabel?.Name || "";
      const confidence = label.ModerationLabel?.Confidence || 0;
      const parentName = label.ModerationLabel?.ParentName || "";

      if (labelName) labels.push(labelName.toLowerCase());
      if (parentName) labels.push(parentName.toLowerCase());
      if (confidence > 0) confidences.push(confidence);
    }
  }

  // Create hash-based features from labels
  // This is a simple approach - map labels to embedding dimensions
  labels.forEach((label, index) => {
    // Simple hash function to map label to embedding dimension
    const hash = simpleHash(label);
    const dimension = hash % embeddingSize;
    const confidence = confidences[index] || 0.5;
    
    // Add weighted value to embedding
    embedding[dimension] += confidence * 0.1;
  });

  // Normalize embedding
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  
  if (magnitude > 0) {
    return embedding.map((val) => val / magnitude);
  }

  return embedding;
}

/**
 * Simple hash function for string to number
 * @param {string} str - String to hash
 * @returns {number} - Hash value
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Combine video metadata into embedding
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @param {Array} labels - Moderation labels
 * @returns {Array<number>} - Combined embedding
 */
export function createCombinedEmbedding(title, description, labels) {
  const labelEmbedding = generateEmbeddingFromLabels(labels);
  
  // For now, return label-based embedding
  // In a real system, you'd combine text embeddings from title/description
  // with visual embeddings from labels
  
  return labelEmbedding;
}







