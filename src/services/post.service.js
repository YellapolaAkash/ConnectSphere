import apiClient from "./apiClient";
import { getGridFSImageUrl } from "../utils/gridfs";

export const postService = {
  /**
   * Get global feed with pagination
   * Backend returns: { success, posts, total, page, pages }
   */
  getFeed: async (page = 1, limit = 10) => {
    const response = await apiClient.get("/posts", {
      params: { page, limit },
    });
    // Transform image URLs from GridFS fileId
    return transformPostsWithImages(response);
  },

  /**
   * Get user's posts by userId
   * Backend returns: { success, posts, total, page, pages }
   */
  getUserPosts: async (userId, page = 1, limit = 10) => {
    const response = await apiClient.get(`/posts/user/${userId}`, {
      params: { page, limit },
    });
    return transformPostsWithImages(response);
  },

  /**
   * Create new post with optional image
   * Backend expects: multipart/form-data with content and optional image file
   * Backend returns: { success, post } where post.image has fileId from GridFS
   * 
   * @param {FormData} formData - Must contain 'content' and optionally 'image'
   * @returns {Promise<object>} Response with created post
   */
  createPost: async (formData) => {
    // Log FormData contents for debugging
    console.log("[PostService] Creating post with FormData:");
    for (let pair of formData.entries()) {
      if (pair[0] === "image") {
        console.log(`  ${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes, ${pair[1].type})`);
      } else {
        console.log(`  ${pair[0]}: ${pair[1]}`);
      }
    }
    
    // Note: axios automatically sets Content-Type to multipart/form-data
    // when FormData is passed, so we don't need to set headers
    const response = await apiClient.post("/posts", formData);
    
    console.log("[PostService] Post creation response:", response);
    
    // Transform image URL if present
    if (response.post?.image?.fileId) {
      response.post.image.url = getGridFSImageUrl(response.post.image);
    }
    
    return response;
  },

  /**
   * Update post content or visibility
   * Backend expects: { content?, visibility? }
   * Backend returns: { success, post }
   */
  updatePost: async (postId, payload) => {
    const response = await apiClient.put(`/posts/${postId}`, payload);
    
    if (response.post?.image?.fileId) {
      response.post.image.url = getGridFSImageUrl(response.post.image);
    }
    
    return response;
  },

  /**
   * Delete post
   * Backend returns: { success, message }
   */
  deletePost: async (postId) => {
    const response = await apiClient.delete(`/posts/${postId}`);
    return response;
  },

  /**
   * Like/unlike post
   * Backend expects: POST /api/posts/{postId}/like
   * Backend returns: { success, likes, message }
   */
  likePost: async (postId) => {
    const response = await apiClient.post(`/posts/${postId}/like`);
    return response;
  },

  /**
   * Add comment to post
   * Backend expects: { content: string }
   * Backend returns: { success, comment, commentsCount }
   */
  commentPost: async (postId, content) => {
    const response = await apiClient.post(`/posts/${postId}/comment`, {
      content,
    });
    return response;
  },

  /**
   * Get a single post by ID
   * Backend returns: { success, post }
   */
  getPost: async (postId) => {
    const response = await apiClient.get(`/posts/${postId}`);
    
    if (response.post?.image?.fileId) {
      response.post.image.url = getGridFSImageUrl(response.post.image);
    }
    
    return response;
  },

  /**
   * Get post comments
   * Backend returns: { success, comments, total }
   */
  getPostComments: async (postId, page = 1, limit = 20) => {
    const response = await apiClient.get(`/posts/${postId}/comments`, {
      params: { page, limit },
    });
    return response;
  },
};

/**
 * Transform post response to include proper image URLs from GridFS
 * Handles both array of posts and single post
 */
function transformPostsWithImages(response) {
  if (!response) return response;

  // Handle array of posts
  if (Array.isArray(response.posts)) {
    response.posts = response.posts.map((post) => {
      if (post.image?.fileId && !post.image.url) {
        post.image.url = getGridFSImageUrl(post.image);
      }
      return post;
    });
  }

  // Handle single post
  if (response.post?.image?.fileId && !response.post.image.url) {
    response.post.image.url = getGridFSImageUrl(response.post.image);
  }

  return response;
}
