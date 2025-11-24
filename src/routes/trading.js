const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authRoutes = require('./auth');

// In-memory trade storage
const trades = [];
let tradeIdCounter = 1;

// Buy crypto
router.post('/buy', authMiddleware, async (req, res) => {
    try {
        const { symbol, amount, price } = req.body;
        const userId = req.userId;

        // Validate input
        if (!symbol || !amount || !price) {
            return res.status(400).json({ error: 'Symbol, amount, and price are required' });
        }

        if (amount <= 0 || price <= 0) {
            return res.status(400).json({ error: 'Amount and price must be positive' });
        }

        // Find user
        const user = authRoutes.users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const total = amount * price;

        // Check balance
        if (user.balance < total) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Execute trade
        user.balance -= total;

        const trade = {
            id: tradeIdCounter++,
            userId,
            symbol: symbol.toUpperCase(),
            type: 'buy',
            amount,
            price,
            total,
            timestamp: new Date(),
            status: 'completed'
        };

        trades.push(trade);

        res.json({
            message: 'Purchase successful',
            trade,
            newBalance: user.balance
        });
    } catch (error) {
        res.status(500).json({ error: 'Trade failed' });
    }
});

// Sell crypto
router.post('/sell', authMiddleware, async (req, res) => {
    try {
        const { symbol, amount, price } = req.body;
        const userId = req.userId;

        // Validate input
        if (!symbol || !amount || !price) {
            return res.status(400).json({ error: 'Symbol, amount, and price are required' });
        }

        if (amount <= 0 || price <= 0) {
            return res.status(400).json({ error: 'Amount and price must be positive' });
        }

        // Find user
        const user = authRoutes.users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user has enough crypto
        const userTrades = trades.filter(t => t.userId === userId && t.symbol === symbol.toUpperCase());
        const totalBought = userTrades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.amount, 0);
        const totalSold = userTrades.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.amount, 0);
        const currentHolding = totalBought - totalSold;

        if (currentHolding < amount) {
            return res.status(400).json({ error: 'Insufficient crypto holdings' });
        }

        const total = amount * price;

        // Execute trade
        user.balance += total;

        const trade = {
            id: tradeIdCounter++,
            userId,
            symbol: symbol.toUpperCase(),
            type: 'sell',
            amount,
            price,
            total,
            timestamp: new Date(),
            status: 'completed'
        };

        trades.push(trade);

        res.json({
            message: 'Sale successful',
            trade,
            newBalance: user.balance
        });
    } catch (error) {
        res.status(500).json({ error: 'Trade failed' });
    }
});

// Get trade history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const userTrades = trades.filter(t => t.userId === userId);
        
        res.json({
            trades: userTrades.sort((a, b) => b.timestamp - a.timestamp)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trade history' });
    }
});

module.exports = router;
module.exports.trades = trades; // Export for other modules
