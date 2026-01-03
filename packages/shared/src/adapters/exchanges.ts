import type { ExchangeAdapter, OrderRequest, OrderResponse } from '../types';

const notImplemented = async (feature: string): Promise<OrderResponse> => {
  return {
    id: 'na',
    status: 'not_implemented',
    message: feature + ' is not implemented in dev scaffold.'
  };
};

export const coinbaseAdapter: ExchangeAdapter = {
  name: 'coinbase',
  async getMarkets() {
    return ['BTC-USD', 'ETH-USD'];
  },
  async placeOrder(order: OrderRequest) {
    if (order.paper) {
      return {
        id: 'paper-' + Date.now().toString(),
        status: 'accepted',
        message: 'Paper trade accepted.'
      };
    }

    return {
      id: 'na',
      status: 'rejected',
      message: 'Real trading is not implemented in scaffold.'
    };
  }
};

export const metamaskAdapter: ExchangeAdapter = {
  name: 'metamask',
  async getMarkets() {
    return ['WALLET-CONNECT'];
  },
  async placeOrder() {
    return notImplemented('MetaMask server-side trading');
  }
};

export const etoroAdapter: ExchangeAdapter = {
  name: 'etoro',
  async getMarkets() {
    return ['CFD'];
  },
  async placeOrder() {
    return notImplemented('eToro trading');
  }
};

export const plus500Adapter: ExchangeAdapter = {
  name: 'plus500',
  async getMarkets() {
    return ['CFD'];
  },
  async placeOrder() {
    return notImplemented('Plus500 trading');
  }
};

export const adapters: Record<string, ExchangeAdapter> = {
  coinbase: coinbaseAdapter,
  metamask: metamaskAdapter,
  etoro: etoroAdapter,
  plus500: plus500Adapter
};

export const listAdapters = () => Object.values(adapters).map((a) => a.name);
