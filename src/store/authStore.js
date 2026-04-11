import { create } from "zustand";

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem("accessToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  isHydrated: false,
  isLoading: false,

  // Initialize auth state from localStorage
  hydrate: () => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");

    if (token) {
      set({
        accessToken: token,
        user: user ? JSON.parse(user) : null,
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },

  // Set auth after login/signup
  setAuth: ({ user, token }) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    set({
      user,
      accessToken: token,
      isAuthenticated: true,
    });
  },

  // Set loading state
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Logout and clear data
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // Update user profile
  updateUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },
}));

export default useAuthStore;