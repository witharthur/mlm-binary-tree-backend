import axios, { AxiosError } from "axios";
import type {
  BonusLog,
  DepositRequest,
  LoginRequest,
  Order,
  Package,
  PurchasePackageRequest,
  RegisterRequest,
  TokenResponse,
  Transaction,
  TreeNode,
  User,
  Wallet,
  Withdrawal,
  WithdrawalRequest
} from "@/types/api";
import {
  mockBonuses,
  mockOrders,
  mockPackages,
  mockTransactions,
  mockTree,
  mockUser,
  mockWallet,
  mockWithdrawals
} from "@/lib/mock-data";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = window.localStorage.getItem("mlm-auth-token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function isUnavailable(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  const axiosError = error as AxiosError;
  return !axiosError.response || axiosError.code === "ECONNABORTED";
}

async function withMock<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (isUnavailable(error)) return fallback;
    throw error;
  }
}

export const authApi = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    return withMock(
      async () => {
        const response = await api.post<TokenResponse>("/auth/login", data);
        return response.data;
      },
      {
        access_token: "mock-jwt-token-for-local-demo",
        token_type: "bearer"
      }
    );
  },

  async register(data: RegisterRequest): Promise<User> {
    return withMock(async () => {
      const response = await api.post<User>("/auth/register", data);
      return response.data;
    }, mockUser);
  },

  async registerReferral(
    sponsorId: string,
    side: "L" | "R",
    data: RegisterRequest
  ): Promise<User> {
    return withMock(async () => {
      const response = await api.post<User>(`/auth/register/ref/${sponsorId}/${side}`, data);
      return response.data;
    }, mockUser);
  }
};

export const userApi = {
  async me(): Promise<User> {
    return withMock(async () => {
      const response = await api.get<User>("/users/me");
      return response.data;
    }, mockUser);
  },

  async tree(depth = 5): Promise<TreeNode> {
    return withMock(async () => {
      const response = await api.get<TreeNode>(`/users/me/tree?depth=${depth}`);
      return response.data;
    }, mockTree);
  }
};

export const walletApi = {
  async getWallet(): Promise<Wallet> {
    return withMock(async () => {
      const response = await api.get<Wallet>("/wallet");
      return response.data;
    }, mockWallet);
  },

  async deposit(data: DepositRequest): Promise<Transaction> {
    return withMock(async () => {
      const response = await api.post<Transaction>("/wallet/deposit", data);
      return response.data;
    }, {
      id: `tx-${Date.now()}`,
      wallet_id: mockWallet.id,
      type: "DEPOSIT",
      amount: data.amount,
      balance_type: "MAIN",
      description: "Manual deposit",
      idempotency_key: data.idempotency_key,
      created_at: new Date().toISOString()
    });
  },

  async transactions(): Promise<Transaction[]> {
    return withMock(async () => {
      const response = await api.get<Transaction[]>("/wallet/transactions");
      return response.data;
    }, mockTransactions);
  }
};

export const packageApi = {
  async list(): Promise<Package[]> {
    return withMock(async () => {
      const response = await api.get<Package[]>("/packages");
      return response.data.length ? response.data : mockPackages;
    }, mockPackages);
  },

  async purchase(data: PurchasePackageRequest): Promise<Order> {
    return withMock(async () => {
      const response = await api.post<Order>("/packages/purchase", data);
      return response.data;
    }, {
      id: `order-${Date.now()}`,
      user_id: mockUser.id,
      package_id: data.package_id,
      amount: mockPackages.find((item) => item.id === data.package_id)?.price ?? 0,
      status: "PENDING",
      idempotency_key: data.idempotency_key,
      created_at: new Date().toISOString()
    });
  }
};

export const orderApi = {
  async list(): Promise<Order[]> {
    return withMock(async () => {
      const response = await api.get<Order[]>("/orders");
      return response.data;
    }, mockOrders);
  }
};

export const bonusApi = {
  async list(): Promise<BonusLog[]> {
    return withMock(async () => {
      const response = await api.get<BonusLog[]>("/bonuses");
      return response.data;
    }, mockBonuses);
  }
};

export const withdrawalApi = {
  async list(): Promise<Withdrawal[]> {
    return withMock(async () => {
      const response = await api.get<Withdrawal[]>("/withdrawals");
      return response.data;
    }, mockWithdrawals);
  },

  async create(data: WithdrawalRequest): Promise<Withdrawal> {
    return withMock(async () => {
      const response = await api.post<Withdrawal>("/withdrawals", data);
      return response.data;
    }, {
      id: `withdrawal-${Date.now()}`,
      user_id: mockUser.id,
      amount: data.amount,
      status: "PENDING",
      payment_details: data.payment_details ?? null,
      admin_note: null,
      created_at: new Date().toISOString()
    });
  }
};
