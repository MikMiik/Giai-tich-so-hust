"use client";

import { type LogEntry } from "@/types/solver";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface LogOutputProps {
  entries: LogEntry[];
}

export default function LogOutput({ entries }: LogOutputProps) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔬</div>
        <p>
          Nhập tham số và nhấn <strong>▶ Chạy</strong> để bắt đầu.
        </p>
      </div>
    );
  }

  const renderCellContent = (content: unknown) => {
    if (
      typeof content === "string" &&
      (content.includes("$") ||
        content.includes("*") ||
        content.includes("`") ||
        content.includes("\\"))
    ) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{ p: ({ children }) => <>{children}</> }}
        >
          {content}
        </ReactMarkdown>
      );
    }
    return content !== null && content !== undefined ? String(content) : "";
  };

  return (
    <>
      {entries.map((entry, idx) => {
        const delay = `${Math.min(idx * 8, 200)}ms`;

        if (entry.type === "separator") {
          return <hr key={idx} className="log-separator" />;
        }

        if (entry.type === "section") {
          const content = entry.content as string;
          return (
            <div key={idx} className="log-section">
              <span className="log-section-bullet">▸</span>{" "}
              {content.includes("$") ? (
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{ p: ({ children }) => <>{children}</> }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                content
              )}
            </div>
          );
        }

        if (entry.type === "table") {
          const data = entry.content as Record<string, unknown>[];
          if (!data || data.length === 0) return null;
          const headers = Object.keys(data[0]);
          return (
            <div
              key={idx}
              className="log-entry"
              style={{ animationDelay: delay }}
            >
              <div className="log-table-wrapper">
                <table className="log-table">
                  <thead>
                    <tr>
                      {headers.map((h) => (
                        <th key={h}>{renderCellContent(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, ri) => (
                      <tr key={ri}>
                        {headers.map((h) => (
                          <td
                            key={h}
                            style={
                              typeof row[h] === "string" &&
                              (row[h] as string).includes("\n")
                                ? { whiteSpace: "pre" }
                                : undefined
                            }
                          >
                            {renderCellContent(row[h])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        const classMap: Record<string, string> = {
          text: "log-text",
          info: "log-info",
          success: "log-success",
          warn: "log-warn",
          error: "log-error-text",
          step: "log-step",
          formula: "log-formula",
          result: "log-result",
        };

        const className = `log-entry ${classMap[entry.type] || "log-text"}`;
        return (
          <div
            key={idx}
            className={className}
            style={{
              animationDelay: delay,
              whiteSpace:
                typeof entry.content === "string" &&
                (entry.content as string).includes("\n")
                  ? "pre-wrap"
                  : undefined,
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {entry.content as string}
            </ReactMarkdown>
          </div>
        );
      })}
    </>
  );
}
