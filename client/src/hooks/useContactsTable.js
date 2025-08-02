import { useState, useCallback } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel, 
  getPaginationRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
} from '@tanstack/react-table';

// Custom hook for optimized table state management
export const useContactsTable = ({ 
  data = [], 
  columns = [], 
  state = {}, 
  onStateChange = () => {} 
}) => {
  // Table state - use external state if provided, otherwise internal state
  const [sorting, setSorting] = useState(state.sorting || []);
  const [columnFilters, setColumnFilters] = useState(state.columnFilters || []);
  const [columnVisibility, setColumnVisibility] = useState(state.columnVisibility || {});
  const [rowSelection, setRowSelection] = useState(state.rowSelection || {});
  const [globalFilter, setGlobalFilter] = useState(state.globalFilter || '');
  const [columnSizing, setColumnSizing] = useState(state.columnSizing || {});
  const [columnOrder, setColumnOrder] = useState(state.columnOrder || []);
  const [expanded, setExpanded] = useState(state.expanded || {});
  const [pagination, setPagination] = useState(state.pagination || {
    pageIndex: 0,
    pageSize: 25,
  });

  // Memoized table configuration
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnSizing,
      expanded,
      pagination,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    enableExpanding: true,
    enableMultiRowSelection: true,
    enableSubRowSelection: true,
    enableGrouping: false,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    
    // State setters
    onSortingChange: (updater) => {
      setSorting(updater);
      onStateChange({ sorting: typeof updater === 'function' ? updater(sorting) : updater });
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      onStateChange({ columnFilters: typeof updater === 'function' ? updater(columnFilters) : updater });
    },
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility(updater);
      onStateChange({ columnVisibility: typeof updater === 'function' ? updater(columnVisibility) : updater });
    },
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      onStateChange({ rowSelection: typeof updater === 'function' ? updater(rowSelection) : updater });
    },
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      onStateChange({ globalFilter: typeof updater === 'function' ? updater(globalFilter) : updater });
    },
    onColumnSizingChange: (updater) => {
      setColumnSizing(updater);
      onStateChange({ columnSizing: typeof updater === 'function' ? updater(columnSizing) : updater });
    },
    onColumnOrderChange: (updater) => {
      setColumnOrder(updater);
      onStateChange({ columnOrder: typeof updater === 'function' ? updater(columnOrder) : updater });
    },
    onExpandedChange: (updater) => {
      setExpanded(updater);
      onStateChange({ expanded: typeof updater === 'function' ? updater(expanded) : updater });
    },
    onPaginationChange: (updater) => {
      setPagination(updater);
      onStateChange({ pagination: typeof updater === 'function' ? updater(pagination) : updater });
    },
    
    // Core models
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    
    // Performance optimizations
    enableSortingRemoval: true,
    enableMultiSort: true,
    isMultiSortEvent: (e) => e.shiftKey,
    maxMultiSortColCount: 3,
    
    // Filter functions
    globalFilterFn: 'includesString',
    
    // Debug (only in development)
    debugTable: process.env.NODE_ENV === 'development',
    debugHeaders: process.env.NODE_ENV === 'development',
    debugColumns: process.env.NODE_ENV === 'development',
  });

  // Helper functions
  const getSelectedRowIds = useCallback(() => {
    return Object.keys(rowSelection).filter(id => rowSelection[id]);
  }, [rowSelection]);

  const getSelectedRows = useCallback(() => {
    return table.getSelectedRowModel().rows;
  }, [table]);

  const getFilteredSelectedRows = useCallback(() => {
    const selectedRows = table.getSelectedRowModel().rows;
    const filteredRows = table.getFilteredRowModel().rows;
    
    // Return only the selected rows that are also in the filtered results
    return selectedRows.filter(selectedRow => 
      filteredRows.some(filteredRow => filteredRow.id === selectedRow.id)
    );
  }, [table]);

  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  const resetRowSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  const clearAllFilters = useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter('');
  }, []);

  const resetTable = useCallback(() => {
    setSorting([]);
    setColumnFilters([]);
    setGlobalFilter('');
    setRowSelection({});
    setExpanded({});
  }, []);

  const toggleAllColumnsVisible = useCallback(() => {
    table.toggleAllColumnsVisible();
  }, [table]);

  // Computed values
  const selectedCount = Object.keys(rowSelection).length;
  const totalRows = data.length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const hasFilters = columnFilters.length > 0 || globalFilter !== '';
  const hasSelection = selectedCount > 0;

  // Pagination helpers
  const paginationState = {
    pageIndex: table.getState().pagination.pageIndex,
    pageSize: table.getState().pagination.pageSize,
    pageCount: table.getPageCount(),
    canPreviousPage: table.getCanPreviousPage(),
    canNextPage: table.getCanNextPage(),
  };

  const paginationActions = {
    setPageIndex: table.setPageIndex,
    setPageSize: table.setPageSize,
    previousPage: table.previousPage,
    nextPage: table.nextPage,
    firstPage: () => table.setPageIndex(0),
    lastPage: () => table.setPageIndex(table.getPageCount() - 1),
  };

  return {
    // Spread the table instance to expose all TanStack Table methods
    ...table,
    
    // State
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    globalFilter,
    columnSizing,
    expanded,
    pagination,
    
    // State setters
    setSorting,
    setColumnFilters,
    setColumnVisibility,
    setRowSelection,
    setGlobalFilter,
    setColumnSizing,
    setExpanded,
    setPagination,
    
    // Helper functions
    getSelectedRowIds,
    getSelectedRows,
    getFilteredSelectedRows,
    clearSelection,
    resetRowSelection,
    clearAllFilters,
    resetTable,
    toggleAllColumnsVisible,
    
    // Computed values
    selectedCount,
    totalRows,
    filteredRows,
    hasFilters,
    hasSelection,
    
    // Pagination
    paginationState,
    paginationActions,
  };
};

// Custom hook for persisting table state to localStorage
export const usePersistedTableState = (key, defaultState = {}) => {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(`table_${key}`);
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  const updateState = useCallback((updates) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      try {
        localStorage.setItem(`table_${key}`, JSON.stringify(newState));
      } catch (error) {
        console.warn('Failed to save table state:', error);
      }
      return newState;
    });
  }, [key]);

  const clearState = useCallback(() => {
    setState(defaultState);
    try {
      localStorage.removeItem(`table_${key}`);
    } catch (error) {
      console.warn('Failed to clear table state:', error);
    }
  }, [key, defaultState]);

  return [state, updateState, clearState];
};
