const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const dataStore = require('../utils/dataStore');

// Get user portfolio
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        
        // Find user
        const user = dataStore.findUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate holdings
        const userTrades = dataStore.getTradesByUserId(userId);
        const holdings = {};

        userTrades.forEach(trade => {
            if (!holdings[trade.symbol]) {
                holdings[trade.symbol] = { amount: 0, totalCost: 0, trades: 0 };
            }

            if (trade.type === 'buy') {
                holdings[trade.symbol].amount += trade.amount;
                holdings[trade.symbol].totalCost += trade.total;
                holdings[trade.symbol].trades += 1;
            } else if (trade.type === 'sell') {
                const currentAmount = holdings[trade.symbol].amount;
                const avgPrice = currentAmount > 0 ? holdings[trade.symbol].totalCost / currentAmount : 0;
                holdings[trade.symbol].amount -= trade.amount;
                holdings[trade.symbol].totalCost -= (trade.amount * avgPrice);
            }
        });

        // Format holdings
        const portfolioHoldings = Object.entries(holdings)
            .filter(([_, data]) => data.amount > 0)
            .map(([symbol, data]) => ({
                symbol,
                amount: data.amount,
                averagePrice: data.totalCost / data.amount
            }));

        res.json({
            balance: user.balance,
            holdings: portfolioHoldings,
            totalValue: user.balance + portfolioHoldings.reduce((sum, h) => sum + (h.amount * h.averagePrice), 0)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

// Get user balance
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        
        const user = dataStore.findUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ balance: user.balance });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

module.exports = router;
