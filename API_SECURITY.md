# API Security Best Practices

## Overview

This document outlines security best practices for developing and consuming APIs in the Apex_Nexus cryptocurrency trading platform. APIs are critical attack vectors and must be secured properly.

## Authentication & Authorization

### API Key Management

**Best Practices**:
```
✓ Generate cryptographically secure random API keys (minimum 32 bytes)
✓ Store API keys hashed in the database (never plaintext)
✓ Support API key rotation without service disruption
✓ Allow users to create multiple API keys with different permissions
✓ Implement API key expiration
✓ Provide API key usage visibility to users
```

**Implementation Example**:
```python
import secrets
import bcrypt

def generate_api_key():
    """Generate a secure API key"""
    return secrets.token_urlsafe(32)

def hash_api_key(api_key):
    """Hash API key for storage using bcrypt"""
    return bcrypt.hashpw(api_key.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_api_key(api_key, hashed_key):
    """Verify API key against stored hash"""
    return bcrypt.checkpw(api_key.encode('utf-8'), hashed_key.encode('utf-8'))
```

### OAuth 2.0 / JWT

**Best Practices**:
```
✓ Use short-lived access tokens (15 minutes or less)
✓ Implement refresh token rotation
✓ Use strong signing algorithms (RS256, ES256)
✓ Never put sensitive data in JWT payload
✓ Validate token signature, expiration, issuer, and audience
✓ Implement token revocation
```

**Security Headers**:
```
Authorization: Bearer <token>
```

### Rate Limiting

**Implementation Levels**:
1. **IP-based**: Limit requests per IP address
2. **User-based**: Limit requests per authenticated user
3. **API key-based**: Limit requests per API key
4. **Endpoint-based**: Different limits for different endpoints

**Recommended Limits**:
- Public endpoints: 10-100 requests per minute
- Authenticated endpoints: 100-1000 requests per minute
- Trading endpoints: Higher limits with burst allowance
- Administrative endpoints: Strict limits

**Response Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

## Input Validation

### Request Validation

**Best Practices**:
```
✓ Validate all input parameters (type, format, range, length)
✓ Use whitelist validation (allow known good) over blacklist
✓ Validate Content-Type header
✓ Limit request payload size
✓ Sanitize input before processing
✓ Use schema validation (JSON Schema, OpenAPI)
```

**Example Validation Rules**:
```javascript
const tradeRequestSchema = {
  type: 'object',
  required: ['symbol', 'side', 'quantity', 'price'],
  properties: {
    symbol: { 
      type: 'string', 
      pattern: '^[A-Z]{3,10}$',
      maxLength: 10
    },
    side: { 
      type: 'string', 
      enum: ['buy', 'sell'] 
    },
    quantity: { 
      type: 'number', 
      minimum: 0.00000001,
      maximum: 1000000 
    },
    price: { 
      type: 'number', 
      minimum: 0.00000001 
    }
  },
  additionalProperties: false
};
```

### SQL Injection Prevention

**Best Practices**:
```
✓ Use parameterized queries or prepared statements ONLY
✓ Never build SQL with string concatenation
✓ Use ORM frameworks with SQL injection protection
✓ Escape user input if dynamic SQL is absolutely necessary
✓ Apply principle of least privilege to database accounts
```

**Safe Example** (Node.js):
```javascript
// GOOD: Parameterized query
db.query(
  'SELECT * FROM users WHERE email = ?',
  [userEmail],
  callback
);

// BAD: String concatenation
db.query(
  `SELECT * FROM users WHERE email = '${userEmail}'`,
  callback
);
```

### XSS Prevention

**Best Practices**:
```
✓ Sanitize all user-generated content
✓ Use Content Security Policy (CSP) headers
✓ Encode output based on context
✓ Use frameworks with automatic XSS protection
✓ Validate and sanitize rich text content
✓ Use HTTPOnly and Secure flags on cookies
```

**CSP Header Example**:
```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'nonce-{random}'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

## Data Protection

### Encryption in Transit

**Best Practices**:
```
✓ Enforce HTTPS/TLS 1.3 or TLS 1.2 minimum
✓ Use HSTS (HTTP Strict Transport Security)
✓ Disable insecure protocols (SSLv3, TLS 1.0, TLS 1.1)
✓ Use strong cipher suites
✓ Implement certificate pinning for mobile apps
✓ Validate SSL certificates
```

**Security Headers**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Encryption at Rest

**Best Practices**:
```
✓ Encrypt sensitive data in database (API keys, private keys)
✓ Use strong encryption algorithms (AES-256)
✓ Separate encryption keys from encrypted data
✓ Implement key rotation procedures
✓ Use hardware security modules (HSM) for key storage
```

### Sensitive Data in Responses

**Best Practices**:
```
✓ Never return sensitive data unnecessarily
✓ Mask sensitive information (show last 4 digits only)
✓ Filter response fields based on user permissions
✓ Avoid returning full objects when partial data is sufficient
✓ Implement field-level encryption for highly sensitive data
```

**Example**:
```json
{
  "apiKey": "****************************abcd",
  "balance": {
    "currency": "BTC",
    "amount": "1.23456789"
  }
}
```

## Error Handling

### Secure Error Responses

**Best Practices**:
```
✓ Never expose internal errors to clients
✓ Use generic error messages for security issues
✓ Log detailed errors server-side only
✓ Use appropriate HTTP status codes
✓ Avoid stack traces in production
✓ Implement consistent error response format
```

**Error Response Format**:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "timestamp": "2025-12-20T15:23:45Z",
    "requestId": "abc123"
  }
}
```

**What NOT to expose**:
- Database error details
- Stack traces
- Internal file paths
- Software versions
- Server configuration details
- SQL queries

## CORS Configuration

### Cross-Origin Resource Sharing

**Best Practices**:
```
✓ Explicitly whitelist allowed origins (avoid *)
✓ Restrict allowed methods to necessary ones only
✓ Limit allowed headers
✓ Set appropriate max age for preflight cache
✓ Be cautious with credentials (cookies)
```

**Example Configuration**:
```javascript
const corsOptions = {
  origin: [
    'https://app.apexnexus.com',
    'https://mobile.apexnexus.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400
};
```

## API Versioning

### Version Management

**Best Practices**:
```
✓ Use explicit API versioning (v1, v2, etc.)
✓ Support multiple versions simultaneously
✓ Provide migration guides between versions
✓ Announce deprecation well in advance (6-12 months)
✓ Backport critical security fixes to old versions
✓ Never break backward compatibility in same version
```

**URL-based Versioning**:
```
https://api.apexnexus.com/v1/trades
https://api.apexnexus.com/v2/trades
```

**Header-based Versioning**:
```
Accept: application/vnd.apexnexus.v1+json
```

## Security Headers

### Required HTTP Headers

**Implementation**:
```
# Prevent XSS attacks
X-XSS-Protection: 1; mode=block

# Prevent MIME sniffing
X-Content-Type-Options: nosniff

# Control framing (prevent clickjacking)
X-Frame-Options: DENY

# HSTS for HTTPS enforcement
Strict-Transport-Security: max-age=31536000; includeSubDomains

# Referrer policy
Referrer-Policy: strict-origin-when-cross-origin

# Permissions policy
Permissions-Policy: geolocation=(), microphone=(), camera=()

# Content Security Policy
Content-Security-Policy: default-src 'self'
```

## WebSocket Security

### Secure WebSocket Connections

**Best Practices**:
```
✓ Use WSS (secure WebSocket) only
✓ Implement authentication on connection
✓ Validate origin header
✓ Implement rate limiting for messages
✓ Use heartbeat/ping-pong to detect dead connections
✓ Implement message size limits
✓ Close inactive connections
```

**Connection Example**:
```javascript
const ws = new WebSocket('wss://api.apexnexus.com/stream');
ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-auth-token'
  }));
};
```

## API Documentation Security

### OpenAPI/Swagger

**Best Practices**:
```
✓ Don't expose API documentation publicly in production
✓ Require authentication to access documentation
✓ Redact sensitive information from examples
✓ Don't include actual API keys in documentation
✓ Document security requirements clearly
✓ Include rate limiting information
```

## Monitoring & Logging

### API Activity Logging

**What to Log**:
```
✓ Authentication attempts (success and failure)
✓ API key usage
✓ Rate limit violations
✓ Invalid requests
✓ High-value transactions
✓ Administrative actions
✓ Errors and exceptions
```

**What NOT to Log**:
```
✗ Passwords or API keys
✗ Credit card numbers
✗ Private keys
✗ Authentication tokens
✗ Sensitive personal data
```

**Log Format Example**:
```json
{
  "timestamp": "2025-12-20T15:23:45Z",
  "requestId": "abc123",
  "method": "POST",
  "endpoint": "/v1/trades",
  "userId": "user123",
  "ip": "192.168.1.1",
  "userAgent": "ApexNexus-Client/1.0",
  "statusCode": 201,
  "responseTime": 45
}
```

### Anomaly Detection

**Monitor For**:
- Unusual traffic patterns
- Multiple failed authentication attempts
- API abuse or scraping
- Unusual transaction patterns
- Geographic anomalies
- Velocity checks (too many requests too quickly)

## Testing

### Security Testing

**Test Types**:
1. **Authentication Testing**: Test auth bypass, weak passwords, session management
2. **Authorization Testing**: Test privilege escalation, IDOR
3. **Input Validation Testing**: Test injection attacks, boundary values
4. **Rate Limiting Testing**: Verify limits are enforced
5. **Error Handling Testing**: Ensure no sensitive data leaked

**Automated Tools**:
- OWASP ZAP
- Burp Suite
- Postman security tests
- Custom security test scripts

## Incident Response

### API Security Incidents

**Response Steps**:
1. **Detect**: Identify the security incident
2. **Contain**: Rate limit, block IPs, revoke compromised keys
3. **Investigate**: Analyze logs, determine scope
4. **Remediate**: Fix vulnerabilities, patch systems
5. **Recover**: Restore normal operations
6. **Learn**: Post-mortem, update procedures

**Example Actions**:
- Revoke compromised API keys
- Block malicious IP addresses
- Temporarily disable vulnerable endpoints
- Force password resets if needed
- Notify affected users

## Checklist for New API Endpoints

- [ ] Authentication required and implemented
- [ ] Authorization checks in place
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Error handling doesn't leak sensitive info
- [ ] HTTPS/TLS enforced
- [ ] Logging implemented
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Integration tests written
- [ ] Security tests written
- [ ] Penetration testing performed

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Next Review**: March 2026
