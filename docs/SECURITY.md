# Security Policy

## Supported Versions

Currently, Tafy Studio is in early development. Security updates will be applied to the main branch.

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Reporting a Vulnerability

Please report security vulnerabilities to security@tafy.studio. We will respond within 48 hours.

## Known Vulnerabilities

### ecdsa (GHSA-wj6h-64fc-37mp)

**Status**: Acknowledged, no fix available  
**Severity**: Low  
**Component**: python-jose dependency (transitive via ecdsa)  

**Description**: The ecdsa library has a known vulnerability (GHSA-wj6h-64fc-37mp) that affects the python-jose library we use for JWT authentication. This is a transitive dependency that we cannot directly control.

**Mitigation**: 
- We have configured our security scanning (pip-audit) to ignore this specific vulnerability
- The vulnerability's impact is limited in our use case as JWT tokens are used only for internal service authentication
- We monitor for updates to python-jose that might address this issue

**Alternative**: Consider migrating to PyJWT if the vulnerability becomes critical or remains unfixed.

## Security Measures

### Container Signing
All container images are signed using cosign with keyless signing via Sigstore.

### Dependency Scanning
- Automated dependency scanning via GitHub Dependabot
- pip-audit for Python dependencies
- npm audit for JavaScript dependencies
- Trivy for container scanning

### Network Security
- All services communicate over TLS when deployed
- mTLS for service-to-service communication (planned)
- No external dependencies required for core functionality