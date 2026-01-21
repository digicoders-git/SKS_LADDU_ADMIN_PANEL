import { useEffect, useState, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { getAllUsers } from "../apis/user";
import Pagination from "../components/Pagination";
import {
    FaUsers,
    FaSearch,
    FaSyncAlt,
    FaEye,
    FaUserCircle,
    FaEnvelope,
    FaPhone,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaChevronRight,
} from "react-icons/fa";
import Swal from "sweetalert2";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }) : "-";

export default function Users() {
    const { themeColors } = useTheme();
    const { currentFont } = useFont();
    const { isLoggedIn } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            setError("");
            const res = await getAllUsers(page, 10);
            setUsers(res.users || []);
            if (res.pagination) {
                setPagination(res.pagination);
            }
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Failed to load users.";
            setError(msg);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: msg,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1);
    }, []);

    const handlePageChange = (newPage) => {
        fetchUsers(newPage);
    };

    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users;
        const q = search.toLowerCase();
        return users.filter((u) => {
            const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
            const email = (u.email || "").toLowerCase();
            const phone = (u.phone || "").toLowerCase();
            return fullName.includes(q) || email.includes(q) || phone.includes(q);
        });
    }, [users, search]);

    const handleViewDetails = (user) => {
        setSelectedUser(user);
    };

    return (
        <div className="space-y-6 animate-fadeIn" style={{ fontFamily: currentFont.family }}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: themeColors.text }}>
                        <div className="p-3 rounded-xl shadow-lg" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
                            <FaUsers />
                        </div>
                        Customer Management
                    </h1>
                    <p className="text-sm mt-2 opacity-70 max-w-xl" style={{ color: themeColors.text }}>
                        View and manage all registered customers. Track their activities, preferences, and details in one place.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-50 group-focus-within:opacity-100 transition-opacity" style={{ color: themeColors.text }} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, or phone..."
                            className="pl-10 pr-4 py-2.5 rounded-xl border text-sm w-full md:w-80 outline-none transition-all focus:ring-2"
                            style={{
                                backgroundColor: themeColors.surface,
                                borderColor: themeColors.border,
                                color: themeColors.text,
                                '--tw-ring-color': themeColors.primary + '40'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => fetchUsers(pagination.page)}
                        className="p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        style={{
                            backgroundColor: themeColors.surface,
                            borderColor: themeColors.border,
                            color: themeColors.text,
                        }}
                        title="Refresh List"
                    >
                        <FaSyncAlt className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Main Table Container */}
            <div
                className="rounded-3xl border overflow-hidden shadow-sm backdrop-blur-sm"
                style={{
                    backgroundColor: themeColors.surface + '80',
                    borderColor: themeColors.border
                }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{ backgroundColor: themeColors.background + '40' }}>
                                {["Customer", "Contact Info", "Registration", "Status", "Action"].map((h) => (
                                    <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: themeColors.text + '99' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full" style={{ borderColor: themeColors.primary }}></div>
                                            <p className="text-sm font-medium" style={{ color: themeColors.text }}>Fetching user data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <FaUsers className="text-6xl" />
                                            <p className="text-lg font-medium">No customers found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user._id}
                                        className="group hover:bg-black/5 transition-colors cursor-default"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full flex items-center justify-center text-xl overflow-hidden shadow-inner" style={{ backgroundColor: themeColors.primary + '15', color: themeColors.primary }}>
                                                    {user.firstName ? user.firstName[0].toUpperCase() : <FaUserCircle />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm capitalize" style={{ color: themeColors.text }}>
                                                        {user.firstName} {user.lastName}
                                                    </p>
                                                    <p className="text-xs opacity-60 flex items-center gap-1">
                                                        {user.gender || 'Not specified'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.text }}>
                                                    <FaEnvelope className="opacity-40" />
                                                    <span className="truncate max-w-[180px]">{user.email?.replace('mailto:', '')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.text }}>
                                                    <FaPhone className="opacity-40" />
                                                    <span>{user.phone || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium" style={{ color: themeColors.text }}>
                                                    {fmtDate(user.createdAt)}
                                                </span>
                                                <span className="text-[10px] uppercase opacity-50 font-bold tracking-tight">Joined</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor: user.isActive ? '#10b98115' : '#ef444415',
                                                    color: user.isActive ? '#10b981' : '#ef4444'
                                                }}
                                            >
                                                {user.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleViewDetails(user)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:translate-x-1"
                                                style={{
                                                    backgroundColor: themeColors.primary + '10',
                                                    color: themeColors.primary
                                                }}
                                            >
                                                View Details <FaChevronRight className="text-[10px]" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {!loading && pagination.totalPages > 1 && (
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
            )}

            {/* User Details Modal (same as before) */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div
                        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl animate-scaleIn flex flex-col"
                        style={{ backgroundColor: themeColors.surface }}
                    >
                        {/* Modal Header */}
                        <div className="p-8 pb-4 flex items-center justify-between border-b" style={{ borderColor: themeColors.border }}>
                            <div className="flex items-center gap-5">
                                <div className="h-20 w-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl" style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}>
                                    {selectedUser.firstName[0].toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black capitalize" style={{ color: themeColors.text }}>
                                        {selectedUser.firstName} {selectedUser.lastName}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm opacity-60 flex items-center gap-1"><FaEnvelope className="text-[10px]" /> {selectedUser.email?.replace('mailto:', '')}</span>
                                        <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                                        <span className="text-sm opacity-60 flex items-center gap-1"><FaPhone className="text-[10px]" /> {selectedUser.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="h-10 w-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 text-xl"
                                style={{ color: themeColors.text }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 rounded-3xl border space-y-4" style={{ backgroundColor: themeColors.background + '30', borderColor: themeColors.border }}>
                                    <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                                        <FaUserCircle /> Basic Information
                                    </h3>
                                    <div className="space-y-3">
                                        <DetailItem label="Gender" value={selectedUser.gender} />
                                        <DetailItem label="Birthday" value={fmtDate(selectedUser.dateOfBirth)} />
                                        <DetailItem label="Registration" value={fmtDate(selectedUser.createdAt)} />
                                        <DetailItem label="Last Login" value={selectedUser.lastLogin ? fmtDate(selectedUser.lastLogin) : 'Never'} />
                                    </div>
                                </div>

                                <div className="p-5 rounded-3xl border space-y-4" style={{ backgroundColor: themeColors.background + '30', borderColor: themeColors.border }}>
                                    <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                                        <FaCheckCircle /> Verification & Preferences
                                    </h3>
                                    <div className="space-y-3">
                                        <StatusItem label="Email Verified" status={selectedUser.isEmailVerified} />
                                        <StatusItem label="Phone Verified" status={selectedUser.isPhoneVerified} />
                                        <StatusItem label="Newsletter" status={selectedUser.preferences?.newsletter} />
                                        <StatusItem label="SMS Updates" status={selectedUser.preferences?.smsUpdates} />
                                    </div>
                                </div>

                                <div className="p-5 rounded-3xl border space-y-4" style={{ backgroundColor: themeColors.background + '30', borderColor: themeColors.border }}>
                                    <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                                        <FaMapMarkerAlt /> Addresses
                                    </h3>
                                    <div className="text-center py-4">
                                        <span className="text-4xl font-black" style={{ color: themeColors.primary }}>
                                            {selectedUser.addresses?.length || 0}
                                        </span>
                                        <p className="text-xs uppercase font-bold opacity-50 mt-1">Saved Addresses</p>
                                    </div>
                                </div>
                            </div>

                            {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold px-2" style={{ color: themeColors.text }}>Stored Addresses</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedUser.addresses.map((addr, idx) => (
                                            <div key={idx} className="p-6 rounded-[2rem] border transition-all hover:shadow-lg relative overflow-hidden group" style={{ borderColor: themeColors.border }}>
                                                <div className="absolute top-0 right-0 p-3">
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                                                        {addr.addressType}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: themeColors.text }}>
                                                    <FaUserCircle className="opacity-30" /> {addr.name}
                                                </h4>
                                                <div className="space-y-1.5">
                                                    <p className="text-xs opacity-70 leading-relaxed font-medium">
                                                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                                                    </p>
                                                    <p className="text-xs font-bold" style={{ color: themeColors.text }}>
                                                        {addr.city}, {addr.state} - {addr.pincode}
                                                    </p>
                                                    <p className="text-xs opacity-50 font-bold uppercase tracking-wider">{addr.country}</p>
                                                </div>
                                                <div className="mt-4 flex items-center gap-2 text-xs font-bold" style={{ color: themeColors.primary }}>
                                                    <FaPhone className="text-[10px]" /> {addr.phone}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t flex justify-end" style={{ borderColor: themeColors.border }}>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-8 py-3 rounded-2xl font-bold transition-all active:scale-95"
                                style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${themeColors.border};
          border-radius: 10px;
        }
      `}</style>
        </div>
    );
}

function DetailItem({ label, value }) {
    const { themeColors } = useTheme();
    return (
        <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold opacity-40 tracking-wider font-mono">{label}</span>
            <span className="text-sm font-semibold truncate" style={{ color: themeColors.text }}>{value || 'N/A'}</span>
        </div>
    );
}

function StatusItem({ label, status }) {
    const { themeColors } = useTheme();
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs font-medium opacity-70">{label}</span>
            <span
                className={`h-2 w-2 rounded-full ${status ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}
            ></span>
        </div>
    );
}
