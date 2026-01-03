export type Exchange = 'coinbase' | 'metamask' | 'etoro' | 'plus500';

export type OrderSide = 'buy' | 'sell';

export interface OrderRequest {
  exchange: Exchange;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price?: number;
  clientWalletUrl?: string;
  paper?: boolean;
}

export interface OrderResponse {
  id: string;
  status:
    | 'accepted'
    | 'rejected'
    | 'filled'
    | 'partially_filled'
    | 'canceled'
    | 'not_implemented';
  message?: string;
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  averagePrice?: number;
}

export interface ExchangeAdapter {
  name: Exchange;
  getMarkets: () => Promise<string[]>;
  placeOrder: (order: OrderRequest) => Promise<OrderResponse>;
  getPortfolio?: () => Promise<PortfolioPosition[]>;
}
