import { useMemo } from 'react';

function pageWindow(page, totalPages) {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);
  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
}

export function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  const pages = useMemo(() => pageWindow(page, totalPages), [page, totalPages]);
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Phân trang">
      <ul className="pagination mb-0 justify-content-center">
        <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}><button type="button" className="page-link" aria-label="Trang trước" onClick={() => onPageChange(page - 1)}><i className="bi bi-chevron-left" /></button></li>
        {pages.map((item) => <li className={`page-item ${item === page ? 'active' : ''}`} key={item}><button type="button" className="page-link" aria-current={item === page ? 'page' : undefined} onClick={() => onPageChange(item)}>{item}</button></li>)}
        <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}><button type="button" className="page-link" aria-label="Trang sau" onClick={() => onPageChange(page + 1)}><i className="bi bi-chevron-right" /></button></li>
      </ul>
    </nav>
  );
}
