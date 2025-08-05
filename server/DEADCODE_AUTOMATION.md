# Dead code and unused dependency check for server

## Usage
Run the following in the `server` directory:

```
npm run check:deadcode
```

## Scripts
Add this to your `package.json` scripts:

```
"check:deadcode": "npx depcheck && npx unimported"
```

## Remove unused dependencies automatically
```
npx depcheck --json | jq -r '.dependencies[]' | xargs npm uninstall
```
(Requires jq installed)

## Add missing dependencies
```
npm install <package>
```

## Automation
Add this check to your CI or pre-commit hooks for regular enforcement.
