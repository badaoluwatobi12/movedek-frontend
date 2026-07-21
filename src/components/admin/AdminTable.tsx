import type { ReactNode } from "react";
export default function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">{children}</div>
  );
}
