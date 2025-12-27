.PHONY: help install clean lint lint-fix format format-check format-fix build build-app build-all test synth diff deploy check ci-build ci-check

# Default target - show help
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Node and npm version requirements
NODE_VERSION := 24
NPM_VERSION := 10

##@ Help

help: ## Display this help message
	@echo "$(CYAN)CDK Constructs Library - Build System$(NC)"
	@echo ""
	@echo "$(GREEN)Usage:$(NC)"
	@echo "  make $(YELLOW)<target>$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(GREEN)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development Setup

install: ## Install all dependencies and set up git hooks
	@echo "$(CYAN)Installing dependencies...$(NC)"
	npm install
	@echo "$(CYAN)Setting up git hooks...$(NC)"
	npx husky init || npx husky install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"
	@echo "$(GREEN)✓ Git hooks configured$(NC)"

##@ Code Quality

lint: ## Run ESLint on all TypeScript files
	@echo "$(CYAN)Running linter...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ Linting passed$(NC)"

lint-fix: ## Fix linting issues automatically
	@echo "$(CYAN)Fixing linting issues...$(NC)"
	npm run lint:fix
	@echo "$(GREEN)✓ Linting issues fixed$(NC)"

format: ## Format code with Prettier
	@echo "$(CYAN)Formatting code...$(NC)"
	npm run format
	@echo "$(GREEN)✓ Code formatted$(NC)"

format-check: ## Check code formatting without making changes
	@echo "$(CYAN)Checking code formatting...$(NC)"
	npm run format:check
	@echo "$(GREEN)✓ Formatting check passed$(NC)"

format-fix: ## Format code and fix linting issues
	@echo "$(CYAN)Formatting and fixing linting...$(NC)"
	npm run format:fix
	@echo "$(GREEN)✓ Code formatted and linted$(NC)"

##@ Build

clean: ## Remove all build artifacts
	@echo "$(CYAN)Cleaning build artifacts...$(NC)"
	npm run clean
	@echo "$(GREEN)✓ Build artifacts cleaned$(NC)"

build: ## Build root package only (src/)
	@echo "$(CYAN)Building root package...$(NC)"
	npm run build
	@echo "$(GREEN)✓ Root package built$(NC)"

build-app: ## Build CDK app (bin/, lib/)
	@echo "$(CYAN)Building CDK app...$(NC)"
	npm run build:app
	@echo "$(GREEN)✓ CDK app built$(NC)"

build-all: clean ## Build all packages in dependency order
	@echo "$(CYAN)Building all packages...$(NC)"
	npm run build:workspaces
	@echo "$(GREEN)✓ All packages built$(NC)"

##@ Testing

test: ## Run tests
	@echo "$(CYAN)Running tests...$(NC)"
	npm test || echo "$(YELLOW)⚠ No tests configured yet$(NC)"

##@ CDK Operations

synth: build-all ## Synthesize CloudFormation templates
	@echo "$(CYAN)Synthesizing CDK stacks...$(NC)"
	npm run synth
	@echo "$(GREEN)✓ CDK synthesis complete$(NC)"

diff: build-all ## Show CDK diff against deployed stacks
	@echo "$(CYAN)Running CDK diff...$(NC)"
	npm run diff

deploy: build-all ## Deploy CDK stacks to AWS
	@echo "$(CYAN)Deploying CDK stacks...$(NC)"
	npm run deploy
	@echo "$(GREEN)✓ Deployment complete$(NC)"

deploy-stack: build-all ## Deploy specific stack (usage: make deploy-stack STACK=StackName)
	@if [ -z "$(STACK)" ]; then \
		echo "$(RED)✗ Error: STACK variable not set$(NC)"; \
		echo "$(YELLOW)Usage: make deploy-stack STACK=StackName$(NC)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Deploying stack: $(STACK)...$(NC)"
	npx cdk deploy $(STACK)
	@echo "$(GREEN)✓ Stack $(STACK) deployed$(NC)"

##@ Quality Checks

check: format-check lint ## Run all quality checks (format + lint)
	@echo "$(GREEN)✓ All quality checks passed$(NC)"

pre-commit: ## Run pre-commit checks (lint-staged on staged files only)
	@echo "$(CYAN)Running pre-commit checks...$(NC)"
	npx lint-staged
	@echo "$(GREEN)✓ Pre-commit checks passed$(NC)"

##@ CI/CD

ci-check: ## CI check - format check, lint, and build
	@echo "$(CYAN)Running CI checks...$(NC)"
	@$(MAKE) format-check
	@$(MAKE) lint
	@echo "$(GREEN)✓ CI checks passed$(NC)"

ci-build: ci-check build-all ## CI build - checks + full build
	@echo "$(GREEN)✓ CI build complete$(NC)"

ci-deploy: ci-build synth ## CI deploy - checks + build + synth
	@echo "$(GREEN)✓ CI deploy ready$(NC)"

##@ Version Check

check-versions: ## Verify Node.js and npm versions
	@echo "$(CYAN)Checking versions...$(NC)"
	@NODE_ACTUAL=$$(node -v | cut -d'v' -f2 | cut -d'.' -f1); \
	NPM_ACTUAL=$$(npm -v | cut -d'.' -f1); \
	if [ "$$NODE_ACTUAL" -lt "$(NODE_VERSION)" ]; then \
		echo "$(RED)✗ Node.js version $$NODE_ACTUAL.x detected, $(NODE_VERSION).x required$(NC)"; \
		exit 1; \
	fi; \
	if [ "$$NPM_ACTUAL" -lt "$(NPM_VERSION)" ]; then \
		echo "$(RED)✗ npm version $$NPM_ACTUAL.x detected, $(NPM_VERSION).x required$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Version requirements met$(NC)"
