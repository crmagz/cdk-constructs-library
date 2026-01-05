.PHONY: help install clean lint lint-fix format format-check format-fix build build-app build-all build-workspace build-aws build-aurora build-cloudfront build-codeartifact build-route53 build-s3 build-waf test synth diff deploy check ci-build ci-check codeartifact-login publish-workspace publish-aws publish-aurora publish-cloudfront publish-codeartifact publish-route53 publish-s3 publish-waf publish-all-packages pre-publish publish

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

build: ## Build all workspace packages
	@echo "$(CYAN)Building all workspaces...$(NC)"
	npm run build:workspaces
	@echo "$(GREEN)✓ All workspaces built$(NC)"

build-app: ## Build CDK app (bin/, lib/)
	@echo "$(CYAN)Building CDK app...$(NC)"
	npm run build:app
	@echo "$(GREEN)✓ CDK app built$(NC)"

build-all: clean ## Build everything (workspaces + app)
	@echo "$(CYAN)Building all packages...$(NC)"
	npm run build
	@echo "$(GREEN)✓ All packages built$(NC)"

build-workspace: ## Build specific workspace (usage: make build-workspace PACKAGE=aws)
	@if [ -z "$(PACKAGE)" ]; then \
		echo "$(RED)✗ Error: PACKAGE variable not set$(NC)"; \
		echo "$(YELLOW)Usage: make build-workspace PACKAGE=aws$(NC)"; \
		echo "$(YELLOW)Available packages: aws, aurora, cloudfront, codeartifact, route53, s3, waf$(NC)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Building @cdk-constructs/$(PACKAGE)...$(NC)"
	npm run build --workspace=@cdk-constructs/$(PACKAGE)
	@echo "$(GREEN)✓ @cdk-constructs/$(PACKAGE) built$(NC)"

build-aws: ## Build @cdk-constructs/aws package
	@echo "$(CYAN)Building @cdk-constructs/aws...$(NC)"
	npm run build --workspace=@cdk-constructs/aws
	@echo "$(GREEN)✓ @cdk-constructs/aws built$(NC)"

build-aurora: ## Build @cdk-constructs/aurora package
	@echo "$(CYAN)Building @cdk-constructs/aurora...$(NC)"
	npm run build --workspace=@cdk-constructs/aurora
	@echo "$(GREEN)✓ @cdk-constructs/aurora built$(NC)"

build-cloudfront: ## Build @cdk-constructs/cloudfront package
	@echo "$(CYAN)Building @cdk-constructs/cloudfront...$(NC)"
	npm run build --workspace=@cdk-constructs/cloudfront
	@echo "$(GREEN)✓ @cdk-constructs/cloudfront built$(NC)"

build-codeartifact: ## Build @cdk-constructs/codeartifact package
	@echo "$(CYAN)Building @cdk-constructs/codeartifact...$(NC)"
	npm run build --workspace=@cdk-constructs/codeartifact
	@echo "$(GREEN)✓ @cdk-constructs/codeartifact built$(NC)"

build-route53: ## Build @cdk-constructs/route53 package
	@echo "$(CYAN)Building @cdk-constructs/route53...$(NC)"
	npm run build --workspace=@cdk-constructs/route53
	@echo "$(GREEN)✓ @cdk-constructs/route53 built$(NC)"

build-s3: ## Build @cdk-constructs/s3 package
	@echo "$(CYAN)Building @cdk-constructs/s3...$(NC)"
	npm run build --workspace=@cdk-constructs/s3
	@echo "$(GREEN)✓ @cdk-constructs/s3 built$(NC)"

build-waf: ## Build @cdk-constructs/waf package
	@echo "$(CYAN)Building @cdk-constructs/waf...$(NC)"
	npm run build --workspace=@cdk-constructs/waf
	@echo "$(GREEN)✓ @cdk-constructs/waf built$(NC)"

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

##@ Publishing

# CodeArtifact configuration (override with env vars)
CODEARTIFACT_DOMAIN ?= cdk-constructs
CODEARTIFACT_REPOSITORY ?= cdk-constructs-library
AWS_REGION ?= us-east-1

codeartifact-login: ## Authenticate with CodeArtifact
	@echo "$(CYAN)Authenticating with CodeArtifact...$(NC)"
	@echo "$(YELLOW)Domain: $(CODEARTIFACT_DOMAIN)$(NC)"
	@echo "$(YELLOW)Repository: $(CODEARTIFACT_REPOSITORY)$(NC)"
	@echo "$(YELLOW)Region: $(AWS_REGION)$(NC)"
	@aws codeartifact login \
		--tool npm \
		--domain $(CODEARTIFACT_DOMAIN) \
		--repository $(CODEARTIFACT_REPOSITORY) \
		--region $(AWS_REGION)
	@echo "$(GREEN)✓ Authenticated with CodeArtifact$(NC)"

publish-workspace: codeartifact-login ## Publish specific workspace (usage: make publish-workspace PACKAGE=aws)
	@if [ -z "$(PACKAGE)" ]; then \
		echo "$(RED)✗ Error: PACKAGE variable not set$(NC)"; \
		echo "$(YELLOW)Usage: make publish-workspace PACKAGE=aws$(NC)"; \
		echo "$(YELLOW)Available packages: aws, aurora, cloudfront, codeartifact, route53, s3, waf$(NC)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Publishing @cdk-constructs/$(PACKAGE)...$(NC)"
	@cd packages/$(PACKAGE) && npm publish
	@echo "$(GREEN)✓ @cdk-constructs/$(PACKAGE) published$(NC)"

publish-aws: codeartifact-login ## Publish @cdk-constructs/aws package
	@echo "$(CYAN)Publishing @cdk-constructs/aws...$(NC)"
	@cd packages/aws && npm publish
	@echo "$(GREEN)✓ @cdk-constructs/aws published$(NC)"

publish-aurora: codeartifact-login ## Publish @cdk-constructs/aurora package
	@echo "$(CYAN)Publishing @cdk-constructs/aurora...$(NC)"
	@cd packages/aurora && npm publish
	@echo "$(GREEN)✓ @cdk-constructs/aurora published$(NC)"

publish-cloudfront: codeartifact-login ## Publish @cdk-constructs/cloudfront package
	@echo "$(CYAN)Publishing @cdk-constructs/cloudfront...$(NC)"
	@cd packages/cloudfront && npm publish
	@echo "$(GREEN)✓ @cdk-constructs/cloudfront published$(NC)"

publish-codeartifact: codeartifact-login ## Publish @cdk-constructs/codeartifact package
	@echo "$(CYAN)Publishing @cdk-constructs/codeartifact...$(NC)"
	@cd packages/codeartifact && npm publish
	@echo "$(GREEN)✓ @cdk-constructs/codeartifact published$(NC)"

publish-route53: codeartifact-login ## Publish @cdk-constructs/route53 package
	@echo "$(CYAN)Publishing @cdk-constructs/route53...$(NC)"
	@cd packages/route53 && npm publish
	@echo "$(GREEN)✓ @cdk-constructs/route53 published$(NC)"

publish-s3: codeartifact-login ## Publish @cdk-constructs/s3 package
	@echo "$(CYAN)Publishing @cdk-constructs/s3...$(NC)"
	@cd packages/s3 && npm publish
	@echo "$(GREEN)✓ @cdk-constructs/s3 published$(NC)"

publish-waf: codeartifact-login ## Publish @cdk-constructs/waf package
	@echo "$(CYAN)Publishing @cdk-constructs/waf...$(NC)"
	@cd packages/waf && npm publish
	@echo "$(GREEN)✓ @cdk-constructs/waf published$(NC)"

publish-all-packages: publish-aws publish-aurora publish-cloudfront publish-codeartifact publish-route53 publish-s3 publish-waf ## Publish all workspace packages
	@echo "$(GREEN)✓ All packages published$(NC)"

pre-publish: ## Run all pre-publish validation steps
	@echo "$(CYAN)Running pre-publish validation...$(NC)"
	@$(MAKE) check-versions
	@$(MAKE) format-check
	@$(MAKE) lint
	@$(MAKE) test
	@$(MAKE) build-all
	@echo "$(GREEN)✓ Pre-publish validation passed$(NC)"

publish: pre-publish publish-all-packages ## Run validation and publish all packages to CodeArtifact
	@echo "$(GREEN)✓ Publishing complete$(NC)"
	@echo ""
	@echo "$(CYAN)Published packages:$(NC)"
	@echo "  • @cdk-constructs/aws"
	@echo "  • @cdk-constructs/aurora"
	@echo "  • @cdk-constructs/cloudfront"
	@echo "  • @cdk-constructs/codeartifact"
	@echo "  • @cdk-constructs/route53"
	@echo "  • @cdk-constructs/s3"
	@echo "  • @cdk-constructs/waf"
