import { Button } from "@/components/ui/button";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export default function PaginationBar({ meta, onPageChange, disabled = false }: { meta: PaginationMeta; onPageChange: (page: number) => void; disabled?: boolean }) {
  if (meta.total_pages <= 1) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">Showing {from}–{to} of {meta.total}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={disabled || meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>Previous</Button>
        <span className="min-w-24 text-center text-sm text-muted-foreground">Page {meta.page} of {meta.total_pages}</span>
        <Button variant="outline" size="sm" disabled={disabled || meta.page >= meta.total_pages} onClick={() => onPageChange(meta.page + 1)}>Next</Button>
      </div>
    </div>
  );
}
