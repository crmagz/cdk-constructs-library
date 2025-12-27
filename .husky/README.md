# Git Hooks

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/).

## Pre-commit Hook

The pre-commit hook automatically runs **lint-staged** before each commit to ensure code quality.

### What It Does

1. **Formats** all staged `.ts`, `.js`, `.json`, and `.md` files with Prettier
2. **Lints and fixes** all staged `.ts` and `.js` files with ESLint

This ensures that:

- ✅ Code is always formatted consistently
- ✅ Linting issues are caught before commit
- ✅ Only staged files are checked (fast!)
- ✅ Same standards locally and in CI/CD

### Configuration

The lint-staged configuration is in `package.json`:

```json
"lint-staged": {
  "*.{ts,js,json,md}": [
    "prettier --write"
  ],
  "*.{ts,js}": [
    "eslint --fix"
  ]
}
```

### Setup

Git hooks are automatically set up when you run:

```bash
make install
# or
npm install
```

### Skipping Hooks (Not Recommended)

If you absolutely need to skip the pre-commit hook:

```bash
git commit --no-verify -m "message"
```

⚠️ **This is not recommended** as it bypasses quality checks.

### Troubleshooting

If hooks aren't running:

1. Ensure you've run `make install` or `npm install`
2. Check that `.husky/pre-commit` is executable: `ls -la .husky/pre-commit`
3. Reinstall hooks: `npx husky install`
