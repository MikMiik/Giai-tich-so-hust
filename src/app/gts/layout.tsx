import Sidebar from "@/components/layout/Sidebar";

export default function SolverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Animated background */}
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-glow bg-glow-1" aria-hidden="true" />
      <div className="bg-glow bg-glow-2" aria-hidden="true" />

      <div className="app-layout">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </>
  );
}
