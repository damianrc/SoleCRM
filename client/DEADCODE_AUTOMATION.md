// Dead code and unused dependency check for client
// Usage: npm run check:deadcode

"scripts": {
  // ...existing scripts...
  "check:deadcode": "npx depcheck && npx unimported"
}

// To remove unused dependencies automatically, run:
// npx depcheck --json | jq -r '.dependencies[]' | xargs npm uninstall
// (Requires jq installed)

// To add missing dependencies:
// npm install <package>

// To run this check regularly, add to your CI or pre-commit hooks.
