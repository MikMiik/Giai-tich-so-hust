"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ALGORITHM_CONFIG,
  GTS_SIDEBAR_SECTIONS,
  PPS_SIDEBAR_SECTIONS,
} from "@/lib/algorithm-config";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isPps = pathname.startsWith("/pps");
  const modulePrefix = isPps ? "/pps" : "/gts";
  const moduleTitle = isPps ? "PPS" : "GTS";
  const moduleSub = isPps ? "Phương Pháp Số" : "Giải Tích Số";
  const moduleIcon = isPps ? "∫" : "∑";
  const sections = isPps ? PPS_SIDEBAR_SECTIONS : GTS_SIDEBAR_SECTIONS;

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

      {/* Navigation sections */}
      <nav className="sidebar-nav">
        {sections.map((section, idx) => (
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
        ))}
      </nav>
    </aside>
  );
}
