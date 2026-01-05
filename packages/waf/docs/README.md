# @cdk-constructs/waf Documentation

Welcome to the WAF package documentation. This package provides production-ready AWS WAF WebACL constructs with built-in security best practices.

## Documentation Sections

- [Getting Started](getting-started.md) - Quick start guide and basic usage
- [Configuration Reference](configuration-reference.md) - Complete configuration options
- [Best Practices](best-practices.md) - Security, monitoring, and operational guidance
- [Examples](examples.md) - Real-world usage examples

## Quick Links

- [Package README](../README.md) - Package overview and installation
- [AWS WAF Documentation](https://docs.aws.amazon.com/waf/latest/developerguide/)
- [AWS Managed Rules](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)

## Package Features

### Security Features

- **Geo-Blocking**: Country-based traffic filtering (default: US-only)
- **AWS Managed Rules**: 8 pre-configured rule groups for comprehensive protection
- **Custom Path Rules**: Flexible regex-based URL blocking/allowing
- **IP Allowlisting**: Optional IP Set integration for trusted sources
- **Bot Protection**: Protection against common bot source countries

### Operational Features

- **CloudWatch Integration**: Built-in logging and metrics for all rules
- **Dual Scope Support**: REGIONAL and CLOUDFRONT WebACLs
- **Action Modes**: COUNT (testing) and BLOCK (production) modes
- **Type Safety**: Full TypeScript support with comprehensive types

## Support

For issues, questions, or contributions, please refer to the main repository documentation.
