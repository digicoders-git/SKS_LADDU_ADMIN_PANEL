// src/pages/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { listOrders, updateOrderStatus } from "../apis/orders";
import Pagination from "../components/Pagination";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileInvoice, FaTimes, FaDownload } from "react-icons/fa";

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

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const res = await listOrders(page, 10);
      setOrders(res.orders || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
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
    fetchOrders(1);
  }, []);

  const handlePageChange = (newPage) => {
    fetchOrders(newPage);
  };

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

  const handleDownloadInvoice = async (order) => {
    const doc = new jsPDF();
    const id = (order._id || order.id || "-").slice(-6).toUpperCase();
    const date = fmtDateTime(order.createdAt).split(",")[0];

    // Attempt to add logo using fetch (more reliable for dataURL conversion)
    try {
      const response = await fetch("/sks-logo.png");
      const blob = await response.blob();
      const logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      doc.addImage(logoBase64, 'PNG', 15, 10, 25, 25);
    } catch (err) {
      doc.setFontSize(22);
      doc.setTextColor(218, 165, 32);
      doc.text("SKS LADDU", 15, 25);
    }

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${date}`, 150, 20);
    doc.text(`Invoice: #${id}`, 150, 26);

    doc.setDrawColor(200);
    doc.line(15, 40, 195, 40);

    // Bill From and To
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("BILL FROM:", 15, 50);
    doc.text("BILL TO:", 140, 50);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    doc.text("SKS Laddu", 15, 57);
    doc.text("Ahirawan, Sandila, UP", 15, 62);
    doc.text("Ph: 8467831372", 15, 67);

    const shipping = order.shippingAddress || {};
    
    // Bill To section with proper text wrapping
    let billToY = 57;
    const maxWidth = 50; // Maximum width for text wrapping
    const lineHeight = 5;
    
    // Name
    doc.text(shipping.name || "-", 140, billToY);
    billToY += lineHeight;
    
    // Phone
    doc.text(shipping.phone || "-", 140, billToY);
    billToY += lineHeight;
    
    // Address Line 1 with wrapping
    if (shipping.addressLine1) {
      const addr1Lines = doc.splitTextToSize(shipping.addressLine1, maxWidth);
      doc.text(addr1Lines, 140, billToY);
      billToY += addr1Lines.length * lineHeight;
    }
    
    // Address Line 2 with wrapping (if exists)
    if (shipping.addressLine2) {
      const addr2Lines = doc.splitTextToSize(shipping.addressLine2, maxWidth);
      doc.text(addr2Lines, 140, billToY);
      billToY += addr2Lines.length * lineHeight;
    }
    
    // City, State, Pincode
    const cityStatePin = `${shipping.city || ""}, ${shipping.state || ""} - ${shipping.pincode || ""}`;
    const cityLines = doc.splitTextToSize(cityStatePin, maxWidth);
    doc.text(cityLines, 140, billToY);

    // PDF specific currency formatter (avoiding ₹ symbol)
    const fmtPDF = (n) =>
      typeof n === "number"
        ? `Rs. ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
        : n ?? "-";

    // Items table
    const tableRows = (order.items || []).map((item) => [
      item.productName || item.product?.name || "Item",
      item.quantity,
      fmtPDF(item.productPrice || 0),
      fmtPDF((item.productPrice || 0) * (item.quantity || 1)),
    ]);

    autoTable(doc, {
      startY: 82,
      head: [["PRODUCT", "QTY", "RATE", "PRICE"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", lineWidth: 0.1 },
      styles: { fontSize: 9, halign: "left" },
      columnStyles: {
        1: { halign: "center", cellWidth: 15 },
        2: { halign: "right", cellWidth: 35 },
        3: { halign: "right", cellWidth: 35 }
      },
      margin: { left: 15, right: 15 },
    });

    let finalY = (doc).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.setFont("helvetica", "normal");

    const summaryX = 140;
    const valueX = 195;

    const drawLine = (label, value, y) => {
      doc.text(label, summaryX, y);
      doc.text(value, valueX, y, { align: "right" });
    };

    drawLine("Subtotal:", fmtPDF(order.subtotal || 0), finalY);
    finalY += 5;

    if (order.discount > 0) {
      drawLine("Discount:", `-${fmtPDF(order.discount)}`, finalY);
      finalY += 5;
    }

    drawLine("Shipping Charges:", fmtPDF(order.shippingCharges || 0), finalY);
    finalY += 5;

    drawLine("Handling Fee:", fmtPDF(order.handlingFee || 0), finalY);
    finalY += 8;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    drawLine("Total Amount:", fmtPDF(order.total), finalY);

    doc.save(`Invoice_${id}.pdf`);
  };

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
                  "Status",
                  "Shiprocket",
                  "Payment",
                  "Created",
                  "Invoice"
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
                        `${it.productName || it.product?.name || "Item"} x${it.quantity || 1
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

                      {/* Invoice */}
                      <td className="px-4 py-2 text-xs">
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setShowInvoiceModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
                          style={{
                            backgroundColor: themeColors.primary + "15",
                            color: themeColors.primary,
                            border: `1px solid ${themeColors.primary}30`
                          }}
                        >
                          <FaFileInvoice />
                          View
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
      {!loading && pagination.totalPages > 1 && (
        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl transform transition-all"
            style={{ backgroundColor: themeColors.surface }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: themeColors.border }}>
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                <FaFileInvoice className="text-yellow-500" />
                Order Invoice
              </h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: themeColors.text }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
              {/* Invoice Top */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <img src="/sks-logo.png" alt="SKS Logo" className="h-12 w-auto mb-1" />
                  <p className="text-[9px] font-bold opacity-30 tracking-widest uppercase">Official Invoice</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] opacity-60" style={{ color: themeColors.text }}>Date: {fmtDateTime(selectedOrder.createdAt).split(",")[0]}</p>
                  <p className="text-sm font-bold" style={{ color: themeColors.text }}>
                    Invoice: <span className="text-yellow-600">#{selectedOrder._id.slice(-6).toUpperCase()}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-2.5 rounded-xl bg-gray-50/50 border border-gray-100">
                  <h4 className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-0.5" style={{ color: themeColors.text }}>BILL FROM:</h4>
                  <p className="font-bold text-sm" style={{ color: themeColors.text }}>SKS Laddu</p>
                  <p className="text-[11px] opacity-70" style={{ color: themeColors.text }}>Ahirawan, Sandila, UP</p>
                </div>
                <div className="text-right p-2.5 rounded-xl bg-gray-50/50 border border-gray-100">
                  <h4 className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-0.5" style={{ color: themeColors.text }}>BILL TO:</h4>
                  <p className="font-bold text-sm" style={{ color: themeColors.text }}>{selectedOrder.shippingAddress?.name || "-"}</p>
                  <p className="text-[11px] opacity-70" style={{ color: themeColors.text }}>{selectedOrder.shippingAddress?.phone || "-"}</p>
                  <p className="text-[10px] opacity-70 leading-tight" style={{ color: themeColors.text }}>
                    {selectedOrder.shippingAddress?.addressLine1}<br />
                    {selectedOrder.shippingAddress?.city}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-2 overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-gray-50" style={{ borderColor: themeColors.border }}>
                      <th className="text-left py-2 px-3 opacity-70 font-bold">PRODUCT</th>
                      <th className="text-center py-2 px-2 opacity-70 font-bold">QTY</th>
                      <th className="text-right py-2 px-2 opacity-70 font-bold">RATE</th>
                      <th className="text-right py-2 px-3 opacity-70 font-bold">PRICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold" style={{ color: themeColors.text }}>{item.productName || item.product?.name || "Item"}</td>
                        <td className="py-2 px-2 text-center" style={{ color: themeColors.text }}>{item.quantity}</td>
                        <td className="py-2 px-2 text-right" style={{ color: themeColors.text }}>{fmtCurrency(item.productPrice || 0)}</td>
                        <td className="py-2 px-3 text-right font-bold" style={{ color: themeColors.text }}>{fmtCurrency((item.productPrice || 0) * (item.quantity || 1))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer - Fixed Summary & Actions */}
            <div className="p-4 border-t bg-gray-50/50" style={{ borderColor: themeColors.border }}>
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-0.5">
                  <div className="flex justify-between w-36 text-[10px] opacity-60">
                    <span>Subtotal:</span>
                    <span>{fmtCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between w-36 text-[10px] text-green-600 font-medium">
                      <span>Discount:</span>
                      <span>-{fmtCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between w-36 text-[10px] opacity-60">
                    <span>Shipping:</span>
                    <span>{fmtCurrency(selectedOrder.shippingCharges || 0)}</span>
                  </div>
                  <div className="flex justify-between w-36 text-[10px] opacity-60">
                    <span>Handling:</span>
                    <span>{fmtCurrency(selectedOrder.handlingFee || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold opacity-40 uppercase">Total:</span>
                  <h3 className="text-2xl font-black text-slate-900">
                    {fmtCurrency(selectedOrder.total)}
                  </h3>
                </div>
                <button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="bg-slate-900 text-white px-8 py-1 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all font-bold shadow-lg transform hover:-translate-y-0.5"
                >
                  <FaDownload />
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
