// src/pages/Enquiries.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { listEnquiries, updateEnquiry } from "../apis/enquiry";
import {
  FaEnvelopeOpenText,
  FaSyncAlt,
  FaSearch,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

// Possible enquiry statuses (assumption)
const STATUS_OPTIONS = ["new", "in-progress", "resolved", "closed"];

export default function Enquiries() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selected, setSelected] = useState(null); // detail view right panel

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listEnquiries();
      setEnquiries(list);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load enquiries."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleUpdate = async (enquiry, extra = {}) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to update enquiries.");
      return;
    }

    const id = enquiry._id || enquiry.id;
    if (!id) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        status: enquiry.status,
        isRead: enquiry.isRead,
        ...extra,
      };

      await updateEnquiry(id, payload);

      setEnquiries((prev) =>
        prev.map((e) =>
          (e._id || e.id) === id ? { ...e, ...payload } : e
        )
      );

      if (selected && (selected._id || selected.id) === id) {
        setSelected((prev) => ({ ...prev, ...payload }));
      }

      setSuccess("Enquiry updated successfully.");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to update enquiry.";
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

  const handleStatusChange = async (enquiry, newStatus) => {
    if (newStatus === enquiry.status) return;
    await handleUpdate(enquiry, { status: newStatus });
  };

  const handleMarkReadToggle = async (enquiry) => {
    await handleUpdate(enquiry, { isRead: !enquiry.isRead });
  };

  const filteredEnquiries = useMemo(() => {
    let list = enquiries;

    if (statusFilter !== "all") {
      list = list.filter((e) => e.status === statusFilter);
    }

    if (showUnreadOnly) {
      list = list.filter((e) => !e.isRead);
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();

    return list.filter((e) => {
      const name = (e.name || "").toLowerCase();
      const email = (e.email || "").toLowerCase();
      const phone = (e.phone || "").toLowerCase();
      const subject = (e.subject || "").toLowerCase();
      const message = (e.message || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        subject.includes(q) ||
        message.includes(q)
      );
    });
  }, [enquiries, search, statusFilter, showUnreadOnly]);

  const statusBadgeStyle = (status) => {
    const base = {
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "0.75rem",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    };

    switch (status) {
      case "in-progress":
        return {
          ...base,
          backgroundColor: "#f9731620",
          color: "#f97316",
        };
      case "resolved":
        return {
          ...base,
          backgroundColor:
            (themeColors.success || themeColors.primary) + "20",
          color: themeColors.success || themeColors.primary,
        };
      case "closed":
        return {
          ...base,
          backgroundColor: themeColors.border,
          color: themeColors.text,
        };
      default: // new
        return {
          ...base,
          backgroundColor: "#0ea5e920",
          color: "#0ea5e9",
        };
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
            <FaEnvelopeOpenText />
            Customer Enquiries
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            View and manage contact form enquiries from your website.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.text,
            }}
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Unread only */}
          <label
            className="flex items-center gap-1 text-xs md:text-sm px-2 py-1 rounded-lg border cursor-pointer"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.text,
            }}
          >
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
            />
            Unread only
          </label>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs opacity-70">
              <FaSearch style={{ color: themeColors.text }} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, subject..."
              className="pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchEnquiries}
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
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
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
        </div>
      )}

      {/* Layout: Table + Detail panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table side */}
        <div
          className="xl:col-span-2 p-6 rounded-xl border"
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
              <FaEnvelopeOpenText />
              Enquiry List
            </span>
            <span className="text-xs opacity-70">
              {filteredEnquiries.length} of {enquiries.length} shown
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
                    "Name",
                    "Contact",
                    "Subject",
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
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm"
                      style={{ color: themeColors.text }}
                    >
                      Loading enquiries...
                    </td>
                  </tr>
                ) : filteredEnquiries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm"
                      style={{ color: themeColors.text }}
                    >
                      No enquiries found.
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((e) => {
                    const id = e._id || e.id || "-";
                    const isSelected =
                      selected && (selected._id || selected.id) === id;

                    return (
                      <tr
                        key={id}
                        className="cursor-pointer"
                        onClick={() => setSelected(e)}
                        style={{
                          backgroundColor: isSelected
                            ? themeColors.background + "50"
                            : "transparent",
                        }}
                      >
                        {/* Name */}
                        <td
                          className="px-4 py-2"
                          style={{ color: themeColors.text }}
                        >
                          <div className="flex items-center gap-2">
                            {!e.isRead && (
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    themeColors.primary ||
                                    "#3b82f6",
                                }}
                              />
                            )}
                            <span className="font-medium">
                              {e.name || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {e.email && (
                            <div className="opacity-80">{e.email}</div>
                          )}
                          {e.phone && (
                            <div className="opacity-80">{e.phone}</div>
                          )}
                        </td>

                        {/* Subject + message snippet */}
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          <div className="font-medium">
                            {e.subject || "-"}
                          </div>
                          {e.message && (
                            <div className="opacity-70 line-clamp-1">
                              {e.message}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-2 text-xs">
                          <div style={statusBadgeStyle(e.status || "new")}>
                            {e.status || "new"}
                          </div>
                          <div className="mt-2">
                            <select
                              value={e.status || "new"}
                              disabled={!isLoggedIn || saving}
                              onChange={(ev) =>
                                handleStatusChange(e, ev.target.value)
                              }
                              className="mt-1 px-2 py-1 rounded-lg border text-xs"
                              style={{
                                backgroundColor: themeColors.surface,
                                borderColor: themeColors.border,
                                color: themeColors.text,
                              }}
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s.charAt(0).toUpperCase() +
                                    s.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Created */}
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {fmtDateTime(e.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-2 text-xs">
                          <button
                            type="button"
                            disabled={!isLoggedIn || saving}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleMarkReadToggle(e);
                            }}
                            className="px-2 py-1 rounded-lg border text-xs disabled:opacity-40"
                            style={{
                              borderColor: themeColors.border,
                              color: themeColors.text,
                              backgroundColor: themeColors.surface,
                            }}
                          >
                            {e.isRead ? "Mark as unread" : "Mark as read"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          }}
        >
          <h2
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaEnvelopeOpenText />
            Enquiry Details
          </h2>

          {!selected ? (
            <p
              className="text-sm opacity-70"
              style={{ color: themeColors.text }}
            >
              Select an enquiry from the list to view full details.
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="font-semibold text-base"
                    style={{ color: themeColors.text }}
                  >
                    {selected.name || "—"}
                  </div>
                  <div
                    className="text-xs opacity-70"
                    style={{ color: themeColors.text }}
                  >
                    {fmtDateTime(selected.createdAt)}
                  </div>
                </div>
                <div style={statusBadgeStyle(selected.status || "new")}>
                  {selected.status || "new"}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: themeColors.text }}
                >
                  Contact
                </h3>
                <div
                  className="space-y-1 text-sm"
                  style={{ color: themeColors.text }}
                >
                  {selected.email && <div>Email: {selected.email}</div>}
                  {selected.phone && <div>Phone: {selected.phone}</div>}
                </div>
              </div>

              {/* Subject */}
              <div>
                <h3
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: themeColors.text }}
                >
                  Subject
                </h3>
                <p style={{ color: themeColors.text }}>
                  {selected.subject || "—"}
                </p>
              </div>

              {/* Message */}
              <div>
                <h3
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: themeColors.text }}
                >
                  Message
                </h3>
                <div
                  className="p-3 rounded-lg border text-sm whitespace-pre-wrap"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background + "40",
                    color: themeColors.text,
                  }}
                >
                  {selected.message || "—"}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={!isLoggedIn || saving}
                  onClick={() => handleMarkReadToggle(selected)}
                  className="px-3 py-2 rounded-lg text-xs border disabled:opacity-40"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  {selected.isRead ? "Mark as unread" : "Mark as read"}
                </button>

                <select
                  value={selected.status || "new"}
                  disabled={!isLoggedIn || saving}
                  onChange={(e) =>
                    handleStatusChange(selected, e.target.value)
                  }
                  className="px-3 py-2 rounded-lg border text-xs"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
