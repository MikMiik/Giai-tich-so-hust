import SolverShell from "@/components/solver/SolverShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trực chuẩn Gram-Schmidt | GTS",
  description: "Trực giao và trực chuẩn hóa tập vector bằng phương pháp Gram-Schmidt.",
};

export default function GramSchmidtPage() {
  return <SolverShell method="gram-schmidt" />;
}
