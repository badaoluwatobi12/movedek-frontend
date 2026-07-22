import { useEffect, useMemo, useState } from "react";

export function useClientPagination<T>(items: T[], limit = 10, resetKeys: unknown[] = []) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  useEffect(() => setPage(1), resetKeys); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const pagedItems = useMemo(() => items.slice((page - 1) * limit, page * limit), [items, limit, page]);
  return { items: pagedItems, page, setPage, pagination: { page, limit, total, total_pages: totalPages } };
}
