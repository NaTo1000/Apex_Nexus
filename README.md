# Apex Nexus - Crypto Trading Platform

⚡ A comprehensive cryptocurrency trading platform built with Node.js and Express.

## Features

- **User Authentication**: Secure registration and login system with JWT tokens
- **Real-time Market Data**: Live cryptocurrency prices with automatic updates
- **Trading System**: Buy and sell cryptocurrencies with instant execution
- **Portfolio Management**: Track your holdings and investment performance
- **Trade History**: Complete transaction history with detailed records
- **Responsive UI**: Modern, user-friendly interface that works on all devices

## Supported Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Binance Coin (BNB)
- Solana (SOL)
- Cardano (ADA)
- Ripple (XRP)
- Polkadot (DOT)
- Dogecoin (DOGE)

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NaTo1000/Apex_Nexus.git
cd Apex_Nexus
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```bash
cp .env.example .env
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Development Mode

Run the server in development mode with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Trading
- `POST /api/trading/buy` - Buy cryptocurrency (requires auth)
- `POST /api/trading/sell` - Sell cryptocurrency (requires auth)
- `GET /api/trading/history` - Get trade history (requires auth)

### Portfolio
- `GET /api/portfolio` - Get user portfolio (requires auth)
- `GET /api/portfolio/balance` - Get user balance (requires auth)

### Market
- `GET /api/market/prices` - Get all cryptocurrency prices
- `GET /api/market/price/:symbol` - Get price for specific cryptocurrency

## Project Structure

```
Apex_Nexus/
├── src/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── controllers/     # Route controllers
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── server.js        # Main server file
├── public/
│   ├── css/            # Stylesheets
│   ├── js/             # Frontend JavaScript
│   └── index.html      # Main HTML file
├── tests/              # Test files
├── .env.example        # Environment variables example
├── .gitignore         # Git ignore file
├── package.json       # Project dependencies
└── README.md          # Project documentation
```

## Usage

### Registration
1. Click on the "Register" tab
2. Enter username, email, and password
3. Click "Register" to create your account
4. You'll receive $10,000 starting balance

### Trading
1. View live market prices on the dashboard
2. Click on a cryptocurrency to auto-fill trade forms
3. Enter the amount you want to buy/sell
4. Click "Buy" or "Sell" to execute the trade

### Portfolio
- View your current holdings
- Check your USD balance
- Monitor total portfolio value

### Trade History
- See all your past transactions
- Track buy and sell orders
- Monitor trading performance

## Technology Stack

- **Backend**: Node.js, Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Custom CSS with responsive design

## Security Features

- Bcrypt password hashing (implemented)
- JWT token-based authentication
- Input validation and sanitization
- Protected API endpoints
- CORS enabled for security

## Security Considerations

This is a demonstration platform. For production use, consider:
- **Rate Limiting**: Add rate limiting middleware (e.g., express-rate-limit) to prevent abuse
- **JWT Secret**: Always set a strong JWT_SECRET environment variable in production
- **HTTPS**: Use HTTPS in production to encrypt data in transit
- **Input Sanitization**: Add additional input validation and sanitization
- **Database Security**: Use parameterized queries when integrating with a database
- **Monitoring**: Implement logging and monitoring for suspicious activities

## Future Enhancements

- Rate limiting middleware for API endpoints
- MongoDB database integration
- Real-time price updates with WebSockets
- Advanced charting and technical analysis
- Order books and limit orders
- Two-factor authentication
- Email notifications
- Mobile app
- Social trading features

## Testing

Run tests:
```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ⚡ by Apex Nexus Team
