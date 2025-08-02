Migrate the current custom React table implementation in `ContactPage.js` to use `@tanstack/react-table`. This is a **code-only migration** focused on replacing the internal table logic — not a structural redesign of the project.

🔒 Hard constraint: All code and logic must stay within `ContactPage.js`. Do not create or suggest new files, folders, custom hooks, or components. This is a one-file implementation only.

🎯 Objective:
Refactor the custom React table currently implemented in `ContactPage.js` to use TanStack Table (`@tanstack/react-table`). Replace the manual logic for table rendering, sorting, pagination, etc., with the appropriate TanStack hooks and APIs. You must preserve all existing CSS classes and styles defined in `table.css`. The final table should retain its current HubSpot-inspired look and functionality.

🧠 Current Implementation Context:
- Framework: React with functional components and hooks.
- Primary file: `ContactPage.js`
- Data source: `/api/contacts`, fetched externally and passed into the component as a prop
- Styling: Custom modular CSS defined in `table.css`, `variables.css`, and similar files. These styles are required and **must not** be replaced or overridden.
- No third-party table libraries are currently used. This is a manual-to-TanStack migration.

⚙️ Refactor Guidelines:
Use TanStack's `useReactTable` to handle state and rendering. Define columns using either `createColumnHelper()` or a plain array. Use TanStack-provided methods (`getHeaderGroups`, `getRowModel`, etc.) for rendering instead of map functions. All HTML table structure should remain semantic (`<table>`, `<thead>`, `<tbody>`, etc.).

Apply all existing class names (sticky header, row hover, loading states, etc.) from `table.css` to the new TanStack-generated DOM elements.

📋 Required Features to Implement Using TanStack Table:

A. Layout & Structure:
- Sticky headers using existing CSS from `table.css`
- Scrollable body
- Responsive design using current media queries

B. Table Interactions:
- Sorting (toggle per column). Use existing class for visual cues
- Global search filter (search box that filters all rows)
- Pagination (next, previous, page numbers, and page size selector)
- Row selection with checkboxes and bulk action state. Apply `.selected-row` class for selected rows
- Column resizing. Use `.column-resizer` class for drag handles

C. Custom Cell Renderers:
- **Name/Contact cell**: Render avatar, name, and show "View" button on hover using current styles
- **Status cell**: Render badge based on value ("Active", "Inactive", etc.) using correct class
- **Actions cell**: Include Edit, View, Delete buttons with their respective click handlers and class names
- **Editable cells**: In-place editing for contact name, due date, etc. Use `.editable-cell`, `.editable-input`, and `.editable-select` styles

D. Data + Loading:
- Data must update reactively when prop changes
- When loading, show `.loading-container` with `.loading-spinner` overlay

🚫 Do Not:
- Do not split code into new files (no `columns.js`, no `TableWrapper`, etc.)
- Do not create folders (e.g., `/components`, `/hooks`, etc.)
- Do not import UI libraries or overwrite the existing CSS
- Do not rename or reformat unrelated parts of the component
- Do not introduce utility functions outside the file

✅ Final Deliverable:
A single updated `ContactPage.js` file using `@tanstack/react-table` for all table logic. The updated table must exactly match the current feature set, styling, and UI behavior, but with all logic migrated to TanStack’s model.

All changes must respect the one-file rule. Think of this as a direct swap-in migration with feature parity — no architectural or folder-level changes allowed.
