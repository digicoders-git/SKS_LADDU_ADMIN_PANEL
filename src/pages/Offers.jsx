// src/pages/Offers.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import {
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} from "../apis/offers";
import {
  FaTags,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// ---------- helpers ----------
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "-";

const fmtCurrency = (n) =>
  typeof n === "number"
    ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : n ?? "-";

const emptyForm = {
  code: "",
  title: "",
  description: "",
  discountType: "percentage", // "percentage" | "flat"
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  isActive: true,
};

export default function Offers() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // offer being edited
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [search, setSearch] = useState("");

  // ---------- fetch ----------
  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listOffers();
      setOffers(list);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load offers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
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

  // SPECIAL: offer code change handler (upper-case)
  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setForm((prev) => ({
      ...prev,
      code: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleEdit = (offer) => {
    setEditing(offer);
    setForm({
      code: offer.code || "",
      title: offer.title || "",
      description: offer.description || "",
      discountType: offer.discountType || "percentage",
      discountValue:
        typeof offer.discountValue === "number"
          ? String(offer.discountValue)
          : offer.discountValue || "",
      minOrderAmount:
        typeof offer.minOrderAmount === "number"
          ? String(offer.minOrderAmount)
          : offer.minOrderAmount || "",
      maxDiscountAmount:
        typeof offer.maxDiscountAmount === "number"
          ? String(offer.maxDiscountAmount)
          : offer.maxDiscountAmount || "",
      isActive:
        typeof offer.isActive === "boolean" ? offer.isActive : true,
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const buildPayload = () => {
    const payload = {
      code: form.code.trim(),
      title: form.title.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      minOrderAmount:
        form.minOrderAmount === ""
          ? undefined
          : Number(form.minOrderAmount) || 0,
      maxDiscountAmount:
        form.maxDiscountAmount === ""
          ? undefined
          : Number(form.maxDiscountAmount) || 0,
      description: form.description.trim(),
      isActive: form.isActive,
    };

    // remove undefined/empty keys
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined || payload[k] === "") {
        delete payload[k];
      }
    });

    return payload;
  };

  const handleDelete = async (offer) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to delete offers.");
      return;
    }

    const id = offer._id || offer.id;
    if (!id) {
      setError("Cannot delete this offer (missing identifier).");
      return;
    }

    const result = await Swal.fire({
      title: `Delete offer "${offer.code}"?`,
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
      await deleteOffer(id);
      setSuccess("Offer deleted successfully.");
      await fetchOffers();
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Offer deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to delete offer.";
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
      setError("You must be logged in as admin to manage offers.");
      return;
    }

    if (!form.code.trim()) {
      setError("Offer code is required.");
      return;
    }
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.discountType) {
      setError("Discount type is required.");
      return;
    }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      setError("Discount value must be greater than 0.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = buildPayload();

      if (editing) {
        const id = editing._id || editing.id;
        if (!id) throw new Error("Missing offer identifier for update.");
        await updateOffer(id, payload);
        setSuccess("Offer updated successfully.");
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Offer updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createOffer(payload);
        setSuccess("Offer created successfully.");
        Swal.fire({
          icon: "success",
          title: "Created",
          text: "Offer created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      resetForm();
      setIsModalOpen(false);
      await fetchOffers();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to save offer.";
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

  const filteredOffers = useMemo(() => {
    if (!search.trim()) return offers;
    const q = search.toLowerCase();
    return offers.filter((o) => {
      const code = (o.code || "").toLowerCase();
      const title = (o.title || "").toLowerCase();
      const desc = (o.description || "").toLowerCase();
      return (
        code.includes(q) || title.includes(q) || desc.includes(q)
      );
    });
  }, [offers, search]);

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
            <FaTags />
            Offers & Coupons
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Manage discount codes and promotional offers for your
            store.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs opacity-70">
              <FaSearch style={{ color: themeColors.text }} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search offers..."
              className="pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            />
          </div>

          <button
            onClick={fetchOffers}
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
              isLoggedIn ? "Create offer" : "Login as admin to add"
            }
          >
            <FaPlus />
            New Offer
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
              You are viewing offers in read-only mode. Login as admin
              to create, edit, or delete offers.
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
            <FaTags />
            Offer List
          </span>
          <span className="text-xs opacity-70">
            {filteredOffers.length} of {offers.length} shown
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
                  "Code",
                  "Title",
                  "Type",
                  "Value",
                  "Limits",
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
                    colSpan={8}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    Loading offers...
                  </td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    No offers found.
                  </td>
                </tr>
              ) : (
                filteredOffers.map((o) => (
                  <tr key={o._id || o.id}>
                    <td
                      className="px-4 py-2 font-mono text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {o.code}
                    </td>
                    <td
                      className="px-4 py-2"
                      style={{ color: themeColors.text }}
                    >
                      {o.title}
                      {o.description && (
                        <div className="text-xs opacity-70">
                          {o.description}
                        </div>
                      )}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {o.discountType === "percentage"
                        ? "Percentage"
                        : "Flat"}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {o.discountType === "percentage"
                        ? `${o.discountValue}%`
                        : fmtCurrency(o.discountValue)}
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      <div>
                        Min Order:{" "}
                        {o.minOrderAmount
                          ? fmtCurrency(o.minOrderAmount)
                          : "-"}
                      </div>
                      <div>
                        Max Discount:{" "}
                        {o.maxDiscountAmount
                          ? fmtCurrency(o.maxDiscountAmount)
                          : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: o.isActive
                            ? (themeColors.success ||
                                themeColors.primary) + "15"
                            : themeColors.border,
                          color: o.isActive
                            ? themeColors.success ||
                              themeColors.primary
                            : themeColors.text,
                        }}
                      >
                        {o.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2 text-xs"
                      style={{ color: themeColors.text }}
                    >
                      {o.createdAt ? fmtDate(o.createdAt) : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(o)}
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
                        <button
                          type="button"
                          onClick={() => handleDelete(o)}
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
            className="w-full max-w-xl mx-4 rounded-2xl shadow-lg border max-h-[90vh] overflow-hidden flex flex-col"
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
                {editing ? "Edit Offer" : "Create Offer"}
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

              <div className="space-y-3">
                {/* Code */}
                <div>
                  <label
                    htmlFor="code"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Offer Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    value={form.code}
                    onChange={handleCodeChange}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 font-mono"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="WELCOME10"
                  />
                </div>

                {/* Title */}
                <div>
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
                    placeholder="Flat 10% Off"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="Optional short description for this offer..."
                  />
                </div>

                {/* Discount row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="discountType"
                      className="block mb-1 text-sm font-medium"
                      style={{ color: themeColors.text }}
                    >
                      Discount Type
                    </label>
                    <select
                      id="discountType"
                      name="discountType"
                      value={form.discountType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                        color: themeColors.text,
                      }}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="flat">Flat Amount</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="discountValue"
                      className="block mb-1 text-sm font-medium"
                      style={{ color: themeColors.text }}
                    >
                      Value <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="discountValue"
                      name="discountValue"
                      type="number"
                      min="0"
                      value={form.discountValue}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                        color: themeColors.text,
                      }}
                      placeholder={
                        form.discountType === "percentage"
                          ? "10"
                          : "500"
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <span
                      className="text-xs opacity-70"
                      style={{ color: themeColors.text }}
                    >
                      {form.discountType === "percentage"
                        ? "Value in % (e.g. 10)"
                        : "Flat discount in ₹ (e.g. 500)"}
                    </span>
                  </div>
                </div>

                {/* Min / Max */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="minOrderAmount"
                      className="block mb-1 text-sm font-medium"
                      style={{ color: themeColors.text }}
                    >
                      Min Order Amount (₹)
                    </label>
                    <input
                      id="minOrderAmount"
                      name="minOrderAmount"
                      type="number"
                      min="0"
                      value={form.minOrderAmount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                        color: themeColors.text,
                      }}
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="maxDiscountAmount"
                      className="block mb-1 text-sm font-medium"
                      style={{ color: themeColors.text }}
                    >
                      Max Discount Amount (₹)
                    </label>
                    <input
                      id="maxDiscountAmount"
                      name="maxDiscountAmount"
                      type="number"
                      min="0"
                      value={form.maxDiscountAmount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                        color: themeColors.text,
                      }}
                      placeholder="500"
                    />
                  </div>
                </div>

                {/* Active */}
                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm"
                    style={{ color: themeColors.text }}
                  >
                    Active
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
                    : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
