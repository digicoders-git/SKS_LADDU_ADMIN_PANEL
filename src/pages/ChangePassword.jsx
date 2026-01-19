// src/pages/ChangePassword.jsx
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { changePassword } from "../apis/admin";
import { FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";

export default function ChangePassword() {
  const { themeColors } = useTheme();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.currentPassword.trim())
      return setError("Current password is required.");

    if (!form.newPassword.trim())
      return setError("New password is required.");

    if (form.newPassword.length < 8)
      return setError("New password must be at least 8 characters.");

    if (form.newPassword !== form.confirmPassword)
      return setError("New password & confirm password must match.");

    try {
      setLoading(true);
      setError("");

      const payload = {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      };

      const res = await changePassword(payload);

      Swal.fire({
        icon: "success",
        title: "Password Updated",
        text: "Your password was changed successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to change password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="max-w-xl mx-auto p-6 rounded-xl border"
      style={{
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      }}
    >
      <h1
        className="text-2xl font-bold flex items-center gap-2 mb-4"
        style={{ color: themeColors.text }}
      >
        <FaKey />
        Change Password
      </h1>

      {error && (
        <div
          className="p-3 rounded-lg text-sm border mb-4"
          style={{
            backgroundColor: themeColors.danger + "15",
            borderColor: themeColors.danger + "40",
            color: themeColors.danger,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>
            Current Password
          </label>
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
              placeholder="Enter current password"
            />
            <span
              className="absolute right-3 top-3 cursor-pointer opacity-70"
              onClick={() => setShowOld(!showOld)}
            >
              {showOld ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
              placeholder="New strong password"
            />
            <span
              className="absolute right-3 top-3 cursor-pointer opacity-70"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block mb-1 text-sm font-medium" style={{ color: themeColors.text }}>
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
              placeholder="Re-enter new password"
            />
            <span
              className="absolute right-3 top-3 cursor-pointer opacity-70"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
          style={{
            backgroundColor: themeColors.primary,
            color: themeColors.onPrimary,
          }}
        >
          {loading ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
