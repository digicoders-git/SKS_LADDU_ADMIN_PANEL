// src/pages/Blogs.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import RichTextEditor from "../components/RichTextEditor";
import {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
} from "../apis/blogs";
import {
  FaBlog,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
  FaEye,
  FaHeart,
  FaToggleOn,
  FaToggleOff,
  FaStar,
  FaCalendar,
  FaTags,
  FaImage,
} from "react-icons/fa";
import Swal from "sweetalert2";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "-";

const emptyForm = {
  title: "",
  shortDescription: "",
  content: "",
  thumbnailImage: "",
  coverImage: "",
  category: "",
  tags: [],
  metaTitle: "",
  metaDescription: "",
  metaKeywords: [],
  isPublished: true,
  isFeatured: false,
};

export default function Blogs() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewBlog, setViewBlog] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dynamic arrays for tags and keywords
  const [tagsList, setTagsList] = useState([""]);
  const [keywordsList, setKeywordsList] = useState([""]);

  // Content state for rich text editor
  const [editorContent, setEditorContent] = useState("");

  const fetchBlogs = async (page = 1) => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllBlogs(page, 10);
      setBlogs(res.blogs || []);
      setCurrentPage(res.currentPage || 1);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load blogs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setTagsList([""]);
    setKeywordsList([""]);
    setEditorContent("");
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
    setSuccess("");
  };

  // Tags handlers
  const handleTagChange = (index, value) => {
    setTagsList((prev) =>
      prev.map((tag, i) => (i === index ? value : tag))
    );
  };

  const handleTagAdd = () => {
    setTagsList((prev) => [...prev, ""]);
  };

  const handleTagRemove = (index) => {
    setTagsList((prev) => {
      if (prev.length === 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  };

  // Keywords handlers
  const handleKeywordChange = (index, value) => {
    setKeywordsList((prev) =>
      prev.map((keyword, i) => (i === index ? value : keyword))
    );
  };

  const handleKeywordAdd = () => {
    setKeywordsList((prev) => [...prev, ""]);
  };

  const handleKeywordRemove = (index) => {
    setKeywordsList((prev) => {
      if (prev.length === 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleEdit = (blog) => {
    setEditing(blog);
    setForm({
      title: blog.title || "",
      shortDescription: blog.shortDescription || "",
      content: blog.content || "",
      thumbnailImage: blog.thumbnailImage || "",
      coverImage: blog.coverImage || "",
      category: blog.category || "",
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || "",
      isPublished: blog.isPublished ?? true,
      isFeatured: blog.isFeatured ?? false,
    });

    setTagsList(
      Array.isArray(blog.tags) && blog.tags.length ? blog.tags : [""]
    );
    setKeywordsList(
      Array.isArray(blog.metaKeywords) && blog.metaKeywords.length
        ? blog.metaKeywords
        : [""]
    );

    setEditorContent(blog.content || "");
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleDelete = async (blog) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to delete blogs.");
      return;
    }

    // Use ObjectId (_id) for delete operations
    const blogId = blog._id || blog.id;
    if (!blogId) {
      setError("Cannot delete this blog (missing ObjectId).");
      return;
    }

    const result = await Swal.fire({
      title: `Delete blog "${blog.title}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e02424",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await deleteBlog(blogId);
      setSuccess("Blog deleted successfully.");
      await fetchBlogs(currentPage);
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Blog deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to delete blog.";
      setError(msg);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (blog) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to change status.");
      return;
    }

    // Use ObjectId (_id) for update operations
    const blogId = blog._id || blog.id;
    if (!blogId) {
      setError("Cannot update this blog (missing ObjectId).");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateBlog(blogId, { isPublished: !blog.isPublished });

      setBlogs((prev) =>
        prev.map((b) =>
          (b._id || b.id || b.slug) === (blog._id || blog.id || blog.slug)
            ? { ...b, isPublished: !b.isPublished }
            : b
        )
      );

      setSuccess(
        `Blog ${!blog.isPublished ? "published" : "unpublished"} successfully.`
      );
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to update blog status.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLike = async (blog) => {
    const idOrSlug = blog.slug || blog._id || blog.id;
    if (!idOrSlug) return;

    try {
      await likeBlog(idOrSlug);
      setBlogs((prev) =>
        prev.map((b) =>
          (b._id || b.id || b.slug) === (blog._id || blog.id || blog.slug)
            ? { ...b, likes: (b.likes || 0) + 1 }
            : b
        )
      );
    } catch (e) {
      console.error("Failed to like blog:", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setError("You must be logged in as admin to manage blogs.");
      return;
    }

    if (!form.title.trim()) {
      setError("Blog title is required.");
      return;
    }

    if (!editorContent.trim()) {
      setError("Blog content is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const cleanTags = tagsList
        .map((tag) => tag.trim())
        .filter((tag) => tag.length);

      const cleanKeywords = keywordsList
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length);

      const blogData = {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        content: editorContent.trim(),
        thumbnailImage: form.thumbnailImage.trim(),
        coverImage: form.coverImage.trim(),
        category: form.category.trim(),
        tags: cleanTags,
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim(),
        metaKeywords: cleanKeywords,
        isPublished: form.isPublished,
        isFeatured: form.isFeatured,
      };

      // Remove empty string fields
      Object.keys(blogData).forEach(key => {
        if (blogData[key] === '') {
          delete blogData[key];
        }
      });

      console.log('Blog data being sent:', blogData); // Debug log

      if (editing) {
        // Use ObjectId (_id) for update operations
        const blogId = editing._id || editing.id;
        if (!blogId) {
          throw new Error("Missing blog ObjectId for update.");
        }
        console.log('Updating blog with ObjectId:', blogId);
        await updateBlog(blogId, blogData);
        setSuccess("Blog updated successfully.");
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Blog updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createBlog(blogData);
        setSuccess("Blog created successfully.");
        Swal.fire({
          icon: "success",
          title: "Created",
          text: "Blog created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      resetForm();
      setIsModalOpen(false);
      await fetchBlogs(currentPage);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to save blog.";
      setError(msg);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredBlogs = useMemo(() => {
    if (!search.trim()) return blogs;
    const q = search.toLowerCase();
    return blogs.filter((blog) => {
      const title = (blog.title || "").toLowerCase();
      const category = (blog.category || "").toLowerCase();
      const tags = (blog.tags || []).join(" ").toLowerCase();
      return (
        title.includes(q) ||
        category.includes(q) ||
        tags.includes(q)
      );
    });
  }, [blogs, search]);

  return (
    <div className="space-y-6" style={{ fontFamily: currentFont.family }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaBlog />
            Blog Management
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Create, manage and publish blog posts for your website.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs opacity-70">
              <FaSearch style={{ color: themeColors.text }} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blogs..."
              className="pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            />
          </div>

          <button
            onClick={() => fetchBlogs(currentPage)}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.text,
            }}
            title="Refresh"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            disabled={!isLoggedIn}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.onPrimary,
            }}
            title={isLoggedIn ? "Add new blog" : "Login as admin to add"}
          >
            <FaPlus />
            Add Blog
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {(error || success || !isLoggedIn) && (
        <div className="space-y-2">
          {error && (
            <div
              className="p-3 rounded-lg text-sm border"
              style={{
                backgroundColor: themeColors.danger + "15",
                borderColor: themeColors.danger + "50",
                color: themeColors.danger,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="p-3 rounded-lg text-sm border"
              style={{
                backgroundColor:
                  (themeColors.success || themeColors.primary) + "15",
                borderColor:
                  (themeColors.success || themeColors.primary) + "50",
                color: themeColors.success || themeColors.primary,
              }}
            >
              {success}
            </div>
          )}
          {!isLoggedIn && (
            <div
              className="p-3 rounded-lg text-sm border"
              style={{
                backgroundColor:
                  (themeColors.warning || themeColors.primary) + "15",
                borderColor:
                  (themeColors.warning || themeColors.primary) + "50",
                color: themeColors.warning || themeColors.primary,
              }}
            >
              You are viewing blogs as public. Login as admin to add, edit, or delete blogs.
            </div>
          )}
        </div>
      )}

      {/* Blogs List */}
      <div
        className="p-6 rounded-xl border"
        style={{
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }}
      >
        <h2
          className="text-lg font-semibold mb-4 flex items-center justify-between"
          style={{ color: themeColors.text }}
        >
          <span className="flex items-center gap-2">
            <FaBlog />
            Blog Posts
          </span>
          <span className="text-xs opacity-70">
            {filteredBlogs.length} of {blogs.length} shown
          </span>
        </h2>

        {loading ? (
          <p
            className="text-sm text-center py-6"
            style={{ color: themeColors.text }}
          >
            Loading blogs...
          </p>
        ) : filteredBlogs.length === 0 ? (
          <p
            className="text-sm text-center py-6"
            style={{ color: themeColors.text }}
          >
            No blogs found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBlogs.map((blog) => (
              <div
                key={blog._id || blog.id || blog.slug}
                className="rounded-xl border flex flex-col overflow-hidden"
                style={{ borderColor: themeColors.border }}
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={blog.thumbnailImage || blog.coverImage || ""}
                    alt={blog.title}
                    className="w-full h-40 object-cover"
                  />
                  {blog.isFeatured && (
                    <span
                      className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                      style={{
                        backgroundColor: themeColors.primary + "dd",
                        color: themeColors.onPrimary,
                      }}
                    >
                      <FaStar /> Featured
                    </span>
                  )}
                  {!blog.isPublished && (
                    <span
                      className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: themeColors.danger + "dd",
                        color: themeColors.onPrimary,
                      }}
                    >
                      Draft
                    </span>
                  )}
                </div>

                {/* Content */}
                <div
                  className="p-4 flex-1 flex flex-col gap-2"
                  style={{ backgroundColor: themeColors.surface }}
                >
                  <div>
                    <h3
                      className="font-semibold text-sm mb-1"
                      style={{ color: themeColors.text }}
                    >
                      {blog.title}
                    </h3>
                    <p
                      className="text-xs opacity-75"
                      style={{ color: themeColors.text }}
                    >
                      {blog.category}
                    </p>
                  </div>

                  {blog.shortDescription && (
                    <p
                      className="text-xs mt-1 line-clamp-2"
                      style={{ color: themeColors.text }}
                    >
                      {blog.shortDescription}
                    </p>
                  )}

                  {/* Tags */}
                  {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {blog.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[11px]"
                          style={{
                            backgroundColor: themeColors.background + "60",
                            color: themeColors.text,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {blog.tags.length > 3 && (
                        <span
                          className="text-[11px] opacity-70"
                          style={{ color: themeColors.text }}
                        >
                          +{blog.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-2 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ color: themeColors.text }}
                        className="opacity-70 flex items-center gap-1"
                      >
                        <FaCalendar />
                        {fmtDate(blog.createdAt)}
                      </span>
                      <button
                        onClick={() => handleLike(blog)}
                        className="flex items-center gap-1 opacity-70 hover:opacity-100"
                        style={{ color: themeColors.text }}
                      >
                        <FaHeart />
                        {blog.likes || 0}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewBlog(blog)}
                        className="px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1"
                        style={{
                          borderColor: themeColors.border,
                          color: themeColors.text,
                        }}
                        title="View"
                      >
                        <FaEye />
                      </button>

                      {isLoggedIn && (
                        <>
                          <button
                            onClick={() => handleTogglePublished(blog)}
                            disabled={saving}
                            className="px-2 py-1 rounded-lg border text-[11px] disabled:opacity-40"
                            style={{
                              borderColor: themeColors.border,
                              color: blog.isPublished
                                ? themeColors.success || themeColors.primary
                                : themeColors.warning || "#f59e0b",
                            }}
                            title={
                              blog.isPublished
                                ? "Mark as Draft"
                                : "Publish"
                            }
                          >
                            {blog.isPublished ? (
                              <FaToggleOn />
                            ) : (
                              <FaToggleOff />
                            )}
                          </button>

                          <button
                            onClick={() => handleEdit(blog)}
                            className="px-2 py-1 rounded-lg border text-[11px]"
                            style={{
                              borderColor: themeColors.border,
                              color: themeColors.text,
                            }}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>

                          <button
                            onClick={() => handleDelete(blog)}
                            disabled={saving}
                            className="px-2 py-1 rounded-lg border text-[11px] disabled:opacity-40"
                            style={{
                              borderColor: themeColors.border,
                              color: themeColors.danger,
                            }}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => fetchBlogs(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border text-sm disabled:opacity-50"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            >
              Previous
            </button>
            <span
              className="text-sm"
              style={{ color: themeColors.text }}
            >
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => fetchBlogs(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border text-sm disabled:opacity-50"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="w-full max-w-4xl mx-4 rounded-2xl shadow-lg border max-h-[90vh] overflow-hidden flex flex-col"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: themeColors.border }}
            >
              <h2
                className="text-lg font-semibold flex items-center gap-2"
                style={{ color: themeColors.text }}
              >
                <FaPlus />
                {editing ? "Edit Blog" : "Add New Blog"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-xl leading-none px-2"
                style={{ color: themeColors.text }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="px-6 py-4 space-y-4 overflow-y-auto"
            >
              {error && (
                <div
                  className="p-2 rounded-lg text-xs border"
                  style={{
                    backgroundColor: themeColors.danger + "15",
                    borderColor: themeColors.danger + "50",
                    color: themeColors.danger,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="title"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="Latest Glass Trends 2024"
                  />
                </div>

                {/* Short Description */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="shortDescription"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Short Description
                  </label>
                  <textarea
                    id="shortDescription"
                    name="shortDescription"
                    value={form.shortDescription}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="Discover the hottest eyewear trends for this year"
                  />
                </div>

                {/* Content */}
                <div className="md:col-span-2">
                  <label
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Content <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor
                    value={editorContent}
                    onChange={setEditorContent}
                    placeholder="Start writing your blog content..."
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Category
                  </label>
                  <input
                    id="category"
                    name="category"
                    type="text"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="Fashion"
                  />
                </div>

                {/* Thumbnail Image */}
                <div>
                  <label
                    htmlFor="thumbnailImage"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Thumbnail Image URL
                  </label>
                  <input
                    id="thumbnailImage"
                    name="thumbnailImage"
                    type="url"
                    value={form.thumbnailImage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="https://example.com/thumb.jpg"
                  />
                </div>

                {/* Cover Image */}
                <div>
                  <label
                    htmlFor="coverImage"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Cover Image URL
                  </label>
                  <input
                    id="coverImage"
                    name="coverImage"
                    type="url"
                    value={form.coverImage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Tags
                  </label>
                  <div className="space-y-2">
                    {tagsList.map((tag, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) =>
                            handleTagChange(idx, e.target.value)
                          }
                          className="flex-1 px-2 py-1 rounded border text-xs"
                          style={{
                            backgroundColor: themeColors.surface,
                            borderColor: themeColors.border,
                            color: themeColors.text,
                          }}
                          placeholder="glasses"
                        />
                        <button
                          type="button"
                          onClick={() => handleTagRemove(idx)}
                          className="px-2 py-1 rounded text-[11px] border"
                          style={{
                            borderColor: themeColors.border,
                            color: themeColors.danger,
                          }}
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleTagAdd}
                    className="mt-2 px-3 py-1 rounded-lg text-xs border flex items-center gap-1"
                    style={{
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  >
                    <FaPlus /> Add Tag
                  </button>
                </div>

                {/* Meta Keywords */}
                <div>
                  <label
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Meta Keywords
                  </label>
                  <div className="space-y-2">
                    {keywordsList.map((keyword, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={keyword}
                          onChange={(e) =>
                            handleKeywordChange(idx, e.target.value)
                          }
                          className="flex-1 px-2 py-1 rounded border text-xs"
                          style={{
                            backgroundColor: themeColors.surface,
                            borderColor: themeColors.border,
                            color: themeColors.text,
                          }}
                          placeholder="eyewear"
                        />
                        <button
                          type="button"
                          onClick={() => handleKeywordRemove(idx)}
                          className="px-2 py-1 rounded text-[11px] border"
                          style={{
                            borderColor: themeColors.border,
                            color: themeColors.danger,
                          }}
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleKeywordAdd}
                    className="mt-2 px-3 py-1 rounded-lg text-xs border flex items-center gap-1"
                    style={{
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  >
                    <FaPlus /> Add Keyword
                  </button>
                </div>

                {/* Meta Title */}
                <div>
                  <label
                    htmlFor="metaTitle"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Meta Title
                  </label>
                  <input
                    id="metaTitle"
                    name="metaTitle"
                    type="text"
                    value={form.metaTitle}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="Glass Trends 2024 - Fashion Guide"
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <label
                    htmlFor="metaDescription"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={form.metaDescription}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="Complete guide to latest eyewear trends"
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-4 md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      id="isPublished"
                      name="isPublished"
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    <span
                      className="text-sm"
                      style={{ color: themeColors.text }}
                    >
                      Published
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      id="isFeatured"
                      name="isFeatured"
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    <span
                      className="text-sm"
                      style={{ color: themeColors.text }}
                    >
                      Featured
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg text-sm border disabled:opacity-50"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !isLoggedIn}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: themeColors.primary,
                    color: themeColors.onPrimary,
                  }}
                >
                  {saving
                    ? editing
                      ? "Saving..."
                      : "Creating..."
                    : editing
                    ? "Save Changes"
                    : "Create Blog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Blog Modal */}
      {viewBlog && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div
            className="w-full max-w-4xl mx-4 rounded-2xl shadow-lg border max-h-[90vh] overflow-hidden flex flex-col"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: themeColors.border }}
            >
              <div className="flex items-center gap-2">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: themeColors.text }}
                >
                  {viewBlog.title}
                </h2>
                {viewBlog.isFeatured && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                    style={{
                      backgroundColor: themeColors.primary + "15",
                      color: themeColors.primary,
                    }}
                  >
                    <FaStar /> Featured
                  </span>
                )}
                <span
                  className="px-2 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: viewBlog.isPublished
                      ? (themeColors.success || themeColors.primary) + "15"
                      : themeColors.border,
                    color: viewBlog.isPublished
                      ? themeColors.success || themeColors.primary
                      : themeColors.text,
                  }}
                >
                  {viewBlog.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <button
                onClick={() => setViewBlog(null)}
                className="text-xl leading-none px-2"
                style={{ color: themeColors.text }}
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Images */}
                <div className="space-y-3">
                  {viewBlog.coverImage && (
                    <div>
                      <p
                        className="text-xs mb-2 font-medium"
                        style={{ color: themeColors.text }}
                      >
                        Cover Image
                      </p>
                      <img
                        src={viewBlog.coverImage}
                        alt={viewBlog.title}
                        className="w-full h-40 object-cover rounded-lg border"
                        style={{ borderColor: themeColors.border }}
                      />
                    </div>
                  )}
                  {viewBlog.thumbnailImage && (
                    <div>
                      <p
                        className="text-xs mb-2 font-medium"
                        style={{ color: themeColors.text }}
                      >
                        Thumbnail
                      </p>
                      <img
                        src={viewBlog.thumbnailImage}
                        alt={viewBlog.title}
                        className="w-32 h-20 object-cover rounded-lg border"
                        style={{ borderColor: themeColors.border }}
                      />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div>
                    <p
                      className="text-xs uppercase font-semibold mb-1"
                      style={{ color: themeColors.text }}
                    >
                      Category
                    </p>
                    <p style={{ color: themeColors.text }}>
                      {viewBlog.category || "-"}
                    </p>
                  </div>

                  {viewBlog.shortDescription && (
                    <div>
                      <p
                        className="text-xs uppercase font-semibold mb-1"
                        style={{ color: themeColors.text }}
                      >
                        Short Description
                      </p>
                      <p style={{ color: themeColors.text }}>
                        {viewBlog.shortDescription}
                      </p>
                    </div>
                  )}

                  {Array.isArray(viewBlog.tags) && viewBlog.tags.length > 0 && (
                    <div>
                      <p
                        className="text-xs uppercase font-semibold mb-1"
                        style={{ color: themeColors.text }}
                      >
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {viewBlog.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-[11px]"
                            style={{
                              backgroundColor: themeColors.background + "60",
                              color: themeColors.text,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-xs opacity-70 space-y-1">
                    <p style={{ color: themeColors.text }}>
                      Created: {fmtDate(viewBlog.createdAt)}
                    </p>
                    {viewBlog.updatedAt && (
                      <p style={{ color: themeColors.text }}>
                        Updated: {fmtDate(viewBlog.updatedAt)}
                      </p>
                    )}
                    <p style={{ color: themeColors.text }}>
                      Likes: {viewBlog.likes || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              {viewBlog.content && (
                <div>
                  <p
                    className="text-xs uppercase font-semibold mb-2"
                    style={{ color: themeColors.text }}
                  >
                    Content
                  </p>
                  <div
                    className="prose prose-sm max-w-none p-4 rounded-lg border"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    dangerouslySetInnerHTML={{ __html: viewBlog.content }}
                  />
                </div>
              )}

              {/* Meta Information */}
              {(viewBlog.metaTitle || viewBlog.metaDescription) && (
                <div>
                  <p
                    className="text-xs uppercase font-semibold mb-2"
                    style={{ color: themeColors.text }}
                  >
                    SEO Meta
                  </p>
                  <div
                    className="p-3 rounded-lg border space-y-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                    }}
                  >
                    {viewBlog.metaTitle && (
                      <div>
                        <p
                          className="text-[11px] font-semibold mb-1"
                          style={{ color: themeColors.text }}
                        >
                          Meta Title
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {viewBlog.metaTitle}
                        </p>
                      </div>
                    )}
                    {viewBlog.metaDescription && (
                      <div>
                        <p
                          className="text-[11px] font-semibold mb-1"
                          style={{ color: themeColors.text }}
                        >
                          Meta Description
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {viewBlog.metaDescription}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                {isLoggedIn && (
                  <button
                    onClick={() => {
                      handleEdit(viewBlog);
                      setViewBlog(null);
                    }}
                    className="px-3 py-2 rounded-lg text-xs border flex items-center gap-1"
                    style={{
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  >
                    <FaEdit /> Edit
                  </button>
                )}
                <button
                  onClick={() => setViewBlog(null)}
                  className="px-3 py-2 rounded-lg text-xs border"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}