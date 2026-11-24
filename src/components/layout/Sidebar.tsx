"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ALGORITHM_CONFIG,
  GTS_SIDEBAR_SECTIONS,
  PPS_SIDEBAR_SECTIONS,
} from "@/lib/algorithm-config";

function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");

  const isPps = pathname.startsWith("/pps");
  const modulePrefix = isPps ? "/pps" : "/gts";
  const moduleTitle = isPps ? "PPS" : "GTS";
  const moduleSub = isPps ? "Phương Pháp Số" : "Giải Tích Số";
  const moduleIcon = isPps ? "∫" : "∑";
  const sections = isPps ? PPS_SIDEBAR_SECTIONS : GTS_SIDEBAR_SECTIONS;

  const filteredSections = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return sections;
    return sections
      .map((section) => ({
        methods: section.methods.filter((method) => {
          const cfg = ALGORITHM_CONFIG[method];
          const haystack = normalizeSearch(
            `${cfg.title} ${cfg.subtitle} ${method}`,
          );
          return haystack.includes(q);
        }),
      }))
      .filter((section) => section.methods.length > 0);
  }, [sections, query]);

  const isActive = (method: string) => {
    return (
      pathname === `${modulePrefix}/${method}` ||
      pathname.startsWith(`${modulePrefix}/${method}/`)
    );
  };

  return (
    <aside
      className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}
      aria-label="Algorithm Navigation"
    >
      {/* Header */}
      <div className="sidebar-header">
        <Link
          href="/"
          className="sidebar-logo"
          title="Về trang chủ chọn phân hệ môn học"
        >
          <span className="sidebar-logo-icon">{moduleIcon}</span>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">{moduleTitle}</span>
              <span className="sidebar-logo-sub">{moduleSub}</span>
            </div>
          )}
        </Link>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {collapsed ? "→" : "☰"}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="sidebar-search">
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Tìm thuật toán..."
            aria-label="Tìm thuật toán"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="sidebar-search-clear"
              onClick={() => setQuery("")}
              aria-label="Xóa tìm kiếm"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Navigation sections */}
      <nav className="sidebar-nav">
        {filteredSections.length === 0 ? (
          !collapsed && <div className="sidebar-empty">Không tìm thấy</div>
        ) : (
          filteredSections.map((section, idx) => (
            <div key={section.methods[0] ?? idx} className="sidebar-section">
              <ul className="algo-list" role="list">
                {section.methods.map((method) => {
                  const cfg = ALGORITHM_CONFIG[method];
                  const active = isActive(method);
                  return (
                    <li key={method}>
                      <Link
                        href={`${modulePrefix}/${method}`}
                        className={`algo-btn ${active ? "algo-btn--active" : ""}`}
                        title={collapsed ? cfg.title : undefined}
                      >
                        <span className="algo-icon">{cfg.icon}</span>
                        {!collapsed && (
                          <div className="algo-info">
                            <span className="algo-name">
                              {cfg.title.replace("Phương Pháp ", "")}
                            </span>
                            <span className="algo-desc">
                              {cfg.subtitle.split("—")[0].trim()}
                            </span>
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}
