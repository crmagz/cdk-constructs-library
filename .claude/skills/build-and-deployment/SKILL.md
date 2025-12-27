---
name: build-and-deployment
description: Build commands, build order, TypeScript configuration, and CDK deployment. Use when building packages, troubleshooting build issues, or deploying stacks.
---

# Build and Deployment

## Make Commands (Recommended)

Use `make` for deterministic, hermetic builds that work the same locally and in CI/CD:

```bash
# Show all available commands
make help

# Install dependencies
make install

# Clean build artifacts
make clean

# Build all packages in dependency order
make build-all

# Build root package only
make build

# Build CDK app only
make build-app
```

## Code Quality Commands

```bash
# Run linter
make lint

# Fix linting issues
make lint-fix

# Format code
make format

# Check formatting (CI)
make format-check

# Format and fix linting
make format-fix

# Run all quality checks (format + lint)
make check
```

## CDK Commands

```bash
# Synthesize CloudFormation templates
make synth

# Show CDK diff
make diff

# Deploy all stacks
make deploy

# Deploy specific stack
make deploy-stack STACK=StackName
```

## CI/CD Commands

```bash
# CI check (format-check + lint)
make ci-check

# CI build (checks + full build)
make ci-build

# CI deploy (checks + build + synth)
make ci-deploy
```

## Underlying npm Commands

The Makefile wraps these npm commands:

```bash
npm install              # Install dependencies
npm run clean            # Clean build artifacts
npm run build            # Build root package
npm run build:workspaces # Build all packages
npm run build:app        # Build CDK app
npm run lint             # Run linter
npm run lint:fix         # Fix linting
npm run format           # Format code
npm run format:check     # Check formatting
npm run format:fix       # Format and fix linting
npm run synth            # Synthesize CDK
npm run diff             # CDK diff
npm run deploy           # Deploy CDK
```

## Build Order

The build process ensures packages are built in dependency order:

1. **Root package** (`src/`) - Built first
2. **Base packages** (`aws`) - No internal dependencies
3. **Dependent packages** (`codeartifact`) - Built after dependencies
4. **CDK app** (`bin/`, `lib/`) - Built last, can import from all packages

### Build Script Details

The `build:workspaces` script:

1. Builds root package (`npm run build`)
2. Copies root to `node_modules/@cdk-constructs/cdk/` for workspace resolution
3. Builds all workspace packages using TypeScript project references
4. Builds CDK app files (`bin/`, `lib/`)

## TypeScript Configuration

### Root Package (`tsconfig.json`)

- Builds `src/**/*` only
- Excludes `bin/`, `lib/`, and `packages/`

### CDK App (`tsconfig.app.json`)

- Builds `bin/**/*` and `lib/**/*`
- Can import from workspace packages after they're built

### Workspace Build (`tsconfig.build.json`)

- Lists packages in dependency order
- Uses TypeScript project references for incremental builds

## Common Build Issues

### Issue: "Cannot find module '@cdk-constructs/...'"

**Solution**:

1. Run `make install` to set up workspace links
2. Run `make build-all` to build packages in order
3. Ensure package is listed in `tsconfig.build.json`

### Issue: Circular dependency detected

**Solution**:

1. Check package dependencies in `package.json`
2. Verify build order in `tsconfig.build.json`
3. Ensure no package depends on a package that depends on it
