const express = require('express');
const router = express.Router();

// Mock market data - in production, this would fetch from a real API
const marketData = {
    'BTC': { symbol: 'BTC', name: 'Bitcoin', price: 45000, change24h: 2.5 },
    'ETH': { symbol: 'ETH', name: 'Ethereum', price: 3200, change24h: 3.8 },
    'BNB': { symbol: 'BNB', name: 'Binance Coin', price: 520, change24h: -1.2 },
    'SOL': { symbol: 'SOL', name: 'Solana', price: 95, change24h: 5.3 },
    'ADA': { symbol: 'ADA', name: 'Cardano', price: 0.58, change24h: 1.7 },
    'XRP': { symbol: 'XRP', name: 'Ripple', price: 0.62, change24h: -0.5 },
    'DOT': { symbol: 'DOT', name: 'Polkadot', price: 7.8, change24h: 4.2 },
    'DOGE': { symbol: 'DOGE', name: 'Dogecoin', price: 0.092, change24h: 8.5 }
};

// Get all market prices
router.get('/prices', async (req, res) => {
    try {
        // Add some random variation to prices
        const updatedMarketData = {};
        Object.keys(marketData).forEach(symbol => {
            const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
            updatedMarketData[symbol] = {
                ...marketData[symbol],
                price: marketData[symbol].price * (1 + variation)
            };
        });

        res.json(Object.values(updatedMarketData));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch market prices' });
    }
});

// Get price for specific symbol
router.get('/price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const crypto = marketData[symbol.toUpperCase()];

        if (!crypto) {
            return res.status(404).json({ error: 'Cryptocurrency not found' });
        }

        // Add some random variation to price
        const variation = (Math.random() - 0.5) * 0.02;
        const currentPrice = crypto.price * (1 + variation);

        res.json({
            symbol: crypto.symbol,
            name: crypto.name,
            price: currentPrice,
            change24h: crypto.change24h
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch price' });
    }
});

module.exports = router;
