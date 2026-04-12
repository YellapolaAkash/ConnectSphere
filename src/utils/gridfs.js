/**
 * GridFS Image Utilities
 * Handles image URLs served from MongoDB GridFS
 * Backend stores all images in GridFS, not on file system
 */

import ENV from "../config/env";

/**
 * Get image URL from GridFS file ID
 * @param {string|object} image - File ID (string) or image object with fileId property
 * @returns {string} Complete URL to fetch image from GridFS
 * 
 * @example
 * // With file ID string
 * const url = getGridFSImageUrl('507f1f77bcf86cd799439011');
 * // Returns: http://localhost:5000/api/posts/image/507f1f77bcf86cd799439011
 * 
 * @example
 * // With image object from post
 * const post = { image: { fileId: '507f...', filename: 'photo.jpg' } }
 * const url = getGridFSImageUrl(post.image);
 */
export const getGridFSImageUrl = (image) => {
  if (!image) return null;

  const apiUrl = ENV.replace(/\/$/, ""); // Remove trailing slash
  const baseUrl = apiUrl.replace("/api", ""); // Get base URL without /api
  
  // Handle image as string (file ID)
  if (typeof image === "string") {
    return `${baseUrl}/api/posts/image/${image}`;
  }

  // Handle image as object with fileId
  if (typeof image === "object" && image?.fileId) {
    return `${baseUrl}/api/posts/image/${image.fileId}`;
  }

  return null;
};

/**
 * Check if URL is a GridFS image URL
 * @param {string} url - URL to check
 * @returns {boolean} True if URL is from GridFS
 */
export const isGridFSUrl = (url) => {
  if (!url) return false;
  return url.includes("/api/posts/image/");
};

/**
 * Extract file ID from GridFS URL
 * @param {string} url - GridFS image URL
 * @returns {string} File ID or null
 * 
 * @example
 * const fileId = extractGridFSFileId('http://localhost:5000/api/posts/image/507f...');
 * // Returns: '507f...'
 */
export const extractGridFSFileId = (url) => {
  if (!isGridFSUrl(url)) return null;
  const parts = url.split("/api/posts/image/");
  return parts[parts.length - 1] || null;
};

/**
 * Handle image error by providing fallback
 * @param {object} event - Image element event
 * @param {string} fallback - Fallback text or emoji (default: '🖼️')
 */
export const handleImageError = (event, fallback = "🖼️") => {
  if (event.target) {
    event.target.style.display = "none";
    // Create fallback element if needed
    const parent = event.target.parentElement;
    if (parent) {
      const div = document.createElement("div");
      div.className = "w-full h-96 bg-gray-200 flex items-center justify-center text-gray-400 text-4xl rounded-lg";
      div.textContent = fallback;
      parent.appendChild(div);
    }
  }
};

/**
 * Validate if URL is accessible and image loads properly
 * @param {string} url - Image URL to validate
 * @returns {Promise<boolean>} True if image loads successfully
 */
export const validateImageUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Format post image data for displaying
 * Handles both new GridFS format and legacy formats
 * 
 * @param {string|object} imageData - Image data from post
 * @returns {object} Formatted object with url and fallback info
 */
export const formatPostImage = (imageData) => {
  if (!imageData) {
    return { url: null, hasImage: false };
  }

  // Already a GridFS URL string
  if (typeof imageData === "string" && imageData.includes("/api/posts/image/")) {
    return {
      url: imageData,
      hasImage: true,
      source: "gridfs",
    };
  }

  // Image object with fileId (new format)
  if (typeof imageData === "object" && imageData?.fileId) {
    const url = getGridFSImageUrl(imageData);
    return {
      url,
      hasImage: !!url,
      filename: imageData.filename,
      source: "gridfs",
    };
  }

  // Legacy local file path
  if (typeof imageData === "string" && imageData.startsWith("/uploads/")) {
    return {
      url: `${ENV.replace("/api", "")}${imageData}`,
      hasImage: true,
      source: "legacy",
    };
  }

  // Data URL (local preview)
  if (typeof imageData === "string" && imageData.startsWith("data:")) {
    return {
      url: imageData,
      hasImage: true,
      source: "preview",
    };
  }

  return { url: null, hasImage: false };
};

/**
 * Create image element with proper error handling
 * @param {string|object} imageData - Image data from post
 * @param {object} attributes - Additional HTML attributes
 * @returns {HTMLImageElement} Configured image element
 */
export const createImageElement = (imageData, attributes = {}) => {
  const img = document.createElement("img");
  const formatted = formatPostImage(imageData);

  if (formatted.url) {
    img.src = formatted.url;
    img.alt = formatted.filename || "Post image";
    img.className = "w-full rounded-lg mb-4 max-h-96 object-cover";
    img.onerror = () => handleImageError({ target: img });
    
    // Apply additional attributes
    Object.entries(attributes).forEach(([key, value]) => {
      img.setAttribute(key, value);
    });
  }

  return img;
};
