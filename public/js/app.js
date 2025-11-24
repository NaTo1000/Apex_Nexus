// API Base URL - use relative path for better portability
const API_URL = window.location.origin + '/api';

// State
let token = localStorage.getItem('token');
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        showTradingSection();
        loadMarketPrices();
        loadPortfolio();
        loadTradeHistory();
        startPriceUpdates();
    } else {
        showAuthSection();
    }

    // Setup form handlers
    setupFormHandlers();
});

// Auth Functions
function showLogin() {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === 0);
    });
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'flex';
    document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === 1);
    });
}

function showAuthSection() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('tradingSection').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
}

function showTradingSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('tradingSection').style.display = 'block';
    document.getElementById('userInfo').style.display = 'flex';
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    showAuthSection();
}

// Setup form handlers
function setupFormHandlers() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                token = data.token;
                currentUser = data.user;
                localStorage.setItem('token', token);
                showTradingSection();
                loadMarketPrices();
                loadPortfolio();
                loadTradeHistory();
                startPriceUpdates();
                document.getElementById('loginError').textContent = '';
            } else {
                document.getElementById('loginError').textContent = data.error;
            }
        } catch (error) {
            document.getElementById('loginError').textContent = 'Login failed. Please try again.';
        }
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                token = data.token;
                currentUser = data.user;
                localStorage.setItem('token', token);
                showTradingSection();
                loadMarketPrices();
                loadPortfolio();
                loadTradeHistory();
                startPriceUpdates();
                document.getElementById('registerError').textContent = '';
            } else {
                document.getElementById('registerError').textContent = data.error;
            }
        } catch (error) {
            document.getElementById('registerError').textContent = 'Registration failed. Please try again.';
        }
    });

    // Buy form
    document.getElementById('buyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await executeTrade('buy');
    });

    // Sell form
    document.getElementById('sellForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await executeTrade('sell');
    });

    // Calculate totals on input
    ['buyAmount', 'buyPrice'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const amount = parseFloat(document.getElementById('buyAmount').value) || 0;
            const price = parseFloat(document.getElementById('buyPrice').value) || 0;
            document.getElementById('buyTotal').textContent = (amount * price).toFixed(2);
        });
    });

    ['sellAmount', 'sellPrice'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const amount = parseFloat(document.getElementById('sellAmount').value) || 0;
            const price = parseFloat(document.getElementById('sellPrice').value) || 0;
            document.getElementById('sellTotal').textContent = (amount * price).toFixed(2);
        });
    });
}

// Market Functions
async function loadMarketPrices() {
    try {
        const response = await fetch(`${API_URL}/market/prices`);
        const prices = await response.json();

        const marketGrid = document.getElementById('marketPrices');
        marketGrid.innerHTML = prices.map(crypto => `
            <div class="crypto-card" onclick="fillTradeForm('${crypto.symbol}', ${crypto.price})">
                <h3>${crypto.name} (${crypto.symbol})</h3>
                <div class="crypto-price">$${crypto.price.toFixed(2)}</div>
                <div class="crypto-change ${crypto.change24h >= 0 ? 'positive' : 'negative'}">
                    ${crypto.change24h >= 0 ? '▲' : '▼'} ${Math.abs(crypto.change24h).toFixed(2)}%
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load market prices:', error);
    }
}

function fillTradeForm(symbol, price) {
    document.getElementById('buySymbol').value = symbol;
    document.getElementById('buyPrice').value = price.toFixed(2);
    document.getElementById('sellSymbol').value = symbol;
    document.getElementById('sellPrice').value = price.toFixed(2);
}

// Trading Functions
async function executeTrade(type) {
    const symbol = document.getElementById(`${type}Symbol`).value;
    const amount = parseFloat(document.getElementById(`${type}Amount`).value);
    const price = parseFloat(document.getElementById(`${type}Price`).value);

    try {
        const response = await fetch(`${API_URL}/trading/${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ symbol, amount, price })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById(`${type}Error`).textContent = '';
            document.getElementById(`${type}Form`).reset();
            document.getElementById(`${type}Total`).textContent = '0.00';
            
            // Update UI
            loadPortfolio();
            loadTradeHistory();
            
            alert(`${type === 'buy' ? 'Purchase' : 'Sale'} successful! New balance: $${data.newBalance.toFixed(2)}`);
        } else {
            document.getElementById(`${type}Error`).textContent = data.error;
        }
    } catch (error) {
        document.getElementById(`${type}Error`).textContent = 'Trade failed. Please try again.';
    }
}

// Portfolio Functions
async function loadPortfolio() {
    try {
        const response = await fetch(`${API_URL}/portfolio`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        // Update balance
        document.getElementById('userBalance').textContent = `Balance: $${data.balance.toFixed(2)}`;

        // Update holdings
        const portfolioContent = document.getElementById('portfolioContent');
        
        if (data.holdings.length === 0) {
            portfolioContent.innerHTML = '<p>No holdings yet. Start trading to build your portfolio!</p>';
        } else {
            portfolioContent.innerHTML = data.holdings.map(holding => `
                <div class="portfolio-item">
                    <div>
                        <h4>${holding.symbol}</h4>
                        <p>Avg. Price: $${holding.averagePrice.toFixed(2)}</p>
                    </div>
                    <div class="portfolio-details">
                        <div class="portfolio-amount">${holding.amount.toFixed(4)} coins</div>
                        <div>Value: $${(holding.amount * holding.averagePrice).toFixed(2)}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load portfolio:', error);
    }
}

// Trade History Functions
async function loadTradeHistory() {
    try {
        const response = await fetch(`${API_URL}/trading/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        const historyDiv = document.getElementById('tradeHistory');
        
        if (data.trades.length === 0) {
            historyDiv.innerHTML = '<p>No trades yet.</p>';
        } else {
            historyDiv.innerHTML = `
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Symbol</th>
                            <th>Amount</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.trades.map(trade => `
                            <tr>
                                <td>${new Date(trade.timestamp).toLocaleString()}</td>
                                <td class="trade-type-${trade.type}">${trade.type.toUpperCase()}</td>
                                <td>${trade.symbol}</td>
                                <td>${trade.amount.toFixed(4)}</td>
                                <td>$${trade.price.toFixed(2)}</td>
                                <td>$${trade.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Failed to load trade history:', error);
    }
}

// Auto-update prices
function startPriceUpdates() {
    setInterval(() => {
        loadMarketPrices();
    }, 10000); // Update every 10 seconds
}
