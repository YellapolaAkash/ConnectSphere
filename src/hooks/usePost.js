import { useState, useEffect, useCallback } from "react";
import { postService } from "../services/post.service";
import toast from "react-hot-toast";

export const usePosts = (userId = null) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPosts = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      let response;

      if (userId) {
        response = await postService.getUserPosts(userId, pageNum, 10);
      } else {
        response = await postService.getFeed(pageNum, 10);
      }

      const newPosts = response.posts || [];
      const totalPosts = response.total || 0;

      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setTotal(totalPosts);
      setPage(pageNum);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPosts(1);
  }, [userId]);

  return {
    posts,
    loading,
    page,
    total,
    hasMore: posts.length < total,
    loadMore: () => fetchPosts(page + 1),
    refetch: () => fetchPosts(1),
    setPosts, // For optimistic updates
  };
};

export const useCreatePost = () => {
  const [loading, setLoading] = useState(false);

  const createPost = useCallback(async (content, image = null) => {
    try {
      if (!content.trim()) {
        toast.error("Post content cannot be empty");
        return null;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append("content", content);
      if (image) {
        formData.append("image", image);
      }

      const response = await postService.createPost(formData);
      toast.success("Post created successfully!");
      return response.post || response;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPost, loading };
};

export const useLikePost = () => {
  const [loadingPostId, setLoadingPostId] = useState(null);

  const likePost = useCallback(async (postId) => {
    try {
      setLoadingPostId(postId);
      const response = await postService.likePost(postId);
      return response;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setLoadingPostId(null);
    }
  }, []);

  return { likePost, loadingPostId };
};

export const useCommentPost = () => {
  const [loadingPostId, setLoadingPostId] = useState(null);

  const commentPost = useCallback(async (postId, content) => {
    try {
      if (!content.trim()) {
        toast.error("Comment cannot be empty");
        return null;
      }

      setLoadingPostId(postId);
      const response = await postService.commentPost(postId, { content });
      toast.success("Comment added!");
      return response.comment || response;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setLoadingPostId(null);
    }
  }, []);

  return { commentPost, loadingPostId };
};

export const useUpdatePost = () => {
  const [loading, setLoading] = useState(false);

  const updatePost = useCallback(async (postId, content) => {
    try {
      if (!content.trim()) {
        toast.error("Post content cannot be empty");
        return null;
      }

      setLoading(true);
      const response = await postService.updatePost(postId, { content });
      toast.success("Post updated!");
      return response.post || response;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updatePost, loading };
};

export const useDeletePost = () => {
  const [loadingPostId, setLoadingPostId] = useState(null);

  const deletePost = useCallback(async (postId) => {
    try {
      setLoadingPostId(postId);
      await postService.deletePost(postId);
      toast.success("Post deleted!");
      return true;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setLoadingPostId(null);
    }
  }, []);

  return { deletePost, loadingPostId };
};
