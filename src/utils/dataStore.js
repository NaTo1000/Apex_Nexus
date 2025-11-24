/**
 * In-memory data store for users and trades
 * In production, this would be replaced with a database
 */

// User storage
const users = [];
let userIdCounter = 1;

// Trade storage
const trades = [];
let tradeIdCounter = 1;

module.exports = {
    // User methods
    getUsers: () => users,
    addUser: (user) => {
        const newUser = { ...user, id: userIdCounter++ };
        users.push(newUser);
        return newUser;
    },
    findUserById: (id) => users.find(u => u.id === id),
    findUserByEmail: (email) => users.find(u => u.email === email),
    findUserByUsername: (username) => users.find(u => u.username === username),
    
    // Trade methods
    getTrades: () => trades,
    addTrade: (trade) => {
        const newTrade = { ...trade, id: tradeIdCounter++ };
        trades.push(newTrade);
        return newTrade;
    },
    getTradesByUserId: (userId) => trades.filter(t => t.userId === userId),
    getTradesByUserIdAndSymbol: (userId, symbol) => 
        trades.filter(t => t.userId === userId && t.symbol === symbol.toUpperCase())
};
