// src/pages/Sliders.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import {
  listSliders,
  createSlider,
  updateSlider,
  deleteSlider,
  toggleSliderStatus,
} from "../apis/sliders";
import {
  FaImages,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
  FaLink,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// ---------- helpers ----------
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "-";

const emptyForm = {};

export default function Sliders() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // slider being edited
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [search, setSearch] = useState("");

  // ---------- fetch ----------
  const fetchSliders = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listSliders(statusFilter);
      setSliders(list);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load sliders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, [statusFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview("");
    }
  };

  const handleEdit = (slider) => {
    setEditing(slider);
    setForm({});
    setImageFile(null);
    setImagePreview(slider.image?.url || "");
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const buildFormData = () => {
    const fd = new FormData();
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  const handleDelete = async (slider) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to delete sliders.");
      return;
    }

    const id = slider._id || slider.id;
    if (!id) {
      setError("Cannot delete this slider (missing identifier).");
      return;
    }

    const result = await Swal.fire({
      title: `Delete slider "${slider.title}"?`,
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
      await deleteSlider(id);
      setSuccess("Slider deleted successfully.");
      await fetchSliders();
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Slider deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to delete slider.";
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

  // ---------- Active / Inactive toggle ----------
  const handleToggleStatus = async (slider) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to change status.");
      return;
    }

    const id = slider._id || slider.id;
    if (!id) {
      setError("Cannot update this slider (missing identifier).");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await toggleSliderStatus(id);
      await fetchSliders();

      setSuccess(
        `Slider ${!slider.isActive ? "activated" : "deactivated"} successfully.`
      );

      Swal.fire({
        icon: "success",
        title: !slider.isActive ? "Activated" : "Deactivated",
        text: `Slider ${!slider.isActive ? "activated" : "deactivated"} successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to update slider status.";
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
      setError("You must be logged in as admin to manage sliders.");
      return;
    }

    if (!imageFile && !editing) {
      setError("Slider image is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const fd = buildFormData();

      if (editing) {
        const id = editing._id || editing.id;
        if (!id) throw new Error("Missing slider identifier for update.");
        await updateSlider(id, fd);
        setSuccess("Slider updated successfully.");
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Slider updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createSlider(fd);
        setSuccess("Slider created successfully.");
        Swal.fire({
          icon: "success",
          title: "Created",
          text: "Slider created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      resetForm();
      setIsModalOpen(false);
      await fetchSliders();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to save slider.";
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

  const filteredSliders = useMemo(() => {
    let list = sliders;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => {
        return true; // No text fields to search
      });
    }

    // sort by sortOrder ascending, then createdAt desc
    return [...list].sort((a, b) => {
      const sa = a.sortOrder ?? 9999;
      const sb = b.sortOrder ?? 9999;
      if (sa !== sb) return sa - sb;
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });
  }, [sliders, search]);

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
            <FaImages />
            Homepage Sliders
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Manage home page banner sliders with images, text and links.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg border"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === "active" ? "" : "opacity-60"
              }`}
              style={{
                backgroundColor: statusFilter === "active" ? themeColors.primary : "transparent",
                color: statusFilter === "active" ? themeColors.onPrimary : themeColors.text,
              }}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === "inactive" ? "" : "opacity-60"
              }`}
              style={{
                backgroundColor: statusFilter === "inactive" ? themeColors.primary : "transparent",
                color: statusFilter === "inactive" ? themeColors.onPrimary : themeColors.text,
              }}
            >
              Inactive
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs opacity-70">
              <FaSearch style={{ color: themeColors.text }} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sliders..."
              className="pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
              disabled
            />
          </div>

          <button
            onClick={fetchSliders}
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
              isLoggedIn ? "Create slider" : "Login as admin to add"
            }
          >
            <FaPlus />
            New Slider
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
              You are viewing sliders in read-only mode. Login as admin
              to create, edit, or delete sliders.
            </div>
          )}
        </div>
      )}

      {/* Table */}
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
            <FaImages />
            {statusFilter === "active" ? "Active" : "Inactive"} Sliders
          </span>
          <span className="text-xs opacity-70">
            {filteredSliders.length} of {sliders.length} shown
          </span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: themeColors.background + "30",
                }}
              >
                {[
                  "Image",
                  "Status",
                  "Created",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: themeColors.text }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: themeColors.border }}
            >
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    Loading sliders...
                  </td>
                </tr>
              ) : filteredSliders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    No sliders found.
                  </td>
                </tr>
              ) : (
                filteredSliders.map((s) => (
                  <tr key={s._id || s.id}>
                    {/* Image */}
                    <td className="px-4 py-2">
                      {s.image?.url ? (
                        <img
                          src={s.image.url}
                          alt={s.title}
                          className="h-16 w-32 object-cover rounded-lg border"
                          style={{ borderColor: themeColors.border }}
                        />
                      ) : (
                        <div
                          className="h-16 w-32 rounded-lg border flex items-center justify-center text-xs"
                          style={{
                            borderColor: themeColors.border,
                            color: themeColors.text,
                          }}
                        >
                          No image
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: s.isActive
                            ? (themeColors.success ||
                                themeColors.primary) + "15"
                            : themeColors.border,
                          color: s.isActive
                            ? themeColors.success ||
                              themeColors.primary
                            : themeColors.text,
                        }}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Created */}
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {fmtDate(s.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {/* Active/Inactive Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s)}
                          disabled={!isLoggedIn || saving}
                          className="p-2 rounded-lg border text-xs disabled:opacity-40"
                          style={{
                            borderColor: themeColors.border,
                            color: s.isActive
                              ? themeColors.warning || "#f59e0b"
                              : themeColors.success ||
                                themeColors.primary,
                          }}
                          title={
                            isLoggedIn
                              ? s.isActive
                                ? "Mark as Inactive"
                                : "Mark as Active"
                              : "Login as admin to change status"
                          }
                        >
                          {s.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleEdit(s)}
                          disabled={!isLoggedIn}
                          className="p-2 rounded-lg border text-xs disabled:opacity-40"
                          style={{
                            borderColor: themeColors.border,
                            color: themeColors.text,
                          }}
                          title={
                            isLoggedIn
                              ? "Edit"
                              : "Login as admin to edit"
                          }
                        >
                          <FaEdit />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          disabled={!isLoggedIn || saving}
                          className="p-2 rounded-lg border text-xs disabled:opacity-40"
                          style={{
                            borderColor: themeColors.border,
                            color: themeColors.danger,
                          }}
                          title={
                            isLoggedIn
                              ? "Delete"
                              : "Login as admin to delete"
                          }
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div
            className="w-full max-w-3xl mx-4 rounded-2xl shadow-lg border max-h-[90vh] overflow-hidden flex flex-col"
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
                {editing ? "Edit Slider" : "Create Slider"}
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

              <div className="space-y-4">
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

                {/* Image picker - nicer design */}
                <div>
                  <label
                    htmlFor="sliderImage"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Slider Image <span className="text-red-500">*</span>
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
                      id="sliderImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <FaImages className="text-xl mb-2 opacity-80" />
                    <span className="font-medium">
                      {imageFile
                        ? "Change selected image"
                        : "Click to choose image"}
                    </span>
                    <span className="text-xs opacity-70 mt-1">
                      Recommended: wide banner image (JPG/PNG)
                    </span>
                  </label>

                  {(imagePreview || editing?.image?.url) && (
                    <div className="mt-3">
                      <p
                        className="text-xs mb-1 opacity-70"
                        style={{ color: themeColors.text }}
                      >
                        Preview:
                      </p>
                      <img
                        src={imagePreview || editing?.image?.url}
                        alt="Preview"
                        className="w-full max-h-48 object-cover rounded-xl border"
                        style={{ borderColor: themeColors.border }}
                      />
                      {editing && !imageFile && (
                        <p
                          className="text-xs mt-1 opacity-70"
                          style={{ color: themeColors.text }}
                        >
                          Uploading a new image will replace the existing
                          one.
                        </p>
                      )}
                    </div>
                  )}
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
                    : "Create Slider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
