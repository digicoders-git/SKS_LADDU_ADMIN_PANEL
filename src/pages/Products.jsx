// src/pages/Products.jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { getCategories } from "../apis/categories";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from "../apis/products";
import {
  FaBoxOpen,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaSearch,
  FaImage,
  FaTable,
  FaThLarge,
  FaToggleOn,
  FaToggleOff,
  FaEye,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// ---------- helpers ----------
const fmtNum = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN") : n ?? "-";

const fmtCurrency = (n) =>
  typeof n === "number"
    ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : n ?? "-";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN") : "-";

const emptyForm = {
  name: "",
  price: "",
  discountPercent: "",
  categoryId: "",
  description: "",
  ingredients: "",
  shelfLife: "",
  netWeight: "",
};

export default function Products() {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { isLoggedIn } = useAuth();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // product being edited
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [mainImageFile, setMainImageFile] = useState(null);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" | "card"
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' or 'inactive'

  // NEW: full view modal product
  const [viewProduct, setViewProduct] = useState(null);

  // ---------- fetchers ----------
  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const list = Array.isArray(res) ? res : res.categories || [];
      setCategories(list);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await listProducts(statusFilter);
      setProducts(list);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [statusFilter]);

  // categoryId -> name map
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      const id = c._id || c.id;
      if (id) map[id] = c.name;
    });
    return map;
  }, [categories]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setMainImageFile(null);
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

  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    setMainImageFile(file || null);
  };



  const handleEdit = (prod) => {
    setEditing(prod);
    setForm({
      name: prod.name || "",
      price:
        typeof prod.price === "number"
          ? String(prod.price)
          : prod.price || "",
      discountPercent:
        typeof prod.discountPercent === "number"
          ? String(prod.discountPercent)
          : prod.discountPercent || "",
      categoryId:
        prod.categoryId?._id ||
        prod.categoryId?.id ||
        prod.categoryId ||
        prod.category?._id ||
        "",
      description: prod.description || "",
      ingredients: prod.about?.ingredients || "",
      shelfLife: prod.about?.shelfLife || "",
      netWeight: prod.about?.netWeight || "",
    });

    setMainImageFile(null);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("price", form.price.trim());

    if (form.discountPercent?.trim() !== "") {
      fd.append("discountPercent", form.discountPercent.trim());
    }

    if (form.categoryId) {
      fd.append("categoryId", form.categoryId);
    }

    if (form.description.trim()) {
      fd.append("description", form.description.trim());
    }

    const aboutData = {
      ingredients: form.ingredients.trim(),
      shelfLife: form.shelfLife.trim(),
      netWeight: form.netWeight.trim(),
    };
    fd.append("about", JSON.stringify(aboutData));

    if (mainImageFile) {
      fd.append("mainImage", mainImageFile);
    }

    return fd;
  };

  const handleDelete = async (prod) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to delete products.");
      return;
    }

    const idOrSlug = prod.slug || prod._id || prod.id;
    if (!idOrSlug) {
      setError("Cannot delete this product (missing identifier).");
      return;
    }

    const result = await Swal.fire({
      title: `Delete product "${prod.name}"?`,
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
      await deleteProduct(idOrSlug);
      setSuccess("Product deleted successfully.");
      await fetchProducts();
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Product deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to delete product.";
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

  // NEW: Active/Inactive toggle handler
  const handleToggleStatus = async (prod) => {
    if (!isLoggedIn) {
      setError("You must be logged in as admin to change status.");
      return;
    }

    const idOrSlug = prod.slug || prod._id || prod.id;
    if (!idOrSlug) {
      setError("Cannot update this product (missing identifier).");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await toggleProductStatus(idOrSlug);
      const newStatus = !prod.isActive;
      
      // Remove from current view if status doesn't match filter
      if ((statusFilter === 'active' && !newStatus) || (statusFilter === 'inactive' && newStatus)) {
        setProducts((prev) => prev.filter((p) => 
          (p._id || p.id || p.slug) !== (prod._id || prod.id || prod.slug)
        ));
      } else {
        // Update status in current view
        setProducts((prev) =>
          prev.map((p) =>
            (p._id || p.id || p.slug) === (prod._id || prod.id || prod.slug)
              ? { ...p, isActive: newStatus }
              : p
          )
        );
      }

      setSuccess(response.message || "Product status updated successfully.");

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: response.message || "Product status updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to update product status.";
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

  // NEW: View full product handler
  const handleView = (prod) => {
    setViewProduct(prod);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setError("You must be logged in as admin to manage products.");
      return;
    }

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!form.price.trim()) {
      setError("Price is required.");
      return;
    }
    if (!editing && !mainImageFile) {
      setError("Main image is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const fd = buildFormData();

      if (editing) {
        const idOrSlug = editing.slug || editing._id || editing.id;
        if (!idOrSlug) {
          throw new Error("Missing product identifier for update.");
        }
        await updateProduct(idOrSlug, fd);
        setSuccess("Product updated successfully.");
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Product updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createProduct(fd);
        setSuccess("Product created successfully.");
        Swal.fire({
          icon: "success",
          title: "Created",
          text: "Product created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      resetForm();
      setIsModalOpen(false);
      await fetchProducts();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to save product.";
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

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const catName =
        p.category?.name ||
        p.categoryId?.name ||
        categoryMap[p.categoryId] ||
        "";
      return (
        name.includes(q) ||
        desc.includes(q) ||
        String(catName).toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryMap]);

  const getFinalPrice = (p) => {
    if (typeof p.finalPrice === "number") return p.finalPrice;
    if (typeof p.price === "number" && p.discountPercent) {
      const discount =
        (p.price * Number(p.discountPercent || 0)) / 100;
      return p.price - discount;
    }
    return p.price;
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
            <FaBoxOpen />
            Products
          </h1>
          <p
            className="text-sm mt-1 opacity-75"
            style={{ color: themeColors.text }}
          >
            Manage your e-commerce products, pricing, categories and
            images.
          </p>
        </div>

        {/* Right controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs opacity-70">
              <FaSearch style={{ color: themeColors.text }} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              }}
            />
          </div>

          <button
            onClick={() => setStatusFilter(statusFilter === 'active' ? 'inactive' : 'active')}
            className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2"
            style={{
              backgroundColor: statusFilter === 'inactive' ? themeColors.danger : themeColors.primary,
              borderColor: themeColors.border,
              color: themeColors.onPrimary,
            }}
            title={`Switch to ${statusFilter === 'active' ? 'inactive' : 'active'} products`}
          >
            {statusFilter === 'active' ? 'Active' : 'Inactive'}
          </button>

          <button
            onClick={fetchProducts}
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

          {/* View toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden border text-sm"
            style={{ borderColor: themeColors.border }}
          >
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 flex items-center gap-1 ${
                viewMode === "table" ? "" : "opacity-70"
              }`}
              style={{
                backgroundColor:
                  viewMode === "table"
                    ? themeColors.surface
                    : "transparent",
                color: themeColors.text,
              }}
            >
              <FaTable />{" "}
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`px-3 py-2 flex items-center gap-1 border-l`}
              style={{
                borderColor: themeColors.border,
                backgroundColor:
                  viewMode === "card"
                    ? themeColors.surface
                    : "transparent",
                opacity: viewMode === "card" ? 1 : 0.7,
                color: themeColors.text,
              }}
            >
              <FaThLarge />{" "}
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <button
            onClick={openAddModal}
            disabled={!isLoggedIn}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: themeColors.primary,
              color: themeColors.onPrimary,
            }}
            title={
              isLoggedIn ? "Add new product" : "Login as admin to add"
            }
          >
            <FaPlus />
            Add Product
          </button>
        </div>
      </div>

      {/* Status Messages */}
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
              You are viewing products as public. Login as admin to
              add, edit, or delete products.
            </div>
          )}
        </div>
      )}

      {/* Products list: table / card */}
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
            <FaBoxOpen />
            {viewMode === "table" ? "Product List" : "Product Cards"}
          </span>
          <span className="text-xs opacity-70">
            {filteredProducts.length} of {products.length} shown
          </span>
        </h2>

        {viewMode === "table" ? (
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
                    "Category",
                    "Price",
                    "Discount",
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
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm"
                      style={{ color: themeColors.text }}
                    >
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm"
                      style={{ color: themeColors.text }}
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const catName =
                      p.category?.name ||
                      p.categoryId?.name ||
                      categoryMap[p.categoryId] ||
                      "-";
                    return (
                      <tr key={p._id || p.id || p.slug}>
                        <td
                          className="px-4 py-2"
                          style={{ color: themeColors.text }}
                        >
                          {p.name}
                          {p.discountPercent ? (
                            <span className="ml-1 text-xs opacity-60">
                              ({p.discountPercent}% off)
                            </span>
                          ) : null}
                        </td>
                        <td
                          className="px-4 py-2"
                          style={{ color: themeColors.text }}
                        >
                          {catName}
                        </td>
                        <td
                          className="px-4 py-2"
                          style={{ color: themeColors.text }}
                        >
                          {fmtCurrency(p.price)}
                        </td>
                        <td
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {p.discountPercent
                            ? `${p.discountPercent}%`
                            : "-"}
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
                          className="px-4 py-2 text-xs"
                          style={{ color: themeColors.text }}
                        >
                          {p.createdAt ? fmtDate(p.createdAt) : "-"}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            {/* Active/Inactive Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p)}
                              disabled={!isLoggedIn || saving}
                              className="p-2 rounded-lg border text-xs disabled:opacity-40"
                              style={{
                                borderColor: themeColors.border,
                                color: p.isActive
                                  ? themeColors.warning || "#f59e0b"
                                  : themeColors.success ||
                                    themeColors.primary,
                              }}
                              title={
                                isLoggedIn
                                  ? p.isActive
                                    ? "Mark as Inactive"
                                    : "Mark as Active"
                                  : "Login as admin to change status"
                              }
                            >
                              {p.isActive ? (
                                <FaToggleOn />
                              ) : (
                                <FaToggleOff />
                              )}
                            </button>

                            {/* View Button */}
                            <button
                              type="button"
                              onClick={() => handleView(p)}
                              className="p-2 rounded-lg border text-xs"
                              style={{
                                borderColor: themeColors.border,
                                color: themeColors.text,
                              }}
                              title="View full details"
                            >
                              <FaEye />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleEdit(p)}
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

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // CARD VIEW
          <div>
            {loading ? (
              <p
                className="text-sm text-center py-6"
                style={{ color: themeColors.text }}
              >
                Loading products...
              </p>
            ) : filteredProducts.length === 0 ? (
              <p
                className="text-sm text-center py-6"
                style={{ color: themeColors.text }}
              >
                No products found.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((p) => {
                  const catName =
                    p.category?.name ||
                    p.categoryId?.name ||
                    categoryMap[p.categoryId] ||
                    "-";
                  const finalPrice = getFinalPrice(p);
                  return (
                    <div
                      key={p._id || p.id || p.slug}
                      className="rounded-xl border flex flex-col overflow-hidden"
                      style={{ borderColor: themeColors.border }}
                    >
                      {/* Image */}
                      <div className="relative">
                        <img
                          src={
                            p.mainImage?.url ||
                            p.galleryImages?.[0]?.url ||
                            ""
                          }
                          alt={p.name}
                          className="w-full h-40 object-cover"
                        />
                        {p.discountPercent ? (
                          <span
                            className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor:
                                themeColors.primary + "dd",
                              color: themeColors.onPrimary,
                            }}
                          >
                            {p.discountPercent}% OFF
                          </span>
                        ) : null}
                        {!p.isActive && (
                          <span
                            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor:
                                themeColors.danger + "dd",
                              color: themeColors.onPrimary,
                            }}
                          >
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div
                        className="p-4 flex-1 flex flex-col gap-2"
                        style={{ backgroundColor: themeColors.surface }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              className="font-semibold text-sm mb-1"
                              style={{ color: themeColors.text }}
                            >
                              {p.name}
                            </h3>
                            <p
                              className="text-xs opacity-75"
                              style={{ color: themeColors.text }}
                            >
                              {catName}
                            </p>
                          </div>
                          <div className="text-right">
                            <div
                              className="text-sm font-bold"
                              style={{ color: themeColors.primary }}
                            >
                              {fmtCurrency(finalPrice)}
                            </div>
                            {p.discountPercent ? (
                              <div className="text-[11px] opacity-70 line-through">
                                {fmtCurrency(p.price)}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {p.description && (
                          <p
                            className="text-xs mt-1 line-clamp-2"
                            style={{ color: themeColors.text }}
                          >
                            {p.description}
                          </p>
                        )}
                        {p.about?.ingredients && (
                          <p
                            className="text-[11px] opacity-70"
                            style={{ color: themeColors.text }}
                          >
                            Ingredients: {p.about.ingredients}
                          </p>
                        )}

                        {/* Sizes / Colors */}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Array.isArray(p.sizes) &&
                            p.sizes.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-full text-[11px]"
                                style={{
                                  backgroundColor:
                                    themeColors.background + "60",
                                  color: themeColors.text,
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          {Array.isArray(p.colors) &&
                            p.colors.map((c) => (
                              <span
                                key={c}
                                className="px-2 py-0.5 rounded-full text-[11px]"
                                style={{
                                  backgroundColor:
                                    themeColors.background + "60",
                                  color: themeColors.text,
                                }}
                              >
                                {c}
                              </span>
                            ))}
                        </div>

                        {/* Add-ons */}
                        {Array.isArray(p.addOns) &&
                          p.addOns.length > 0 && (
                            <div className="mt-1">
                              <p
                                className="text-[11px] font-semibold mb-1"
                                style={{ color: themeColors.text }}
                              >
                                Add-ons
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {p.addOns.map((a, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-full text-[11px]"
                                    style={{
                                      backgroundColor: a.isDefault
                                        ? (themeColors.success ||
                                            themeColors.primary) +
                                          "20"
                                        : themeColors.background + "60",
                                      color: themeColors.text,
                                    }}
                                  >
                                    {a.name}{" "}
                                    {a.price
                                      ? `(+${fmtCurrency(a.price)})`
                                      : ""}
                                    {a.isDefault ? " • Default" : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Gallery thumbnails */}
                        {Array.isArray(p.galleryImages) &&
                          p.galleryImages.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center gap-1 overflow-x-auto">
                                {p.galleryImages.map((g, i) => (
                                  <img
                                    key={i}
                                    src={g.url}
                                    alt={`${p.name} ${i + 1}`}
                                    className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Footer */}
                        <div className="mt-auto pt-2 flex items-center justify-between text-[11px]">
                          <span
                            style={{ color: themeColors.text }}
                            className="opacity-70"
                          >
                            Created:{" "}
                            {p.createdAt ? fmtDate(p.createdAt) : "-"}
                          </span>
                          <div className="flex items-center gap-2">
                            {/* View button in card */}
                            <button
                              type="button"
                              onClick={() => handleView(p)}
                              className="px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1"
                              style={{
                                borderColor: themeColors.border,
                                color: themeColors.text,
                              }}
                              title="View full details"
                            >
                              <FaEye /> View
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEdit(p)}
                              disabled={!isLoggedIn}
                              className="px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 disabled:opacity-40"
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
                              <FaEdit /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              disabled={!isLoggedIn || saving}
                              className="px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 disabled:opacity-40"
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
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
                {editing ? "Edit Product" : "Add New Product"}
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
              {/* inline error */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="Single Door Cabinet"
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="categoryId"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Category
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="13395"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label
                    htmlFor="discountPercent"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Discount (%)
                  </label>
                  <input
                    id="discountPercent"
                    name="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercent || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="5"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
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
                    placeholder="Premium LED mirror cabinet"
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <label
                    htmlFor="ingredients"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Ingredients
                  </label>
                  <input
                    id="ingredients"
                    name="ingredients"
                    type="text"
                    value={form.ingredients}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="Glass, LED, etc."
                  />
                </div>

                {/* Shelf Life */}
                <div>
                  <label
                    htmlFor="shelfLife"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Shelf Life
                  </label>
                  <input
                    id="shelfLife"
                    name="shelfLife"
                    type="text"
                    value={form.shelfLife}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="5 years"
                  />
                </div>

                {/* Net Weight */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="netWeight"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Net Weight
                  </label>
                  <input
                    id="netWeight"
                    name="netWeight"
                    type="text"
                    value={form.netWeight}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    }}
                    placeholder="2.5 kg"
                  />
                </div>

                {/* Main Image */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="mainImageInput"
                    className="block mb-1 text-sm font-medium"
                    style={{ color: themeColors.text }}
                  >
                    Main Image {!editing && <span className="text-red-500">*</span>}
                  </label>
                  <label
                    htmlFor="mainImageInput"
                    className="block border-2 border-dashed rounded-lg px-3 py-2 text-xs cursor-pointer flex items-center justify-between"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <FaImage />
                      {mainImageFile
                        ? mainImageFile.name
                        : "Click to choose main image"}
                    </span>
                    <span
                      className="px-2 py-1 rounded-full border text-[10px]"
                      style={{ borderColor: themeColors.border }}
                    >
                      Browse
                    </span>
                  </label>
                  <input
                    id="mainImageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    className="hidden"
                  />
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
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL VIEW MODAL */}
      {viewProduct && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div
            className="w-full max-w-4xl mx-4 rounded-2xl shadow-lg border max-h-[90vh] overflow-hidden flex flex-col"
            style={{
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: themeColors.border }}
            >
              <div className="flex items-center gap-2">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: themeColors.text }}
                >
                  {viewProduct.name}
                </h2>
                <span
                  className="px-2 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: viewProduct.isActive
                      ? (themeColors.success ||
                          themeColors.primary) + "15"
                      : themeColors.border,
                    color: viewProduct.isActive
                      ? themeColors.success || themeColors.primary
                      : themeColors.text,
                  }}
                >
                  {viewProduct.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <button
                onClick={() => setViewProduct(null)}
                className="text-xl leading-none px-2"
                style={{ color: themeColors.text }}
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Images section */}
                <div className="space-y-3">
                  <div
                    className="rounded-lg overflow-hidden border"
                    style={{ borderColor: themeColors.border }}
                  >
                    <img
                      src={
                        viewProduct.mainImage?.url ||
                        viewProduct.galleryImages?.[0]?.url ||
                        ""
                      }
                      alt={viewProduct.name}
                      className="w-full h-56 object-cover"
                    />
                  </div>
                  {Array.isArray(viewProduct.galleryImages) &&
                    viewProduct.galleryImages.length > 0 && (
                      <div>
                        <p
                          className="text-xs mb-2 font-medium"
                          style={{ color: themeColors.text }}
                        >
                          Gallery
                        </p>
                        <div className="flex gap-2 overflow-x-auto">
                          {viewProduct.galleryImages.map((g, i) => (
                            <img
                              key={i}
                              src={g.url}
                              alt={`${viewProduct.name} ${i + 1}`}
                              className="w-16 h-16 object-cover rounded-md flex-shrink-0 border"
                              style={{
                                borderColor: themeColors.border,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Details section */}
                <div className="space-y-3 text-sm">
                  <div>
                    <p
                      className="text-xs uppercase font-semibold mb-1"
                      style={{ color: themeColors.text }}
                    >
                      Pricing
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-lg font-bold"
                        style={{ color: themeColors.primary }}
                      >
                        {fmtCurrency(getFinalPrice(viewProduct))}
                      </span>
                      {viewProduct.discountPercent ? (
                        <>
                          <span className="line-through text-xs opacity-70">
                            {fmtCurrency(viewProduct.price)}
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{
                              color:
                                themeColors.success ||
                                themeColors.primary,
                            }}
                          >
                            {viewProduct.discountPercent}% OFF
                          </span>
                        </>
                      ) : (
                        <span className="text-xs opacity-70">
                          {fmtCurrency(viewProduct.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p
                      className="text-xs uppercase font-semibold mb-1"
                      style={{ color: themeColors.text }}
                    >
                      Category
                    </p>
                    <p style={{ color: themeColors.text }}>
                      {viewProduct.category?.name ||
                        viewProduct.categoryId?.name ||
                        categoryMap[viewProduct.categoryId] ||
                        "-"}
                    </p>
                  </div>

                  {viewProduct.description && (
                    <div>
                      <p
                        className="text-xs uppercase font-semibold mb-1"
                        style={{ color: themeColors.text }}
                      >
                        Description
                      </p>
                      <p style={{ color: themeColors.text }}>
                        {viewProduct.description}
                      </p>
                    </div>
                  )}

                  {viewProduct.about?.ingredients && (
                    <div>
                      <p
                        className="text-xs uppercase font-semibold mb-1"
                        style={{ color: themeColors.text }}
                      >
                        Ingredients
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: themeColors.text }}
                      >
                        {viewProduct.about.ingredients}
                      </p>
                    </div>
                  )}

                  {viewProduct.about?.shelfLife && (
                    <div>
                      <p
                        className="text-xs uppercase font-semibold mb-1"
                        style={{ color: themeColors.text }}
                      >
                        Shelf Life
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: themeColors.text }}
                      >
                        {viewProduct.about.shelfLife}
                      </p>
                    </div>
                  )}

                  {viewProduct.about?.netWeight && (
                    <div>
                      <p
                        className="text-xs uppercase font-semibold mb-1"
                        style={{ color: themeColors.text }}
                      >
                        Net Weight
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: themeColors.text }}
                      >
                        {viewProduct.about.netWeight}
                      </p>
                    </div>
                  )}

                  {(Array.isArray(viewProduct.sizes) &&
                    viewProduct.sizes.length > 0) && (
                    <div>
                      <p
                        className="text-xs uppercase font-semibold mb-1"
                        style={{ color: themeColors.text }}
                      >
                        Sizes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {viewProduct.sizes.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-full text-[11px]"
                            style={{
                              backgroundColor:
                                themeColors.background + "60",
                              color: themeColors.text,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(Array.isArray(viewProduct.colors) &&
                    viewProduct.colors.length > 0) && (
                    <div>
                      <p
                        className="text-xs uppercase font-semibold mb-1"
                        style={{ color: themeColors.text }}
                      >
                        Colors
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {viewProduct.colors.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded-full text-[11px]"
                            style={{
                              backgroundColor:
                                themeColors.background + "60",
                              color: themeColors.text,
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(Array.isArray(viewProduct.addOns) &&
                    viewProduct.addOns.length > 0) && (
                    <div>
                      <p
                        className="text-xs uppercase font-semibold mb-1"
                        style={{ color: themeColors.text }}
                      >
                        Add-ons
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {viewProduct.addOns.map((a, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-[11px]"
                            style={{
                              backgroundColor: a.isDefault
                                ? (themeColors.success ||
                                    themeColors.primary) + "20"
                                : themeColors.background + "60",
                              color: themeColors.text,
                            }}
                          >
                            {a.name}{" "}
                            {a.price
                              ? `(+${fmtCurrency(a.price)})`
                              : ""}
                            {a.isDefault ? " • Default" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-xs opacity-70 space-y-1">
                    <p style={{ color: themeColors.text }}>
                      Created:{" "}
                      {viewProduct.createdAt
                        ? fmtDate(viewProduct.createdAt)
                        : "-"}
                    </p>
                    {viewProduct.updatedAt && (
                      <p style={{ color: themeColors.text }}>
                        Updated: {fmtDate(viewProduct.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom actions (optional quick actions) */}
              <div className="flex justify-end gap-2 pt-2">
                {isLoggedIn && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleEdit(viewProduct);
                        setViewProduct(null);
                      }}
                      className="px-3 py-2 rounded-lg text-xs border flex items-center gap-1"
                      style={{
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                        color: themeColors.text,
                      }}
                    >
                      <FaEdit /> Edit
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setViewProduct(null)}
                  className="px-3 py-2 rounded-lg text-xs border"
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
