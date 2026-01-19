// src/pages/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { listOrders, updateOrderStatus } from "../apis/orders";
import {
  FaShoppingCart,
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

const fmtCurrency = (n) =>
  typeof n === "number"
    ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : n ?? "-";

// Possible order statuses (assumption)
const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export default function Orders() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listOrders();
      setOrders(list);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (order, newStatus) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to update status.");
      return;
    }

    if (!newStatus || newStatus === order.status) return;

    const result = await Swal.fire({
      title: "Change order status?",
      text: `Order ${order._id} status will be changed from "${order.status}" to "${newStatus}".`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, update",
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateOrderStatus(order._id || order.id, newStatus);

      // local state update
      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === (order._id || order.id)
            ? { ...o, status: newStatus }
            : o
        )
      );

      setSuccess("Order status updated successfully.");
      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Order status updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to update order status.";
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

  const filteredOrders = useMemo(() => {
    let list = orders;

    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();

    return list.filter((o) => {
      const id = (o._id || o.id || "").toLowerCase();
      const userId = (o.userId || "").toLowerCase();
      const offerCode = (o.offerCode || "").toLowerCase();
      const name = (o.shippingAddress?.name || "").toLowerCase();
      const phone = (o.shippingAddress?.phone || "").toLowerCase();
      return (
        id.includes(q) ||
        userId.includes(q) ||
        offerCode.includes(q) ||
        name.includes(q) ||
        phone.includes(q)
      );
    });
  }, [orders, search, statusFilter]);

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
      case "confirmed":
        return {
          ...base,
          backgroundColor:
            (themeColors.success || themeColors.primary) + "20",
          color: themeColors.success || themeColors.primary,
        };
      case "shipped":
        return {
          ...base,
          backgroundColor: "#0ea5e920",
          color: "#0ea5e9",
        };
      case "delivered":
        return {
          ...base,
          backgroundColor: "#22c55e20",
          color: "#22c55e",
        };
      case "cancelled":
        return {
          ...base,
          backgroundColor: themeColors.danger + "20",
          color: themeColors.danger,
        };
      default: // pending
        return {
          ...base,
          backgroundColor: themeColors.background + "80",
          color: themeColors.text,
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
            <FaShoppingCart />
            Orders
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            View and manage all customer orders.
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

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs opacity-70">
              <FaSearch style={{ color: themeColors.text }} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order, user, phone, offer..."
              className="pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            />
          </div>

          <button
            onClick={fetchOrders}
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
            <FaShoppingCart />
            Order List
          </span>
          <span className="text-xs opacity-70">
            {filteredOrders.length} of {orders.length} shown
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
                  "Order ID",
                  "Customer",
                  "Items",
                  "Amount",
                  "Offer",
                  "Status",
                  "Payment",
                  "Created",
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
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const id = o._id || o.id || "-";
                  const shipping = o.shippingAddress || {};
                  const itemsText = (o.items || [])
                    .map(
                      (it) =>
                        `${it.productName || it.product?.name || "Item"} x${
                          it.quantity || 1
                        } (${it.size || "-"}, ${it.color || "-"})`
                    )
                    .join(", ");

                  return (
                    <tr key={id}>
                      {/* Order ID */}
                      <td
                        className="px-4 py-2 font-mono text-xs"
                        style={{ color: themeColors.text }}
                      >
                        {id}
                      </td>

                      {/* Customer */}
                      <td
                        className="px-4 py-2 text-xs"
                        style={{ color: themeColors.text }}
                      >
                        <div className="font-medium text-sm">
                          {shipping.name || "-"}
                        </div>
                        <div className="opacity-70">
                          {shipping.phone || "-"}
                        </div>
                        <div className="opacity-60">
                          {shipping.city}, {shipping.state}
                        </div>
                        <div className="opacity-60">
                          User ID: {o.userId || "-"}
                        </div>
                      </td>

                      {/* Items */}
                      <td
                        className="px-4 py-2 text-xs"
                        style={{ color: themeColors.text }}
                      >
                        <div className="line-clamp-3">{itemsText}</div>
                        {o.notes && (
                          <div
                            className="mt-1 text-[11px] italic opacity-70"
                            style={{ color: themeColors.text }}
                          >
                            Note: {o.notes}
                          </div>
                        )}
                      </td>

                      {/* Amounts */}
                      <td
                        className="px-4 py-2 text-xs"
                        style={{ color: themeColors.text }}
                      >
                        <div>
                          Subtotal: {fmtCurrency(o.subtotal)}
                        </div>
                        <div>
                          Discount:{" "}
                          {o.discount
                            ? `- ${fmtCurrency(o.discount)}`
                            : fmtCurrency(0)}
                        </div>
                        <div className="font-semibold">
                          Total: {fmtCurrency(o.total)}
                        </div>
                      </td>

                      {/* Offer */}
                      <td
                        className="px-4 py-2 text-xs"
                        style={{ color: themeColors.text }}
                      >
                        {o.offerCode || "-"}
                      </td>

                      {/* Status + change control */}
                      <td className="px-4 py-2 text-xs">
                        <div style={statusBadgeStyle(o.status || "pending")}>
                          {o.status || "pending"}
                        </div>
                        <div className="mt-2">
                          <select
                            value={o.status || "pending"}
                            disabled={!isLoggedIn || saving}
                            onChange={(e) =>
                              handleStatusChange(o, e.target.value)
                            }
                            className="mt-1 px-2 py-1 rounded-lg border text-xs"
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
                      </td>

                      {/* Payment */}
                      <td
                        className="px-4 py-2 text-xs"
                        style={{ color: themeColors.text }}
                      >
                        <div className="mb-1">
                          Method: {o.paymentMethod || "-"}
                        </div>
                        <div>
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor:
                                o.paymentStatus === "paid"
                                  ? (themeColors.success ||
                                      themeColors.primary) + "20"
                                  : themeColors.background + "80",
                              color:
                                o.paymentStatus === "paid"
                                  ? themeColors.success ||
                                    themeColors.primary
                                  : themeColors.text,
                            }}
                          >
                            {o.paymentStatus || "pending"}
                          </span>
                        </div>
                      </td>

                      {/* Created */}
                      <td
                        className="px-4 py-2 text-xs"
                        style={{ color: themeColors.text }}
                      >
                        {fmtDateTime(o.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
