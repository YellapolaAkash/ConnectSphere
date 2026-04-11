import React, { useState, useRef } from "react";
import { usePosts, useCreatePost, useLikePost, useCommentPost, useDeletePost } from "../hooks";
import { userService } from "../services/user.service";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const Home = () => {
  const { user, updateUser } = useAuthStore();
  const { posts, loading, hasMore, loadMore, refetch, setPosts } = usePosts();
  const { createPost, loading: creating } = useCreatePost();
  const { likePost, loadingPostId: likeLoading } = useLikePost();
  const { commentPost, loadingPostId: commentLoading } = useCommentPost();
  const { deletePost, loadingPostId: deleteLoading } = useDeletePost();

  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState({});
  const [commentText, setCommentText] = useState({});
  const fileInputRef = useRef(null);

  // Handle create post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    try {
      // Optimistic update
      const tempPost = {
        _id: `temp-${Date.now()}`,
        content: newPost,
        author: user,
        image: postImage ? URL.createObjectURL(postImage) : null,
        likes: [],
        comments: [],
        createdAt: new Date(),
      };

      setPosts((prev) => [tempPost, ...prev]);

      // Call API
      const post = await createPost(newPost, postImage);
      if (post) {
        // Replace temp with real post
        setPosts((prev) => [post, ...prev.filter((p) => p._id !== tempPost._id)]);
        setNewPost("");
        setPostImage(null);

        // Fetch updated user to get accurate postsCount
        try {
          const updatedUser = await userService.getUserProfile(user._id);
          updateUser(updatedUser.user || updatedUser);
        } catch (error) {
          console.error("Failed to refetch user:", error);
        }

        toast.success("Post created successfully!");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setPosts((prev) => prev.filter((p) => p._id !== `temp-${Date.now()}`));
    }
  };

  // Handle like post
  const handleLikePost = async (postId) => {
    try {
      // Optimistic update
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            const isLiked = post.likes?.includes(user?._id);
            return {
              ...post,
              likes: isLiked
                ? post.likes.filter((id) => id !== user?._id)
                : [...(post.likes || []), user?._id],
            };
          }
          return post;
        })
      );

      // Call API
      await likePost(postId);
    } catch (error) {
      // Revert on error
      refetch();
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      // Optimistic update
      setPosts((prev) => prev.filter((p) => p._id !== postId));

      // Call API
      await deletePost(postId);
    } catch (error) {
      // Revert on error
      refetch();
    }
  };

  // Handle comment
  const handleCommentPost = async (postId) => {
    const content = commentText[postId];
    if (!content?.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      // Optimistic update
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [
                ...(post.comments || []),
                {
                  user: user,
                  content: content,
                  _id: `temp-${Date.now()}`,
                  createdAt: new Date(),
                },
              ],
            };
          }
          return post;
        })
      );

      // Call API
      await commentPost(postId, content);
      setCommentText({ ...commentText, [postId]: "" });
      setShowCommentForm({ ...showCommentForm, [postId]: false });

      // Refetch to get fresh data
      refetch();
    } catch (error) {
      console.error("Error posting comment:", error);
      refetch();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Create Post Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind? 💭"
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="4"
            disabled={creating}
          />

          {/* Image Preview */}
          {postImage && (
            <div className="relative">
              <img
                src={URL.createObjectURL(postImage)}
                alt="Preview"
                className="max-h-48 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setPostImage(null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              disabled={creating}
            >
              📷 Add Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setPostImage(e.target.files?.[0])}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewPost("");
                  setPostImage(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newPost.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
              >
                {creating ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No posts yet. Be the first to share! 🚀</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-md p-6">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <img
                    src={post.author?.avatar ? (post.author.avatar.startsWith('http') ? post.author.avatar : `http://localhost:5000${post.author.avatar}`) : "👤"}
                    alt={post.author?.name}
                    className="w-10 h-10 rounded-full bg-gray-200"
                    onError={(e) => (e.target.textContent = "👤")}
                  />
                  <div>
                    <p className="font-semibold">{post.author?.name || "Anonymous"}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}{" "}
                      {new Date(post.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Delete Button (if author) */}
                {user?._id === post.author?._id && (
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    disabled={deleteLoading === post._id}
                    className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                  >
                    {deleteLoading === post._id ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>

              {/* Post Content */}
              <p className="text-gray-800 mb-4">{post.content}</p>

              {/* Post Image */}
              {post.image && (
                <img
                  src={post.image.startsWith('http') ? post.image : `http://localhost:5000${post.image}`}
                  alt="Post"
                  className="w-full rounded-lg mb-4 max-h-96 object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', post.image);
                    e.target.style.display = 'none';
                  }}
                />
              )}

              {/* Post Actions */}
              <div className="flex gap-6 text-gray-600 border-t border-gray-200 pt-4 mb-4">
                <button
                  onClick={() => handleLikePost(post._id)}
                  disabled={likeLoading === post._id}
                  className={`flex items-center gap-2 hover:text-blue-500 transition disabled:opacity-50 ${
                    post.likes?.includes(user?._id) ? "text-blue-500 font-semibold" : ""
                  }`}
                >
                  👍 {post.likes?.length || 0} Likes
                </button>
                <button
                  onClick={() => setShowCommentForm({ ...showCommentForm, [post._id]: !showCommentForm[post._id] })}
                  className="flex items-center gap-2 hover:text-blue-500 transition"
                >
                  💬 {post.comments?.length || 0} Comments
                </button>
                <button className="flex items-center gap-2 hover:text-blue-500 transition">
                  🔄 Share
                </button>
              </div>

              {/* Comments Section */}
              {post.comments && post.comments.length > 0 && (
                <div className="mb-4 space-y-2 border-t pt-4">
                  {post.comments.map((comment) => (
                    <div key={comment._id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-semibold text-sm">{comment.user?.name}</p>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment Form */}
              {showCommentForm[post._id] && (
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentText[post._id] || ""}
                      onChange={(e) =>
                        setCommentText({ ...commentText, [post._id]: e.target.value })
                      }
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={commentLoading === post._id}
                    />
                    <button
                      onClick={() => handleCommentPost(post._id)}
                      disabled={commentLoading === post._id || !commentText[post._id]?.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
                    >
                      {commentLoading === post._id ? "..." : "Post"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Load More Posts
          </button>
        </div>
      )}
    </div>
  );
};

// export default Home;
// };

export default Home;