import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';
import { Inbox } from 'lucide-react';

function RowMenu({ items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="dash-menu__dropdown" ref={ref} role="menu">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className={`dash-menu__item ${item.danger ? 'dash-menu__item--danger' : ''}`}
          onClick={() => {
            item.onClick?.();
            onClose();
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

/**
 * @param {object} props
 * @param {Array<{ key: string, label: string, width?: string }>} props.columns
 * @param {Array<object>} props.data
 * @param {(row: object) => React.ReactNode} props.renderCell
 * @param {(row: object) => Array<{ label: string, onClick: () => void, icon?: React.ReactNode, danger?: boolean }>} [props.rowActions]
 * @param {number} [props.pageSize]
 */
export default function DataTable({
  columns,
  data = [],
  renderCell,
  rowActions,
  pageSize = 5,
  emptyTitle = 'No data yet',
  emptyDescription = 'Records will appear here once available.',
  onRowClick,
}) {
  const [page, setPage] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = data.slice(safePage * pageSize, safePage * pageSize + pageSize);

  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [data.length, page, totalPages]);

  if (!data.length) {
    return (
      <EmptyState
        icon={Inbox}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <>
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
              {rowActions && <th style={{ width: 48 }} aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr
                key={row.id ?? row.key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key}>{renderCell(row, col.key)}</td>
                ))}
                {rowActions && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="dash-table__row-action">
                      <div className="dash-menu">
                        <button
                          type="button"
                          className="dash-menu__trigger"
                          aria-label="Row actions"
                          aria-expanded={openMenuId === row.id}
                          onClick={() =>
                            setOpenMenuId(openMenuId === row.id ? null : row.id)
                          }
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenuId === row.id && (
                          <RowMenu
                            items={rowActions(row)}
                            onClose={() => setOpenMenuId(null)}
                          />
                        )}
                      </div>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > pageSize && (
        <div className="dash-pagination">
          <span className="dash-pagination__info">
            Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, data.length)} of{' '}
            {data.length}
          </span>
          <div className="dash-pagination__controls">
            <button
              type="button"
              className="dash-btn dash-btn--ghost dash-btn--sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--ghost dash-btn--sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
