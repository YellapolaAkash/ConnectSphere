import { useState, useEffect, useCallback } from "react";
import { userService } from "../services/user.service";
import toast from "react-hot-toast";

export const useUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await userService.getUserProfile(userId);
      setUser(response.user || response);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUser();
    } else {
      setLoading(false);
      setUser(null);
      setError(null);
    }
  }, [userId, fetchUser]);

  return { user, loading, error, refetch: fetchUser };
};

export const useAllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.users || response);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
};

export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getOnlineUsers();
      setOnlineUsers(response.users || response);
    } catch (err) {
      console.error("Error fetching online users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineUsers();
    // Refresh online users every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchOnlineUsers]);

  return { onlineUsers, loading, refetch: fetchOnlineUsers };
};

export const useFollowUser = () => {
  const [loading, setLoading] = useState(false);

  const followUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      await userService.followUser(userId);
      toast.success("User followed!");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unfollowUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      await userService.unfollowUser(userId);
      toast.success("User unfollowed!");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { followUser, unfollowUser, loading };
};

export const useUserFollowers = (userId) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchFollowers = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await userService.getFollowers(userId, page, 10);
      setFollowers(response.followers || []);
      setTotal(response.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  return {
    followers,
    loading,
    page,
    total,
    hasMore: followers.length < total,
    nextPage: () => setPage((p) => p + 1),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    refetch: fetchFollowers,
  };
};

export const useUserFollowing = (userId) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchFollowing = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await userService.getFollowing(userId, page, 10);
      setFollowing(response.following || []);
      setTotal(response.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  return {
    following,
    loading,
    page,
    total,
    hasMore: following.length < total,
    nextPage: () => setPage((p) => p + 1),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    refetch: fetchFollowing,
  };
};

export const useUpdateProfile = () => {
  const [loading, setLoading] = useState(false);

  const updateProfile = useCallback(async (userId, formData) => {
    try {
      setLoading(true);
      const response = await userService.updateProfile(userId, formData);
      toast.success("Profile updated successfully!");
      return response.user || response;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateProfile, loading };
};

export const useSearchUsers = (searchTerm) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!searchTerm) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.searchUsers(searchTerm, page, 10);
        setUsers(response.users || []);
        setTotal(response.total || 0);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm, page]);

  return {
    users,
    loading,
    page,
    total,
    hasMore: users.length < total,
    nextPage: () => setPage((p) => p + 1),
  };
};
