// src/pages/Dashboard.jsx
import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  FaShoppingCart,
  FaRupeeSign,
  FaUsers,
  FaBoxOpen,
  FaChartBar,
  FaSyncAlt,
  FaEnvelopeOpenText,
  FaTags,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { getDashboardOverview } from "../apis/dashboard";

// ---------- helpers ----------
const fmtNum = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN") : n ?? "-";

const fmtCurrency = (n) =>
  typeof n === "number"
    ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : n ?? "-";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "-";

const shortId = (id = "") => (id.length > 8 ? `...${id.slice(-8)}` : id);

// ---------- component ----------
export default function Dashboard() {
  const { themeColors } = useTheme();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOverview = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      setError("");
      if (!isRefresh) setLoading(true);

      const data = await getDashboardOverview();
      setOverview(data);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load dashboard overview."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview(false);
  }, []);

  const summary = overview?.summaryCards || {};
  const charts = overview?.charts || {};
  const tables = overview?.tables || {};
  const meta = overview?.meta || {};

  const salesLast7Days = charts.salesLast7Days || [];
  const productsByCategory = charts.productsByCategory || [];

  const latestOrders = tables.latestOrders || [];
  const latestProducts = tables.latestProducts || [];
  const recentEnquiries = tables.recentEnquiries || [];
  const activeOffers = tables.activeOffers || [];

  const ordersTrend = useMemo(
    () =>
      salesLast7Days.map((d) => ({
        date: fmtDate(d.date),
        orders: d.orders,
      })),
    [salesLast7Days]
  );

  const revenueTrend = useMemo(
    () =>
      salesLast7Days.map((d) => ({
        date: fmtDate(d.date),
        revenue: d.revenue,
      })),
    [salesLast7Days]
  );

  const categoryPerformance = useMemo(
    () =>
      productsByCategory.map((c) => ({
        category: c.name || c.slug || "Untitled",
        totalProducts: c.totalProducts || 0,
        activeProducts: c.activeProducts || 0,
      })),
    [productsByCategory]
  );

  const summaryCards = [
    {
      title: "Total Revenue",
      value: fmtCurrency(summary.totalRevenue),
      icon: FaRupeeSign,
      description: `This month: ${fmtCurrency(
        summary.monthRevenue
      )} • Avg order: ${fmtCurrency(summary.avgOrderValue)}`,
    },
    {
      title: "Orders",
      value: fmtNum(summary.totalOrders),
      icon: FaShoppingCart,
      description: `Today: ${fmtNum(summary.todayOrders)}`,
    },
    {
      title: "Catalog",
      value: fmtNum(summary.totalProducts),
      icon: FaBoxOpen,
      description: `Active products: ${fmtNum(
        summary.activeProducts
      )} • Categories: ${fmtNum(summary.totalCategories)} (${fmtNum(
        summary.activeCategories
      )} active)`,
    },
    {
      title: "Engagement",
      value: fmtNum(summary.totalEnquiries),
      icon: FaUsers,
      description: `Unread enquiries: ${fmtNum(
        summary.unreadEnquiries
      )} • Active offers: ${fmtNum(summary.activeOffers)}`,
    },
  ];

  const isEmpty = !loading && !overview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: themeColors.text }}
          >
            E-commerce Overview
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Live summary of orders, revenue, catalogue and customer activity.
          </p>
          {meta.generatedAtIST && (
            <p
              className="text-xs mt-1 opacity-60"
              style={{ color: themeColors.text }}
            >
              Last updated (IST): {meta.generatedAtIST}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOverview(true)}
            disabled={loading || refreshing}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.text,
            }}
            title="Refresh dashboard"
          >
            <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error / Empty */}
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

      {isEmpty && !error && (
        <div
          className="p-3 rounded-lg text-sm border"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            color: themeColors.text,
          }}
        >
          No dashboard data available.
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div
          className="p-3 rounded-lg text-sm border"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            color: themeColors.text,
          }}
        >
          Loading dashboard...
        </div>
      )}

      {/* Rest of content only when we have data */}
      {!loading && overview && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryCards.map((stat, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border transition-all duration-300 hover:shadow-lg group"
                style={{
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p
                      className="text-sm font-medium mb-1 opacity-75"
                      style={{ color: themeColors.text }}
                    >
                      {stat.title}
                    </p>
                    <p
                      className="text-2xl font-bold mb-2"
                      style={{ color: themeColors.primary }}
                    >
                      {stat.value}
                    </p>
                    <p
                      className="text-xs opacity-60"
                      style={{ color: themeColors.text }}
                    >
                      {stat.description}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: themeColors.primary + "15" }}
                  >
                    <stat.icon
                      className="text-lg"
                      style={{ color: themeColors.primary }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row 1: Orders & Revenue (last 7 days) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders per day */}
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
                  <FaChartBar />
                  Orders (Last 7 Days)
                </span>
                <span className="text-xs opacity-70">
                  Today: {fmtNum(summary.todayOrders)} • Total:{" "}
                  {fmtNum(summary.totalOrders)}
                </span>
              </h2>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={ordersTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue per day */}
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
                  <FaChartBar />
                  Revenue (Last 7 Days)
                </span>
                <span className="text-xs opacity-70">
                  Total: {fmtCurrency(summary.totalRevenue)}
                </span>
              </h2>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(v) =>
                        `₹${(v / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      formatter={(value) => fmtCurrency(value)}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart Row 2: Products by category */}
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
              <FaChartBar />
              Products by Category
            </h2>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="totalProducts" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tables: Latest Orders & Latest Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest orders table */}
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
                <FaShoppingCart />
                Latest Orders
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        backgroundColor:
                          themeColors.background + "30",
                      }}
                    >
                      {[
                        "Order",
                        "Customer",
                        "Items",
                        "Total",
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
                    {latestOrders.map((o) => {
                      const firstItem = o.items?.[0];
                      const extraItems = (o.items?.length || 0) - 1;

                      const itemText = firstItem
                        ? `${firstItem.productName || firstItem.product?.name || "Item"
                          } x${firstItem.quantity}`
                        : "-";

                      return (
                        <tr key={o._id}>
                          <td
                            className="px-4 py-2 text-xs font-mono"
                            style={{ color: themeColors.text }}
                          >
                            {shortId(o._id)}
                            {o.offerCode && (
                              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                                {o.offerCode}
                              </span>
                            )}
                          </td>
                          <td
                            className="px-4 py-2"
                            style={{ color: themeColors.text }}
                          >
                            {o.shippingAddress?.name || "-"}
                            <div className="text-xs opacity-70">
                              {o.shippingAddress?.city},{" "}
                              {o.shippingAddress?.state}
                            </div>
                          </td>
                          <td
                            className="px-4 py-2 text-xs"
                            style={{ color: themeColors.text }}
                          >
                            {itemText}
                            {extraItems > 0 && (
                              <span className="opacity-60">
                                {" "}
                                +{extraItems} more
                              </span>
                            )}
                          </td>
                          <td
                            className="px-4 py-2"
                            style={{ color: themeColors.text }}
                          >
                            {fmtCurrency(o.total)}
                          </td>
                          <td className="px-4 py-2 text-xs">
                            <span
                              className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold"
                              style={{
                                backgroundColor:
                                  themeColors.primary + "10",
                                color: themeColors.primary,
                              }}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td
                            className="px-4 py-2 text-xs"
                            style={{ color: themeColors.text }}
                          >
                            <div>{o.paymentMethod}</div>
                            <div className="opacity-70">
                              {o.paymentStatus}
                            </div>
                          </td>
                          <td
                            className="px-4 py-2 text-xs opacity-70"
                            style={{ color: themeColors.text }}
                          >
                            {fmtDate(o.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                    {latestOrders.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-4 text-center text-sm"
                          style={{ color: themeColors.text }}
                        >
                          No recent orders.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Latest products table */}
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
                <FaBoxOpen />
                Latest Products
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        backgroundColor:
                          themeColors.background + "30",
                      }}
                    >
                      {[
                        "Product",
                        "Category",
                        "Price",
                        "Final Price",
                        "Status",
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
                    {latestProducts.map((p) => (
                      <tr key={p._id}>
                        <td
                          className="px-4 py-2"
                          style={{ color: themeColors.text }}
                        >
                          <div className="font-semibold">{p.name}</div>
                          {p.slug && (
                            <div className="text-[11px] opacity-70 font-mono">
                              {p.slug}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-2 text-sm"
                          style={{ color: themeColors.text }}
                        >
                          {p.category?.name || "-"}
                        </td>
                        <td
                          className="px-4 py-2"
                          style={{ color: themeColors.text }}
                        >
                          {fmtCurrency(p.price)}
                        </td>
                        <td
                          className="px-4 py-2"
                          style={{ color: themeColors.text }}
                        >
                          {fmtCurrency(p.finalPrice)}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: p.isActive
                                ? (themeColors.success ||
                                    themeColors.primary) + "15"
                                : themeColors.border,
                              color: p.isActive
                                ? themeColors.success ||
                                  themeColors.primary
                                : themeColors.text,
                            }}
                          >
                            {p.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td
                          className="px-4 py-2 text-xs opacity-70"
                          style={{ color: themeColors.text }}
                        >
                          {fmtDate(p.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {latestProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-4 text-center text-sm"
                          style={{ color: themeColors.text }}
                        >
                          No recent products.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent enquiries & active offers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent enquiries */}
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
                Recent Enquiries
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        backgroundColor:
                          themeColors.background + "30",
                      }}
                    >
                      {[
                        "Name",
                        "Email",
                        "Phone",
                        "Subject",
                        "Status",
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
                    {recentEnquiries.map((e) => (
                      <tr key={e._id}>
                        <td
                          className="px-4 py-2"
                          style={{ color: themeColors.text }}
                        >
                          {e.name}
                        </td>
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {e.email}
                        </td>
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {e.phone}
                        </td>
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {e.subject}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold"
                            style={{
                              backgroundColor: e.isRead
                                ? themeColors.border
                                : themeColors.primary + "10",
                              color: e.isRead
                                ? themeColors.text
                                : themeColors.primary,
                            }}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td
                          className="px-4 py-2 text-xs opacity-70"
                          style={{ color: themeColors.text }}
                        >
                          {fmtDate(e.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {recentEnquiries.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-4 text-center text-sm"
                          style={{ color: themeColors.text }}
                        >
                          No enquiries yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active offers */}
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
                <FaTags />
                Active Offers
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        backgroundColor:
                          themeColors.background + "30",
                      }}
                    >
                      {[
                        "Code",
                        "Title",
                        "Type",
                        "Value",
                        "Min Order",
                        "Max Discount",
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
                    {activeOffers.map((o) => (
                      <tr key={o._id}>
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
                          {o.minOrderAmount
                            ? fmtCurrency(o.minOrderAmount)
                            : "-"}
                        </td>
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {o.maxDiscountAmount
                            ? fmtCurrency(o.maxDiscountAmount)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                    {activeOffers.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-4 text-center text-sm"
                          style={{ color: themeColors.text }}
                        >
                          No active offers.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
