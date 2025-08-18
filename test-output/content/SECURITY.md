# Security Policy

## Supported Versions

Tafy Studio is currently in early development. Security updates will be provided for:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email [security@tafy.studio](mailto:security@tafy.studio) with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

### What to Expect

- **Acknowledgment**: We'll acknowledge receipt within 48 hours
- **Initial Assessment**: Within 5 business days
- **Resolution Timeline**: Varies by severity, typically 30-90 days
- **Disclosure**: Coordinated disclosure after fix is available

## Security Best Practices

When deploying Tafy Studio:

### Network Security

- Run in isolated networks when possible
- Use TLS for all external communications
- Configure firewall rules for required ports only:
  - 80/443 (Web UI)
  - 4222 (NATS)
  - 6443 (k3s API, internal only)

### Authentication

- Enable OIDC authentication in production
- Use strong passwords for local accounts
- Rotate device credentials regularly

### Device Security

- Flash devices over secure connections
- Use device-specific credentials (NKey/JWT)
- Enable TLS for ESP32 ↔ NATS communication

### Data Protection

- Enable encryption at rest for persistent volumes
- Use sealed secrets for sensitive configuration
- Limit telemetry retention (24-72 hours default)

## Known Security Considerations

### Development Dependencies

- `ecdsa` package: Known vulnerability GHSA-wj6h-64fc-37mp in development dependencies only
  - Not used in production code
  - Ignored in security scans with `--ignore-vuln GHSA-wj6h-64fc-37mp`

### Third-Party Components

We regularly update dependencies and monitor for vulnerabilities in:

- Node.js packages (via `pnpm audit`)
- Python packages (via `pip-audit`)
- Go modules (via `govulncheck`)
- Docker base images

## Security Features Roadmap

### Available Now

- OIDC authentication support
- TLS encryption for NATS
- Container image signing with cosign
- Basic RBAC with viewer/operator/admin roles

### Planned (Post-MVP)

- mTLS with Linkerd service mesh
- Network policies with Cilium
- Hardware security module (HSM) support
- Audit logging
- Workspace isolation improvements

## Compliance

Tafy Studio is designed with security in mind but has not yet undergone formal security audits.

For regulated environments, please contact us to discuss specific compliance requirements.

## Contact

- Security issues: [security@tafy.studio](mailto:security@tafy.studio)
- General questions: GitHub Discussions
- Commercial support: Available for enterprise deployments
