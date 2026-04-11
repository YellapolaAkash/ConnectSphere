import apiClient from "./apiClient";

export const postService = {
  // Get global feed
  getFeed: async (page = 1, limit = 10) => {
    const response = await apiClient.get("/posts", {
      params: { page, limit },
    });
    return response;
  },

  // Get user's posts
  getUserPosts: async (userId, page = 1, limit = 10) => {
    const response = await apiClient.get(`/posts/user/${userId}`, {
      params: { page, limit },
    });
    return response;
  },

  // Create new post
  createPost: async (formData) => {
    const response = await apiClient.post("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  },

  // Update post
  updatePost: async (postId, payload) => {
    const response = await apiClient.put(`/posts/${postId}`, payload);
    return response;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await apiClient.delete(`/posts/${postId}`);
    return response;
  },

  // Like/unlike post
  likePost: async (postId) => {
    const response = await apiClient.post(`/posts/${postId}/like`);
    return response;
  },

  // Add comment to post
  commentPost: async (postId, payload) => {
    const response = await apiClient.post(`/posts/${postId}/comment`, payload);
    return response;
  },
};
