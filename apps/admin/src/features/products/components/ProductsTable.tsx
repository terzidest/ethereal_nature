import type { ProductResponse, ProductSortDto } from '@ethereal-nature/api-client'
import { Link } from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { categoryLabel, formatPrice } from '../derive'

const columnHelper = createColumnHelper<ProductResponse>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <span className="flex items-center gap-2">
        <Link
          to="/products/$productId"
          params={{ productId: info.row.original.id }}
          className="font-medium text-brand-700 hover:text-brand-900"
        >
          {info.getValue()}
        </Link>
        {info.row.original.archived && (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
            archived
          </span>
        )}
      </span>
    ),
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    enableSorting: false,
    cell: (info) => categoryLabel(info.getValue()),
  }),
  columnHelper.accessor('priceMinor', {
    header: 'Price',
    cell: (info) => formatPrice(info.getValue(), info.row.original.currency),
  }),
  columnHelper.accessor('stock', {
    header: 'Stock',
    enableSorting: false,
    cell: (info) => (
      <span className={info.getValue() === 0 ? 'font-medium text-red-600' : ''}>{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('slug', {
    header: 'Slug',
    enableSorting: false,
    cell: (info) => <code className="text-xs text-ink/60">{info.getValue()}</code>,
  }),
]

/** The API's sort vocabulary is the source of truth; table sorting maps onto it. */
export function sortToSorting(sort: ProductSortDto): SortingState {
  switch (sort) {
    case 'name':
      return [{ id: 'name', desc: false }]
    case 'price-asc':
      return [{ id: 'priceMinor', desc: false }]
    case 'price-desc':
      return [{ id: 'priceMinor', desc: true }]
    case 'newest':
      return []
  }
}

export function sortingToSort(sorting: SortingState): ProductSortDto {
  const first = sorting[0]
  if (!first) return 'newest'
  if (first.id === 'name') return 'name'
  if (first.id === 'priceMinor') return first.desc ? 'price-desc' : 'price-asc'
  return 'newest'
}

export function ProductsTable({
  products,
  sort,
  onSortChange,
}: {
  products: ProductResponse[]
  sort: ProductSortDto
  onSortChange: (sort: ProductSortDto) => void
}) {
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: { sorting: sortToSorting(sort) },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sortToSorting(sort)) : updater
      onSortChange(sortingToSort(next))
    },
  })

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-brand-100 text-left">
            {headerGroup.headers.map((header) => {
              const sortable = header.column.getCanSort()
              return (
                <th key={header.id} className="px-3 py-2 font-semibold text-ink/70">
                  <button
                    type="button"
                    disabled={!sortable}
                    onClick={header.column.getToggleSortingHandler()}
                    className={sortable ? 'cursor-pointer hover:text-ink' : 'cursor-default'}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                  </button>
                </th>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="border-b border-brand-50 hover:bg-brand-50/50">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-3 py-2.5">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
