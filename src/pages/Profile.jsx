import React, { useState, useRef, useEffect } from "react";
import { useUser, useUpdateProfile, useFollowUser } from "../hooks";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const Profile = ({ userId }) => {
  const { user: currentUser, accessToken, isHydrated, updateUser, logout } = useAuthStore();
  const profileUserId = userId || currentUser?._id;
  const isOwnProfile = currentUser?._id === profileUserId;

  const { user: fetchedUser, loading, error, refetch } = useUser(!isOwnProfile ? profileUserId : null);
  const profileUser = isOwnProfile ? currentUser : fetchedUser;
  const { updateProfile, loading: updating } = useUpdateProfile();
  const { followUser, unfollowUser } = useFollowUser();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    skills: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  // Update form data when user data loads
  useEffect(() => {
    if (profileUser) {
      setFormData({
        name: profileUser.name || "",
        bio: profileUser.bio || "",
        skills: (profileUser.skills || []).join(", "),
      });
    }
  }, [profileUser]);

  const isFollowing = profileUser?.isFollowing || profileUser?.followers?.some((follower) => follower._id === currentUser?._id);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("bio", formData.bio);
      formDataToSend.append("skills", JSON.stringify(formData.skills.split(",").map(s => s.trim())));

      if (avatarFile) {
        formDataToSend.append("avatar", avatarFile);
      }

      const updatedUser = await updateProfile(profileUserId, formDataToSend);
      setIsEditing(false);
      setAvatarFile(null);
      if (isOwnProfile && updatedUser) {
        updateUser(updatedUser);
      }
      if (!isOwnProfile) {
        await refetch();
      }
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
      console.error("Error:", error);
    }
  };

  const handleFollowUser = async () => {
    try {
      if (isFollowing) {
        await unfollowUser(profileUserId);
        toast.success("User unfollowed");
      } else {
        await followUser(profileUserId);
        toast.success("User followed");
      }
      await refetch();
    } catch (error) {
      toast.error(error.message || "Failed to follow/unfollow");
    }
  };


  if (!isHydrated || (!currentUser && accessToken)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-lg font-semibold text-red-600">Profile Load Error</p>
          <p className="mt-4 text-gray-700">{error}</p>
          <button
            onClick={() => refetch()}
            className="mt-6 px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-lg font-semibold text-gray-800">User not found</p>
          <p className="mt-3 text-gray-600">Please try again or logout and login again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-16 mb-6">
            <img
              src={profileUser?.avatar ? (profileUser.avatar.startsWith('http') ? profileUser.avatar : `http://localhost:5000${profileUser.avatar}`) : "👤"}
              alt={profileUser?.name}
              className="w-32 h-32 rounded-full bg-white border-4 border-white text-6xl flex items-center justify-center"
              onError={(e) => (e.target.textContent = "👤")}
            />
            <div className="flex-1">
              {!isEditing ? (
                <div>
                  <h1 className="text-3xl font-bold">{profileUser?.name}</h1>
                  <p className="text-gray-600 text-sm">@{profileUser?.email?.split("@")[0]}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              ) : (
                <button
                  onClick={handleFollowUser}
                  className={`px-6 py-2 rounded-lg text-white transition ${
                    isFollowing
                      ? "bg-gray-500 hover:bg-gray-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            {!isEditing ? (
              <p className="text-gray-700">{profileUser?.bio || "No bio added yet"}</p>
            ) : (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Add a bio..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            )}
          </div>

          {/* Skills */}
          {profileUser?.skills && profileUser.skills.length > 0 && (
            <div className="mb-6">
              {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {profileUser.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="Skills (comma separated)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              )}
            </div>
          )}

          {/* Avatar Upload (Edit Mode) */}
          {isEditing && isOwnProfile && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                📷 Change Avatar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0])}
                className="hidden"
              />
              {avatarFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {avatarFile.name}
                </p>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 py-6 border-t border-b border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {profileUser?.postsCount || 0}
              </p>
              <p className="text-gray-600 text-sm">Posts</p>
            </div>
              <div className="text-center cursor-pointer hover:opacity-75">
              <p className="text-2xl font-bold text-blue-600">
                {profileUser?.followersCount ?? profileUser?.followers?.length ?? 0}
              </p>
              <p className="text-gray-600 text-sm">Followers</p>
            </div>
            <div className="text-center cursor-pointer hover:opacity-75">
              <p className="text-2xl font-bold text-blue-600">
                {profileUser?.followingCount ?? profileUser?.following?.length ?? 0}
              </p>
              <p className="text-gray-600 text-sm">Following</p>
            </div>
          </div>

          {/* Save Button (Edit Mode) */}
          {isEditing && isOwnProfile && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveProfile}
                disabled={updating}
                className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Followers / Following counts are displayed above. */}

          {/* Logout Button - Real World Style */}
          {isOwnProfile && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to logout?')) {
                    logout();
                    toast.success('Logged out successfully!');
                  }
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition duration-200 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;