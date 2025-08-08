# Styles Refactor & Modularization Guide

This guide outlines a phased approach to refactoring and modularizing the CSS in your React project for improved scalability and maintainability.

---

## Phase 1: Planning & Preparation

1. **Review Existing Styles**
   - Audit all current CSS files (`global.css`, component-specific CSS, etc.).
   - List all unique style concerns (variables, typography, tables, forms, sidebar, components, themes).

2. **Set Up New Structure**
   - In `client/src/styles/`, create:
     - `variables.css` (use the current one for now)
     - `typography.css` (blank for now)
     - `forms.css` (blank for now)
     - `components.css` (blank for now)
     - `sidebar.css` (use the current one for now)
     - `themes.css` (blank for now)
     - `tables/` folder with `tables.css`, `column-borders.css`, `editable-cells.css`
     - `global.css` (use the current one for now)

---

## Phase 2: Migrate Variables & Base Styles

1. **Move Variables**
   - Copy all color, spacing, font, and shadow variables into `variables.css` using `:root { ... }`.

2. **Set Up Typography**
   - Move/reset all base font, heading, and link styles to `typography.css`.
   - Reference variables from `variables.css`.

3. **Create Import Structure**
   - In `global.css`, import all new CSS files in logical order.

---

## Phase 3: Modularize Component & Layout Styles

1. **Tables**
   - Move all table-related styles to the `tables/` folder, splitting by concern.

2. **Sidebar**
   - Move sidebar navigation/layout styles to `sidebar.css`.

3. **Forms**
   - Move all form, input, label, and error styles to `forms.css`.

4. **Components**
   - Move generic UI elements (buttons, cards, modals) to `components.css`.

5. **Themes**
   - Move theme-specific variables and overrides to `themes.css`.

---

## Phase 4: Update Imports & Clean Up

1. **Update Entry Point**
   - In `client/src/index.js`, import the new `global.css`.

2. **Remove Old Imports**
   - Remove old `global.css` and redundant CSS imports from components.

3. **Test the App**
   - Run the app and verify that styles are applied correctly.
   - Fix any broken or missing styles by updating the new CSS files.

---

## Phase 5: Finalize & Document

1. **Remove Unused CSS**
   - Delete the old, unused `global.css` and redundant component CSS files.

2. **Document the Structure**
   - Add a `README.md` in the `styles/` folder explaining the structure and conventions.

3. **Establish Guidelines**
   - Document how to add new styles, variables, and themes for future contributors.

---

**Tip:** Tackle one style concern at a time per phase, testing after each major change. This minimizes breakage and makes the migration manageable.
