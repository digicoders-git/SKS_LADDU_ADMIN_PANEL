// src/pages/PayMethods.jsx
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { getPaymentMethods, updatePaymentMethodStatus, updatePaymentMethodName } from "../apis/paymentMethods";
import { FaMoneyBillWave, FaSyncAlt, FaEdit, FaTimes, FaSave } from "react-icons/fa";
import Swal from "sweetalert2";

function PayMethods() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();

  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const fetchMethods = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getPaymentMethods();
      // Response is direct array, not wrapped in object
      setMethods(Array.isArray(response) ? response : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load payment methods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleToggleStatus = async (method) => {
    try {
      const newStatus = !method.status;
      await updatePaymentMethodStatus(method._id, newStatus);
      
      setMethods(prev => 
        prev.map(m => m._id === method._id ? { ...m, status: newStatus } : m)
      );
      
      setSuccess(`${method.name} ${newStatus ? "enabled" : "disabled"} successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update status");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleEditClick = (method) => {
    setEditingId(method._id);
    setEditName(method.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      setError("Name cannot be empty");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      await updatePaymentMethodName(id, editName.trim());
      
      setMethods(prev => 
        prev.map(m => m._id === id ? { ...m, name: editName.trim() } : m)
      );
      
      setSuccess("Payment method updated successfully");
      setTimeout(() => setSuccess(""), 3000);
      setEditingId(null);
      setEditName("");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update name");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: currentFont.family }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <FaMoneyBillWave />
            Payment Methods
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Manage payment methods for your store.
          </p>
        </div>

        <button
          onClick={fetchMethods}
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
                backgroundColor: (themeColors.success || themeColors.primary) + "15",
                borderColor: (themeColors.success || themeColors.primary) + "50",
                color: themeColors.success || themeColors.primary,
              }}
            >
              {success}
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
            <FaMoneyBillWave />
            Payment Methods List
          </span>
          <span className="text-xs opacity-70">
            {methods.length} method(s)
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
                {["Name", "Status", "Actions"].map((h) => (
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
                    colSpan={3}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    Loading payment methods...
                  </td>
                </tr>
              ) : methods.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    No payment methods found.
                  </td>
                </tr>
              ) : (
                methods.map((method) => (
                  <tr key={method._id}>
                    {/* Name */}
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: themeColors.text }}
                    >
                      {editingId === method._id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 rounded border text-sm"
                          style={{
                            backgroundColor: themeColors.surface,
                            borderColor: themeColors.border,
                            color: themeColors.text,
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">{method.name}</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleToggleStatus(method)}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        style={{
                          backgroundColor: method.status
                            ? themeColors.success || themeColors.primary
                            : themeColors.border,
                        }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            method.status ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span
                        className="ml-2 text-xs"
                        style={{ color: themeColors.text }}
                      >
                        {method.status ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-sm">
                      {editingId === method._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(method._id)}
                            className="px-3 py-1 rounded flex items-center gap-1 text-xs"
                            style={{
                              backgroundColor: (themeColors.success || themeColors.primary) + "20",
                              color: themeColors.success || themeColors.primary,
                            }}
                          >
                            <FaSave size={10} />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 rounded flex items-center gap-1 text-xs"
                            style={{
                              backgroundColor: themeColors.danger + "20",
                              color: themeColors.danger,
                            }}
                          >
                            <FaTimes size={10} />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(method)}
                          className="px-3 py-1 rounded flex items-center gap-1 text-xs"
                          style={{
                            backgroundColor: themeColors.primary + "20",
                            color: themeColors.primary,
                          }}
                        >
                          <FaEdit size={10} />
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PayMethods;
