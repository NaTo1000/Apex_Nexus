# Secure Development Guide

## Overview

This guide provides secure development practices for contributors to Apex_Nexus. Following these guidelines helps prevent security vulnerabilities and ensures the platform remains secure.

## Secure Coding Principles

### 1. Defense in Depth

Implement multiple layers of security controls:
- Input validation at client and server
- Authentication and authorization at multiple levels
- Encryption in transit and at rest
- Network segmentation
- Monitoring and logging

### 2. Principle of Least Privilege

- Grant minimum necessary permissions
- Use role-based access control (RBAC)
- Regularly review and audit permissions
- Implement just-in-time access for sensitive operations

### 3. Fail Securely

- Default to deny access
- Handle errors gracefully without exposing details
- Validate inputs before processing
- Use secure defaults
- Log security failures

### 4. Never Trust User Input

- Validate all input (type, length, format, range)
- Sanitize data before use
- Use parameterized queries
- Encode output appropriately
- Implement CSRF protection

### 5. Security by Design

- Consider security from the beginning
- Perform threat modeling
- Design with security in mind
- Regular security reviews
- Keep it simple (complexity is the enemy of security)

## Common Vulnerabilities and Prevention

### 1. Injection Attacks

#### SQL Injection

**Vulnerable Code**:
```python
# DON'T DO THIS
query = f"SELECT * FROM users WHERE username = '{username}'"
```

**Secure Code**:
```python
# DO THIS - Use parameterized queries
query = "SELECT * FROM users WHERE username = ?"
cursor.execute(query, (username,))
```

#### Command Injection

**Vulnerable Code**:
```python
# DON'T DO THIS
os.system(f"ping {user_input}")
```

**Secure Code**:
```python
# DO THIS - Validate and use safe functions
import subprocess
import shlex

# Whitelist validation
if not re.match(r'^[a-zA-Z0-9.-]+$', user_input):
    raise ValueError("Invalid input")

# Use subprocess with list
subprocess.run(['ping', '-c', '1', user_input])
```

### 2. Cross-Site Scripting (XSS)

**Vulnerable Code**:
```javascript
// DON'T DO THIS
element.innerHTML = userInput;
```

**Secure Code**:
```javascript
// DO THIS - Use textContent or sanitize
element.textContent = userInput;

// OR use a sanitization library
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### 3. Insecure Authentication

**Vulnerable Code**:
```python
# DON'T DO THIS - Plain text password
if user.password == input_password:
    login_user()
```

**Secure Code**:
```python
# DO THIS - Use proper hashing
import bcrypt

# Hashing password
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

# Verifying password
if bcrypt.checkpw(input_password.encode('utf-8'), user.password_hash):
    login_user()
```

### 4. Insecure Cryptography

**Vulnerable Code**:
```python
# DON'T DO THIS - Weak algorithms
from Crypto.Cipher import DES
cipher = DES.new(key)
```

**Secure Code**:
```python
# DO THIS - Use strong algorithms
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# AES-256-GCM
key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)
ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)
```

### 5. Broken Access Control

**Vulnerable Code**:
```javascript
// DON'T DO THIS - No authorization check
app.get('/api/user/:id/balance', async (req, res) => {
  const balance = await getBalance(req.params.id);
  res.json(balance);
});
```

**Secure Code**:
```javascript
// DO THIS - Verify authorization
app.get('/api/user/:id/balance', authenticate, async (req, res) => {
  // Check if user is accessing their own data or is admin
  if (req.user.id !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const balance = await getBalance(req.params.id);
  res.json(balance);
});
```

### 6. Security Misconfiguration

**Common Issues**:
- Default credentials
- Unnecessary features enabled
- Error messages exposing system details
- Missing security headers
- Outdated software versions

**Prevention**:
```javascript
// Configure security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Disable server version exposure
app.disable('x-powered-by');
```

### 7. Sensitive Data Exposure

**Best Practices**:
```javascript
// DO NOT log sensitive data
// BAD
console.log(`User ${username} logged in with password ${password}`);

// GOOD
console.log(`User ${username} logged in successfully`);

// DO NOT return sensitive data
// BAD
res.json({ user: { id, email, password_hash, api_key } });

// GOOD
res.json({ user: { id, email } });
```

### 8. Insecure Deserialization

**Vulnerable Code**:
```python
# DON'T DO THIS
import pickle
data = pickle.loads(user_input)
```

**Secure Code**:
```python
# DO THIS - Use safe formats like JSON
import json
data = json.loads(user_input)

# Or validate before deserializing
import yaml
data = yaml.safe_load(user_input)
```

### 9. Using Components with Known Vulnerabilities

**Prevention**:
```bash
# Regularly audit dependencies
npm audit
pip check

# Use dependency scanning in CI/CD
npm audit --audit-level=moderate

# Keep dependencies updated
npm update
pip install --upgrade -r requirements.txt
```

### 10. Insufficient Logging & Monitoring

**Good Logging Practices**:
```javascript
// Log security events
logger.info('User login attempt', {
  userId: user.id,
  ip: req.ip,
  userAgent: req.get('user-agent'),
  timestamp: new Date().toISOString(),
  success: true
});

// Log security failures
logger.warn('Failed login attempt', {
  username: username,
  ip: req.ip,
  timestamp: new Date().toISOString(),
  reason: 'invalid_credentials'
});

// Never log sensitive data
// DON'T log passwords, API keys, tokens, etc.
```

## Cryptography Guidelines

### Random Number Generation

**Insecure**:
```javascript
// DON'T DO THIS
Math.random();
```

**Secure**:
```javascript
// DO THIS
const crypto = require('crypto');
const randomBytes = crypto.randomBytes(32);
const randomInt = crypto.randomInt(0, 100);
```

### Password Hashing

**Recommended Algorithms**:
1. **Argon2** (best choice)
2. **bcrypt** (good choice)
3. **scrypt** (good choice)
4. **PBKDF2** (acceptable)

**Never Use**:
- MD5
- SHA1
- SHA256 without salt and iterations

**Example (bcrypt)**:
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;

// Hash password
const hash = await bcrypt.hash(password, saltRounds);

// Verify password
const match = await bcrypt.compare(password, hash);
```

### Encryption

**Best Practices**:
- Use AES-256-GCM for symmetric encryption
- Use RSA-4096 or ECC (P-256) for asymmetric encryption
- Use authenticated encryption (AEAD)
- Generate unique IVs/nonces for each encryption
- Use secure key derivation (PBKDF2, bcrypt, scrypt)

**Example (AES-GCM)**:
```javascript
const crypto = require('crypto');

function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}
```

## API Security Best Practices

### Authentication

```javascript
// Always require authentication for sensitive endpoints
app.post('/api/trade', authenticate, authorize('trader'), async (req, res) => {
  // Trade logic
});

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Input Validation

```javascript
const Joi = require('joi');

const tradeSchema = Joi.object({
  symbol: Joi.string().pattern(/^[A-Z]{3,10}$/).required(),
  side: Joi.string().valid('buy', 'sell').required(),
  quantity: Joi.number().positive().precision(8).required(),
  price: Joi.number().positive().precision(8).required()
});

app.post('/api/trade', async (req, res) => {
  const { error, value } = tradeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  // Process trade
});
```

## Secrets Management

### Environment Variables

**DO**:
```javascript
// Load from environment
const apiKey = process.env.API_KEY;
const dbPassword = process.env.DB_PASSWORD;

// Use .env files (not committed to git)
require('dotenv').config();
```

**DON'T**:
```javascript
// Never hardcode secrets
const apiKey = 'sk_live_abc123'; // ❌ NEVER DO THIS
```

### .gitignore

Always include in `.gitignore`:
```
# Secrets
.env
.env.local
.env.*.local
*.key
*.pem
secrets/

# Credentials
credentials.json
config/production.json
```

## Database Security

### Query Safety

**Always use parameterized queries**:

```javascript
// PostgreSQL with node-postgres
const query = 'SELECT * FROM users WHERE email = $1';
const values = [email];
const result = await client.query(query, values);

// MongoDB
const user = await User.findOne({ email: email });
```

### Connection Security

```javascript
// Use SSL/TLS for database connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-cert.pem').toString()
  }
});
```

## Testing Security

### Security Test Checklist

- [ ] Authentication tests (valid/invalid credentials)
- [ ] Authorization tests (privilege escalation)
- [ ] Input validation tests (boundary values, injection)
- [ ] Session management tests
- [ ] CSRF protection tests
- [ ] XSS prevention tests
- [ ] Rate limiting tests
- [ ] Error handling tests (no sensitive data leaked)

### Example Security Test

```javascript
describe('Authentication Security', () => {
  it('should reject requests without authentication', async () => {
    const response = await request(app)
      .get('/api/user/balance')
      .expect(401);
  });

  it('should prevent SQL injection in login', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ 
        username: "admin' OR '1'='1", 
        password: 'anything' 
      })
      .expect(401);
  });

  it('should rate limit login attempts', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/login').send({ 
        username: 'test', 
        password: 'wrong' 
      });
    }
    
    const response = await request(app)
      .post('/api/login')
      .send({ username: 'test', password: 'wrong' })
      .expect(429); // Too Many Requests
  });
});
```

## Code Review Security Checklist

When reviewing code, check for:

- [ ] No hardcoded secrets or credentials
- [ ] Proper input validation
- [ ] Parameterized database queries
- [ ] Secure password hashing
- [ ] Proper authentication and authorization
- [ ] HTTPS/TLS enforcement
- [ ] Secure session management
- [ ] No sensitive data in logs
- [ ] Error messages don't expose system details
- [ ] Rate limiting on sensitive endpoints
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] Up-to-date dependencies
- [ ] Secure cryptographic practices

## Resources

### Security Tools

- **OWASP ZAP**: Web application security scanner
- **Snyk**: Dependency vulnerability scanner
- **npm audit**: Node.js dependency auditing
- **Bandit**: Python security linter
- **ESLint security plugins**: JavaScript security rules

### Learning Resources

- OWASP Top 10
- OWASP Cheat Sheet Series
- CWE Top 25
- NIST Cybersecurity Framework
- SANS Security Resources

### Reporting Security Issues

If you discover a security vulnerability:
1. **Do NOT** open a public issue
2. Email the maintainers privately
3. Provide detailed information
4. Allow time for remediation

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Next Review**: March 2026
