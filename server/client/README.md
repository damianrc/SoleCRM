### Step 1: Install TanStack Table

First, ensure you have TanStack Table installed in your project. You can do this by running:

```bash
npm install @tanstack/react-table
```

### Step 2: Refactor `TasksView.js`

Here’s a refactored version of the `TasksView.js` component that uses TanStack Table:

```javascript
// filepath: c:\Projects\solecrm\client\src\components\TasksView.js
import React from 'react';
import {
  useTable,
  useSortBy,
  usePagination,
  useRowSelect,
  useFilters,
} from '@tanstack/react-table';

const TasksView = ({ contacts, onTaskUpdate }) => {
  const data = React.useMemo(() => contacts, [contacts]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Contact Name',
        accessor: 'name', // accessor is the "key" in the data
      },
      {
        Header: 'Tasks',
        accessor: 'tasks',
        Cell: ({ row }) => (
          <ul>
            {row.original.tasks.map(task => (
              <li key={task.id}>
                {task.name} - {task.completed ? 'Completed' : 'Pending'}
                <button onClick={() => onTaskUpdate(row.original.id, task.id, { ...task, completed: !task.completed })}>
                  Toggle
                </button>
              </li>
            ))}
          </ul>
        ),
      },
    ],
    [onTaskUpdate]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    setGlobalFilter,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 },
    },
    useFilters,
    useSortBy,
    usePagination,
    useRowSelect
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        onChange={e => setGlobalFilter(e.target.value)}
      />
      <table {...getTableProps()} className="tasks-table">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>
        <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[5, 10, 20, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TasksView;
```

### Explanation of Features

1. **Sorting**: Each column header can be clicked to sort the data. The sorting direction is indicated with arrows.

2. **Filtering**: A global filter input allows users to search through the table data.

3. **Pagination**: The table supports pagination, allowing users to navigate through pages of data.

4. **Row Selection**: Each task can be toggled between completed and pending states.

5. **Custom Cell Content**: The tasks are displayed in a list format within the table cell, with a button to toggle the task's completion status.

### Step 3: CSS Styles

Ensure that your existing CSS styles are applied to the table. You may need to adjust the class names or styles based on your current CSS setup.

### Conclusion

This refactored `TasksView.js` component now utilizes TanStack Table to provide a more robust and user-friendly experience with sorting, filtering, pagination, and custom cell content. Adjust the styles and functionality as needed to fit your application's requirements.