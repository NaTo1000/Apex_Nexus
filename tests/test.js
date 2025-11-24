/**
 * Basic tests for Apex Nexus Trading Platform
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let testToken = '';
let testUserId = '';

// Test utilities
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = {
                        status: res.statusCode,
                        data: body ? JSON.parse(body) : null
                    };
                    resolve(response);
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting Apex Nexus Tests...\n');

    try {
        // Test 1: Health Check
        console.log('Test 1: Health Check');
        const health = await makeRequest('GET', '/health');
        if (health.status === 200 && health.data.status === 'ok') {
            console.log('✅ Health check passed\n');
        } else {
            throw new Error('Health check failed');
        }

        // Test 2: User Registration
        console.log('Test 2: User Registration');
        const registerData = {
            username: 'testuser' + Date.now(),
            email: `test${Date.now()}@example.com`,
            password: 'testpass123'
        };
        const register = await makeRequest('POST', '/api/auth/register', registerData);
        if (register.status === 201 && register.data.token) {
            testToken = register.data.token;
            testUserId = register.data.user.id;
            console.log('✅ User registration passed\n');
        } else {
            throw new Error('User registration failed: ' + JSON.stringify(register));
        }

        // Test 3: Market Prices
        console.log('Test 3: Fetch Market Prices');
        const prices = await makeRequest('GET', '/api/market/prices');
        if (prices.status === 200 && Array.isArray(prices.data)) {
            console.log(`✅ Market prices fetched: ${prices.data.length} cryptocurrencies\n`);
        } else {
            throw new Error('Failed to fetch market prices');
        }

        // Test 4: Get Portfolio (should be empty)
        console.log('Test 4: Get Portfolio');
        const portfolio = await makeRequest('GET', '/api/portfolio', null, {
            'Authorization': `Bearer ${testToken}`
        });
        if (portfolio.status === 200 && portfolio.data.balance === 10000) {
            console.log('✅ Portfolio fetched: Starting balance $10,000\n');
        } else {
            throw new Error('Failed to fetch portfolio');
        }

        // Test 5: Buy Crypto
        console.log('Test 5: Buy Cryptocurrency');
        const buyData = {
            symbol: 'BTC',
            amount: 0.1,
            price: 45000
        };
        const buy = await makeRequest('POST', '/api/trading/buy', buyData, {
            'Authorization': `Bearer ${testToken}`
        });
        if (buy.status === 200 && buy.data.trade) {
            console.log('✅ Buy order executed successfully\n');
        } else {
            throw new Error('Buy order failed: ' + JSON.stringify(buy));
        }

        // Test 6: Get Trade History
        console.log('Test 6: Get Trade History');
        const history = await makeRequest('GET', '/api/trading/history', null, {
            'Authorization': `Bearer ${testToken}`
        });
        if (history.status === 200 && history.data.trades.length > 0) {
            console.log('✅ Trade history retrieved successfully\n');
        } else {
            throw new Error('Failed to get trade history');
        }

        // Test 7: Sell Crypto
        console.log('Test 7: Sell Cryptocurrency');
        const sellData = {
            symbol: 'BTC',
            amount: 0.05,
            price: 46000
        };
        const sell = await makeRequest('POST', '/api/trading/sell', sellData, {
            'Authorization': `Bearer ${testToken}`
        });
        if (sell.status === 200 && sell.data.trade) {
            console.log('✅ Sell order executed successfully\n');
        } else {
            throw new Error('Sell order failed: ' + JSON.stringify(sell));
        }

        // Test 8: Get Updated Portfolio
        console.log('Test 8: Get Updated Portfolio');
        const updatedPortfolio = await makeRequest('GET', '/api/portfolio', null, {
            'Authorization': `Bearer ${testToken}`
        });
        if (updatedPortfolio.status === 200 && updatedPortfolio.data.holdings.length > 0) {
            console.log('✅ Portfolio updated with holdings\n');
        } else {
            throw new Error('Failed to get updated portfolio');
        }

        // Test 9: Unauthorized Access
        console.log('Test 9: Test Unauthorized Access');
        const unauthorized = await makeRequest('GET', '/api/portfolio');
        if (unauthorized.status === 401) {
            console.log('✅ Unauthorized access properly blocked\n');
        } else {
            throw new Error('Unauthorized access not blocked');
        }

        // Test 10: Login
        console.log('Test 10: User Login');
        const loginData = {
            email: registerData.email,
            password: registerData.password
        };
        const login = await makeRequest('POST', '/api/auth/login', loginData);
        if (login.status === 200 && login.data.token) {
            console.log('✅ User login successful\n');
        } else {
            throw new Error('User login failed');
        }

        console.log('🎉 All tests passed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Wait for server to be ready
console.log('Waiting for server to start...');
setTimeout(() => {
    runTests();
}, 2000);
