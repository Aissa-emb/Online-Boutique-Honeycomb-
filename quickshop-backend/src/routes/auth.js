const express = require('express');
const router = express.Router();
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('online-boutique-auth');

// POST /auth/login
router.post('/login', async (req, res) => {
    return tracer.startActiveSpan('auth.login', async (rootSpan) => {
        try {
            const { username, password } = req.body;
            rootSpan.setAttribute('user.username', username || 'unknown');

            // 1. Rate limit check
            await tracer.startActiveSpan('auth.rate_limit_check', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': `rate_limit:login:${username}`,
                    'rate_limit.window_seconds': 300,
                    'rate_limit.max_attempts': 5,
                });

                // 1% chance of rate limit hit
                const isRateLimited = Math.random() < 0.01;
                if (isRateLimited) {
                    span.setAttribute('rate_limit.remaining', 0);
                    span.setAttribute('rate_limit.exceeded', true);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Rate limit exceeded' });
                    span.end();
                    throw { kind: 'RATE_LIMIT', message: 'Too many login attempts. Please try again in 5 minutes.' };
                }

                span.setAttribute('rate_limit.remaining', 4);
                span.setAttribute('rate_limit.exceeded', false);
                await new Promise(r => setTimeout(r, 3));
                span.end();
            });

            // 2. Verify credentials against database
            await tracer.startActiveSpan('auth.verify_credentials', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.name': 'online-boutique_prod',
                    'db.statement': 'SELECT id, username, password_hash, failed_attempts, locked_until FROM users WHERE username = $1',
                    'db.operation': 'SELECT',
                    'db.sql.table': 'users',
                });
                await new Promise(r => setTimeout(r, 30 + Math.random() * 25));
                span.setAttribute('db.rows_affected', 1);
                span.end();
            });

            // 3. Verify password hash
            await tracer.startActiveSpan('auth.verify_password', async (span) => {
                span.setAttributes({
                    'crypto.algorithm': 'bcrypt',
                    'crypto.rounds': 12,
                });
                await new Promise(r => setTimeout(r, 80 + Math.random() * 40));
                span.end();
            });

            // 4. Suspicious login detection (geo-IP check)
            await tracer.startActiveSpan('auth.suspicious_login_check', async (span) => {
                span.setAttributes({
                    'http.method': 'GET',
                    'http.url': 'https://api.ipgeolocation.io/ipgeo',
                    'security.check_type': 'geo_ip',
                    'security.ip_address': req.ip || '203.0.113.42',
                    'security.country': 'US',
                    'security.is_vpn': false,
                });
                await new Promise(r => setTimeout(r, 15 + Math.random() * 10));
                span.setAttribute('http.status_code', 200);
                span.setAttribute('security.risk_score', Math.round(Math.random() * 30));
                span.setAttribute('security.action', 'allow');
                span.end();
            });

            // 5. Generate JWT token
            let token;
            await tracer.startActiveSpan('auth.generate_token', async (span) => {
                span.setAttributes({
                    'crypto.algorithm': 'RS256',
                    'auth.token_type': 'access',
                    'auth.token_ttl_seconds': 3600,
                });
                token = `eyJ${Buffer.from(JSON.stringify({ sub: username, iat: Date.now() })).toString('base64').slice(0, 20)}`;
                await new Promise(r => setTimeout(r, 5 + Math.random() * 3));
                span.end();
            });

            // 6. Create session in Redis
            await tracer.startActiveSpan('auth.create_session', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': `session:${username}`,
                    'cache.operation': 'SETEX',
                    'cache.ttl_seconds': 3600,
                    'net.peer.name': 'redis-primary.internal',
                });
                await new Promise(r => setTimeout(r, 5 + Math.random() * 4));
                span.end();
            });

            // 7. Record login event
            await tracer.startActiveSpan('auth.record_login_event', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'INSERT INTO login_events (user_id, ip_address, user_agent, timestamp) VALUES ($1, $2, $3, NOW())',
                    'db.operation': 'INSERT',
                    'db.sql.table': 'login_events',
                });
                await new Promise(r => setTimeout(r, 6 + Math.random() * 4));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();

            res.json({
                token,
                expiresIn: 3600,
                user: { username, id: `usr_${Date.now().toString(36)}` },
            });

        } catch (error) {
            rootSpan.recordException(error.error || error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();

            if (error.kind === 'RATE_LIMIT') {
                return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED', message: error.message });
            }
            res.status(401).json({ error: 'AUTHENTICATION_FAILED', message: 'Invalid credentials' });
        }
    });
});

// POST /auth/register
router.post('/register', async (req, res) => {
    return tracer.startActiveSpan('auth.register', async (rootSpan) => {
        const { username, email, password } = req.body;
        rootSpan.setAttributes({
            'user.username': username || 'unknown',
            'user.email_domain': (email || '').split('@')[1] || 'unknown',
        });

        try {
            // 1. Check if user exists
            await tracer.startActiveSpan('auth.check_existing_user', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'SELECT id FROM users WHERE username = $1 OR email = $2',
                    'db.operation': 'SELECT',
                    'db.sql.table': 'users',
                });
                await new Promise(r => setTimeout(r, 10 + Math.random() * 8));
                span.setAttribute('db.rows_affected', 0);
                span.end();
            });

            // 2. Hash password
            await tracer.startActiveSpan('auth.hash_password', async (span) => {
                span.setAttributes({
                    'crypto.algorithm': 'bcrypt',
                    'crypto.rounds': 12,
                });
                await new Promise(r => setTimeout(r, 120 + Math.random() * 50));
                span.end();
            });

            // 3. Create user record
            await tracer.startActiveSpan('db.insert_user', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'INSERT INTO users (username, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
                    'db.operation': 'INSERT',
                    'db.sql.table': 'users',
                });
                await new Promise(r => setTimeout(r, 15 + Math.random() * 10));
                span.setAttribute('db.rows_affected', 1);
                span.end();
            });

            // 4. Send welcome email
            await tracer.startActiveSpan('notifications.send_welcome_email', async (span) => {
                span.setAttributes({
                    'email.provider': 'sendgrid',
                    'email.template': 'welcome',
                    'http.method': 'POST',
                    'http.url': 'https://api.sendgrid.com/v3/mail/send',
                });
                await new Promise(r => setTimeout(r, 50 + Math.random() * 30));
                span.setAttribute('http.status_code', 202);
                span.end();
            });

            // 5. Publish user created event
            await tracer.startActiveSpan('event_bus.publish', async (span) => {
                span.setAttributes({
                    'messaging.system': 'kafka',
                    'messaging.destination': 'users.created',
                    'messaging.operation': 'publish',
                });
                await new Promise(r => setTimeout(r, 5));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();

            res.status(201).json({
                success: true,
                user: { username, id: `usr_${Date.now().toString(36)}` },
                message: 'Account created successfully',
            });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Registration failed' });
        }
    });
});

// POST /auth/refresh-token
router.post('/refresh-token', async (req, res) => {
    return tracer.startActiveSpan('auth.refresh_token', async (rootSpan) => {
        const { refreshToken } = req.body;
        rootSpan.setAttribute('auth.token_type', 'refresh');

        try {
            // 1. Validate refresh token
            await tracer.startActiveSpan('auth.validate_refresh_token', async (span) => {
                span.setAttributes({
                    'crypto.algorithm': 'RS256',
                    'auth.token_type': 'refresh',
                });
                await new Promise(r => setTimeout(r, 8 + Math.random() * 5));
                span.end();
            });

            // 2. Check if token is revoked
            await tracer.startActiveSpan('cache.check_revoked', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': `revoked_tokens:${(refreshToken || '').slice(0, 10)}`,
                    'cache.hit': false,
                });
                await new Promise(r => setTimeout(r, 3));
                span.end();
            });

            // 3. Generate new access token
            await tracer.startActiveSpan('auth.generate_token', async (span) => {
                span.setAttributes({
                    'crypto.algorithm': 'RS256',
                    'auth.token_type': 'access',
                    'auth.token_ttl_seconds': 3600,
                });
                await new Promise(r => setTimeout(r, 4));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();

            res.json({
                token: `eyJ${Buffer.from(JSON.stringify({ sub: 'user', iat: Date.now() })).toString('base64').slice(0, 20)}`,
                expiresIn: 3600,
            });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(401).json({ error: 'Invalid refresh token' });
        }
    });
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
    return tracer.startActiveSpan('auth.logout', async (rootSpan) => {
        const { token } = req.body;
        rootSpan.setAttribute('auth.token_id', token ? token.substring(0, 10) : 'unknown');

        try {
            // 1. Invalidate session
            await tracer.startActiveSpan('auth.invalidate_session', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': 'session:user',
                    'cache.operation': 'DEL',
                });
                await new Promise(r => setTimeout(r, 4 + Math.random() * 3));
                span.end();
            });

            // 2. Add token to revocation list
            await tracer.startActiveSpan('auth.revoke_token', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': `revoked_tokens:${(token || '').slice(0, 10)}`,
                    'cache.operation': 'SETEX',
                    'cache.ttl_seconds': 3600,
                });
                await new Promise(r => setTimeout(r, 3));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();

            res.json({ success: true });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Logout failed' });
        }
    });
});

module.exports = router;
