import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

export default function Pagination({ pagination, onPageChange }) {
    const { themeColors } = useTheme();
    const { page, totalPages, total, limit } = pagination;

    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-2">
            <div className="text-xs font-bold uppercase tracking-wider opacity-50" style={{ color: themeColors.text }}>
                Showing <span className="text-primary" style={{ color: themeColors.primary }}>{Math.min((page - 1) * limit + 1, total)}</span> to <span className="text-primary" style={{ color: themeColors.primary }}>{Math.min(page * limit, total)}</span> of <span className="text-primary" style={{ color: themeColors.primary }}>{total}</span> entries
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2.5 rounded-xl border transition-all hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: themeColors.border, color: themeColors.text }}
                >
                    <FaChevronLeft className="text-xs" />
                </button>

                <div className="flex items-center gap-1">
                    {getPages().map((p) => (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`min-w-[40px] h-10 rounded-xl text-xs font-bold transition-all ${page === p ? "shadow-lg scale-110" : "hover:bg-black/5"
                                }`}
                            style={{
                                backgroundColor: page === p ? themeColors.primary : "transparent",
                                color: page === p ? themeColors.onPrimary : themeColors.text,
                                border: page === p ? "none" : `1px solid ${themeColors.border}`,
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-2.5 rounded-xl border transition-all hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: themeColors.border, color: themeColors.text }}
                >
                    <FaChevronRight className="text-xs" />
                </button>
            </div>
        </div>
    );
}
