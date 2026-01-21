// src/pages/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { listOrders, updateOrderStatus } from "../apis/orders";
import { createShiprocketOrder, getShiprocketTracking } from "../apis/shiprocket";
import {
  FaShoppingCart,
  FaSyncAlt,
  FaSearch,
  FaTruck,
  FaEye,
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

function Orders() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shiprocketLoading, setShiprocketLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Check token expiry before API call
      const tokenExpiry = localStorage.getItem("admin-token-expiry");
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        // Token expired, clear localStorage and redirect
        localStorage.removeItem("admin-data");
        localStorage.removeItem("admin-token");
        localStorage.removeItem("admin-token-expiry");
        setError("Session expired. Please login again.");
        setTimeout(() => window.location.href = "/login", 2000);
        return;
      }
      
      const list = await listOrders();
      setOrders(list);
    } catch (e) {
      if (e.response?.status === 401 || e.message === "Token expired") {
        setError("Session expired. Please login again.");
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load orders."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateShiprocketOrder = async (order) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin.");
      return;
    }

    if (order.shiprocketCreated) {
      setError("Shiprocket order already created for this order.");
      return;
    }

    const result = await Swal.fire({
      title: "Create Shiprocket Order?",
      text: `Create shipping order for ${order._id}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, create",
    });

    if (!result.isConfirmed) return;

    try {
      setShiprocketLoading(true);
      setError("");
      setSuccess("");

      const response = await createShiprocketOrder(order._id || order.id);

      // Update local state with Shiprocket data
      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === (order._id || order.id)
            ? {
                ...o,
                shiprocketCreated: true,
                shiprocketOrderId: response.shiprocketOrderId,
                shipmentId: response.shipmentId,
                awbCode: response.awbCode || "",
                courierName: response.courierName || "",
                status: "confirmed" // Auto confirm when Shiprocket order is created
              }
            : o
        )
      );
      
      // Update order status to confirmed on server
      try {
        await updateOrderStatus(order._id || order.id, "confirmed");
      } catch (statusError) {
        console.error("Failed to update status to confirmed:", statusError);
      }

      setSuccess("Shiprocket order created and order confirmed successfully.");
      Swal.fire({
        icon: "success",
        title: "Created & Confirmed",
        text: "Shiprocket order created and order confirmed successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      if (e.response?.status === 401 || e.message === "Token expired") {
        setError("Session expired. Please login again.");
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to create Shiprocket order.";
        setError(msg);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: msg,
        });
      }
    } finally {
      setShiprocketLoading(false);
    }
  };

  const handleTrackOrder = async (order) => {
    if (!order.awbCode) {
      setError("No AWB code available for tracking.");
      return;
    }

    try {
      setShiprocketLoading(true);
      const trackingData = await getShiprocketTracking(order.awbCode);
      
      Swal.fire({
        title: "Order Tracking",
        html: `
          <div class="text-left">
            <p><strong>AWB Code:</strong> ${order.awbCode}</p>
            <p><strong>Courier:</strong> ${order.courierName || 'N/A'}</p>
            <p><strong>Status:</strong> ${trackingData.status || 'N/A'}</p>
            <p><strong>Location:</strong> ${trackingData.location || 'N/A'}</p>
          </div>
        `,
        icon: "info",
        confirmButtonText: "Close",
      });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to get tracking info.";
      Swal.fire({
        icon: "error",
        title: "Tracking Error",
        text: msg,
      });
    } finally {
      setShiprocketLoading(false);
    }
  };

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

      // Update local state first
      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === (order._id || order.id)
            ? { ...o, status: newStatus }
            : o
        )
      );

      // Auto-create Shiprocket when status = "confirmed" for all orders
      if (newStatus === "confirmed" && !order.shiprocketCreated) {
        try {
          setShiprocketLoading(true);
          const response = await createShiprocketOrder(order._id || order.id);
          
          // Update with Shiprocket data
          setOrders((prev) =>
            prev.map((o) =>
              (o._id || o.id) === (order._id || order.id)
                ? {
                    ...o,
                    shiprocketCreated: true,
                    shiprocketOrderId: response.shiprocketOrderId,
                    shipmentId: response.shipmentId,
                    awbCode: response.awbCode || "",
                    courierName: response.courierName || "",
                  }
                : o
            )
          );
          
          setSuccess("Order confirmed and Shiprocket order created successfully!");
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Order confirmed and Shiprocket order created successfully!",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (shiprocketError) {
          console.error("Shiprocket creation failed:", shiprocketError);
          // Don't revert status, just show warning
          setSuccess("Order confirmed but Shiprocket creation failed. You can create it manually.");
          Swal.fire({
            icon: "warning",
            title: "Partial Success",
            text: "Order confirmed but Shiprocket creation failed. You can create it manually.",
            timer: 3000,
          });
        } finally {
          setShiprocketLoading(false);
        }
      } else {
        setSuccess("Order status updated successfully.");
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Order status updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update order status.";
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
                  "Shiprocket",
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
                    colSpan={9}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: themeColors.text }}
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
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
                        {id.slice(-6)}
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

                      {/* Shiprocket */}
                      <td className="px-4 py-2 text-xs">
                        {o.shiprocketCreated ? (
                          <div className="space-y-1">
                            <div
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: (themeColors.success || themeColors.primary) + "20",
                                color: themeColors.success || themeColors.primary,
                              }}
                            >
                              ✓ Created
                            </div>
                            {o.shiprocketOrderId && (
                              <div className="text-[10px] opacity-70">
                                ID: {o.shiprocketOrderId}
                              </div>
                            )}
                            {o.awbCode && (
                              <div className="text-[10px] opacity-70">
                                AWB: {o.awbCode}
                              </div>
                            )}
                            {o.courierName && (
                              <div className="text-[10px] opacity-70">
                                {o.courierName}
                              </div>
                            )}
                            <div className="flex gap-1 mt-1">
                              {o.awbCode && (
                                <button
                                  onClick={() => handleTrackOrder(o)}
                                  disabled={shiprocketLoading}
                                  className="px-2 py-1 rounded text-[10px] flex items-center gap-1"
                                  style={{
                                    backgroundColor: themeColors.primary + "20",
                                    color: themeColors.primary,
                                  }}
                                  title="Track Order"
                                >
                                  <FaEye size={8} />
                                  Track
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: themeColors.background + "80",
                                color: themeColors.text,
                              }}
                            >
                              Not Created
                            </div>
                            {!o.shiprocketCreated && (
                              <button
                                onClick={() => handleCreateShiprocketOrder(o)}
                                disabled={!isLoggedIn || shiprocketLoading}
                                className="px-2 py-1 rounded text-[10px] flex items-center gap-1 mt-1"
                                style={{
                                  backgroundColor: themeColors.primary + "20",
                                  color: themeColors.primary,
                                }}
                                title="Create Shiprocket Order"
                              >
                                <FaTruck size={8} />
                                Create
                              </button>
                            )}
                          </div>
                        )}
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

export default Orders;
