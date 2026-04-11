import apiClient from "./apiClient";

export const searchService = {
  // Search users
  searchUsers: async (query = "", page = 1, limit = 10) => {
    const response = await apiClient.get("/search/users", {
      params: { q: query, page, limit },
    });
    return response;
  },

  // Search posts
  searchPosts: async (query = "", page = 1, limit = 10) => {
    const response = await apiClient.get("/search/posts", {
      params: { q: query, page, limit },
    });
    return response;
  },

  // Combined search (search both users and posts)
  search: async (query = "", page = 1, limit = 10) => {
    const [users, posts] = await Promise.all([
      searchService.searchUsers(query, page, limit),
      searchService.searchPosts(query, page, limit),
    ]);

    return {
      users: users.users || [],
      posts: posts.posts || [],
    };
  },
};
