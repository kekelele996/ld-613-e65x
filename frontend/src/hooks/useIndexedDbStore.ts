import { useEffect, useMemo, useState } from "react";

/**
 * 通用列表分页（IndexedDB 读取出的全量行在内存分页）。
 * 列表变化后自动夹取到合法页码。
 */
export function useIndexedDbStore<T>(rows: T[] = [], pageSize = 8) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize]
  );

  return { page, setPage, pageSize, pageRows, total: rows.length, totalPages };
}
