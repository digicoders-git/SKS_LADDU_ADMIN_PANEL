// src/pages/ReviewVideos.jsx
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import {
  listVideos,
  createVideo,
  deleteVideo,
} from "../apis/videos";
import {
  FaVideo,
  FaPlus,
  FaTrash,
  FaSyncAlt,
  FaPlay,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// ---------- helpers ----------
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "-";

export default function ReviewVideos() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // ---------- fetch ----------
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listVideos();
      setVideos(list);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load videos."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const resetForm = () => {
    setVideoFile(null);
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    } else {
      setVideoFile(null);
    }
  };

  const handleDelete = async (video) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to delete videos.");
      return;
    }

    const id = video._id || video.id;
    if (!id) {
      setError("Cannot delete this video (missing identifier).");
      return;
    }

    const result = await Swal.fire({
      title: "Delete video?",
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
      await deleteVideo(id);
      setSuccess("Video deleted successfully.");
      await fetchVideos();
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Video deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to delete video.";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setError("You must be logged in as admin to manage videos.");
      return;
    }

    if (!videoFile) {
      setError("Video file is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const fd = new FormData();
      fd.append("video", videoFile);

      await createVideo(fd);
      setSuccess("Video uploaded successfully.");
      Swal.fire({
        icon: "success",
        title: "Uploaded",
        text: "Video uploaded successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      resetForm();
      setIsModalOpen(false);
      await fetchVideos();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to upload video.";
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

  return (
    <div
      className="space-y-6"
      style={{ fontFamily: currentFont.family }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaVideo />
            Review Videos
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Manage review videos for your website.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchVideos}
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
            title={
              isLoggedIn ? "Upload video" : "Login as admin to add"
            }
          >
            <FaPlus />
            Upload Video
          </button>
        </div>
      </div>

      {/* Messages */}
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
                  (themeColors.success || themeColors.primary) +
                  "15",
                borderColor:
                  (themeColors.success || themeColors.primary) +
                  "50",
                color:
                  themeColors.success || themeColors.primary,
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
                  (themeColors.warning || themeColors.primary) +
                  "15",
                borderColor:
                  (themeColors.warning || themeColors.primary) +
                  "50",
                color:
                  themeColors.warning || themeColors.primary,
              }}
            >
              You are viewing videos in read-only mode. Login as admin
              to upload or delete videos.
            </div>
          )}
        </div>
      )}

      {/* Video Grid */}
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
            <FaVideo />
            Videos ({videos.length})
          </span>
        </h2>

        {loading ? (
          <div
            className="text-center py-8"
            style={{ color: themeColors.text }}
          >
            Loading videos...
          </div>
        ) : videos.length === 0 ? (
          <div
            className="text-center py-8"
            style={{ color: themeColors.text }}
          >
            No videos found.
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video._id || video.id}
                className="flex items-center gap-4 p-4 rounded-lg border"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                }}
              >
                <div 
                  className="w-32 h-20 bg-black rounded cursor-pointer relative overflow-hidden"
                  onClick={() => setSelectedVideo(video)}
                >
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaPlay className="text-white text-lg opacity-70" />
                  </div>
                </div>
                <div className="flex-1">
                  <div
                    className="text-sm opacity-70"
                    style={{ color: themeColors.text }}
                  >
                    Uploaded: {fmtDate(video.createdAt)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(video)}
                  disabled={!isLoggedIn || saving}
                  className="p-2 rounded-lg border disabled:opacity-40"
                  style={{
                    borderColor: themeColors.border,
                    color: themeColors.danger,
                  }}
                  title={isLoggedIn ? "Delete" : "Login as admin to delete"}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Full View Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative max-w-4xl w-full mx-4">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:opacity-70"
            >
              ×
            </button>
            <video
              src={selectedVideo.url}
              className="w-full rounded-lg"
              controls
              autoPlay
            />
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div
            className="w-full max-w-md mx-4 rounded-2xl shadow-lg border"
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
                Upload Video
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
              className="px-6 py-4 space-y-4"
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

              {/* Video picker */}
              <div>
                <label
                  htmlFor="videoFile"
                  className="block mb-1 text-sm font-medium"
                  style={{ color: themeColors.text }}
                >
                  Video File <span className="text-red-500">*</span>
                </label>

                <label
                  className="w-full flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer text-sm transition hover:border-opacity-80"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background + "40",
                    color: themeColors.text,
                  }}
                >
                  <input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  <FaVideo className="text-xl mb-2 opacity-80" />
                  <span className="font-medium">
                    {videoFile
                      ? "Change selected video"
                      : "Click to choose video"}
                  </span>
                  <span className="text-xs opacity-70 mt-1">
                    Supported formats: MP4, AVI, MOV
                  </span>
                </label>

                {videoFile && (
                  <div className="mt-3">
                    <p
                      className="text-xs mb-1 opacity-70"
                      style={{ color: themeColors.text }}
                    >
                      Selected: {videoFile.name}
                    </p>
                  </div>
                )}
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
                  {saving ? "Uploading..." : "Upload Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}