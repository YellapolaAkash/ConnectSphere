import { useState, useEffect, useCallback } from "react";
import { searchService } from "../services/search.service";
import toast from "react-hot-toast";

export const useSearch = (query, searchType = "combined") => {
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ users: [], posts: [] });
      return;
    }

    const performSearch = async () => {
      try {
        setLoading(true);

        if (searchType === "users") {
          const response = await searchService.searchUsers(query, page, 10);
          setResults({
            users: response.users || [],
            posts: [],
          });
        } else if (searchType === "posts") {
          const response = await searchService.searchPosts(query, page, 10);
          setResults({
            users: [],
            posts: response.posts || [],
          });
        } else {
          // combined search
          const response = await searchService.search(query, page, 10);
          setResults(response);
        }
      } catch (err) {
        console.error("Search error:", err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query, page, searchType]);

  return {
    results,
    loading,
    page,
    nextPage: () => setPage((p) => p + 1),
    reset: () => {
      setResults({ users: [], posts: [] });
      setPage(1);
    },
  };
};

export const useSearchUsers = (query) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setUsers([]);
      return;
    }

    const performSearch = async () => {
      try {
        setLoading(true);
        const response = await searchService.searchUsers(query, page, 10);
        const newUsers = response.users || [];

        if (page === 1) {
          setUsers(newUsers);
        } else {
          setUsers((prev) => [...prev, ...newUsers]);
        }

        setTotal(response.total || 0);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query, page]);

  return {
    users,
    loading,
    page,
    total,
    hasMore: users.length < total,
    loadMore: () => setPage((p) => p + 1),
  };
};

export const useSearchPosts = (query) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setPosts([]);
      return;
    }

    const performSearch = async () => {
      try {
        setLoading(true);
        const response = await searchService.searchPosts(query, page, 10);
        const newPosts = response.posts || [];

        if (page === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }

        setTotal(response.total || 0);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [query, page]);

  return {
    posts,
    loading,
    page,
    total,
    hasMore: posts.length < total,
    loadMore: () => setPage((p) => p + 1),
  };
};
