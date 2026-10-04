"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ALGORITHM_CONFIG, SIDEBAR_SECTIONS } from "@/lib/algorithm-config";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (method: string) => {
    return pathname === `/gts/${method}` || pathname.startsWith(`/gts/${method}/`);
  };

  return (
    <aside
      className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}
      aria-label="Algorithm Navigation"
    >
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">∑</span>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">GTS</span>
              <span className="sidebar-logo-sub">Giải Tích Số</span>
            </div>
          )}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {collapsed ? "→" : "☰"}
        </button>
      </div>

      {/* Navigation sections */}
      <nav className="sidebar-nav">
        {SIDEBAR_SECTIONS.map((section, idx) => (
          <div key={section.methods[0] ?? idx} className="sidebar-section">
            <ul className="algo-list" role="list">
              {section.methods.map((method) => {
                const cfg = ALGORITHM_CONFIG[method];
                const active = isActive(method);
                return (
                  <li key={method}>
                    <Link
                      href={`/gts/${method}`}
                      className={`algo-btn ${active ? "algo-btn--active" : ""}`}
                      title={collapsed ? cfg.title : undefined}
                    >
                      <span className="algo-icon">{cfg.icon}</span>
                      {!collapsed && (
                        <div className="algo-info">
                          <span className="algo-name">{cfg.title.replace("Phương Pháp ", "")}</span>
                          <span className="algo-desc">{cfg.subtitle.split("—")[0].trim()}</span>
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
