import type {
  BonusLog,
  EarningsPoint,
  LeaderboardEntry,
  Order,
  Package,
  Transaction,
  TreeNode,
  User,
  Wallet,
  Withdrawal
} from "@/types/api";

const now = new Date();
const iso = (daysAgo: number) =>
  new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

export const mockUser: User = {
  id: "59cf8a94-8eba-4b7a-9886-522d164a2001",
  username: "arina_plus",
  email: "arina@example.com",
  sponsor_id: null,
  parent_id: null,
  placement_side: null,
  left_child_id: "f4f112c3-8cdb-4caa-9220-09d873ca3022",
  right_child_id: "8192cb84-2258-4cbb-aa48-95b01dcaf033",
  left_pv: 8420,
  right_pv: 6930,
  package_id: 3,
  is_active: true,
  created_at: iso(92)
};

export const mockWallet: Wallet = {
  id: "wallet-demo-001",
  user_id: mockUser.id,
  main_balance: 4820.75,
  deposit_balance: 915.25
};

export const mockPackages: Package[] = [
  {
    id: 1,
    name: "START",
    price: 99,
    pv_value: 100,
    is_active: true
  },
  {
    id: 2,
    name: "BUSINESS",
    price: 349,
    pv_value: 420,
    is_active: true
  },
  {
    id: 3,
    name: "VIP",
    price: 899,
    pv_value: 1200,
    is_active: true
  },
  {
    id: 4,
    name: "ELITE",
    price: 1999,
    pv_value: 3200,
    is_active: true
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: "tx-001",
    wallet_id: mockWallet.id,
    type: "BONUS_BINARY",
    amount: 620,
    balance_type: "MAIN",
    description: "Weekly binary payout",
    idempotency_key: "bonus_binary_demo_001",
    created_at: iso(0)
  },
  {
    id: "tx-002",
    wallet_id: mockWallet.id,
    type: "PACKAGE_UPGRADE",
    amount: -899,
    balance_type: "DEPOSIT",
    description: "VIP package purchase",
    idempotency_key: "package_demo_002",
    created_at: iso(2)
  },
  {
    id: "tx-003",
    wallet_id: mockWallet.id,
    type: "DEPOSIT",
    amount: 1250,
    balance_type: "MAIN",
    description: "USDT manual deposit",
    idempotency_key: "deposit_demo_003",
    created_at: iso(4)
  },
  {
    id: "tx-004",
    wallet_id: mockWallet.id,
    type: "BONUS_REFERRAL",
    amount: 90,
    balance_type: "MAIN",
    description: "Referral from milana_shop",
    idempotency_key: "referral_demo_004",
    created_at: iso(5)
  },
  {
    id: "tx-005",
    wallet_id: mockWallet.id,
    type: "WITHDRAWAL",
    amount: -500,
    balance_type: "MAIN",
    description: "Withdrawal request reserved",
    idempotency_key: "withdrawal_demo_005",
    created_at: iso(9)
  }
];

export const mockBonuses: BonusLog[] = [
  {
    id: "bonus-001",
    user_id: mockUser.id,
    type: "BINARY",
    amount: 620,
    source_user_id: "tree-node-003",
    idempotency_key: "bonus_demo_001",
    created_at: iso(0)
  },
  {
    id: "bonus-002",
    user_id: mockUser.id,
    type: "REFERRAL",
    amount: 90,
    source_user_id: "tree-node-005",
    idempotency_key: "bonus_demo_002",
    created_at: iso(5)
  },
  {
    id: "bonus-003",
    user_id: mockUser.id,
    type: "BINARY",
    amount: 430,
    source_user_id: "tree-node-007",
    idempotency_key: "bonus_demo_003",
    created_at: iso(8)
  },
  {
    id: "bonus-004",
    user_id: mockUser.id,
    type: "REFERRAL",
    amount: 180,
    source_user_id: "tree-node-010",
    idempotency_key: "bonus_demo_004",
    created_at: iso(12)
  }
];

export const mockOrders: Order[] = [
  {
    id: "order-001",
    user_id: mockUser.id,
    package_id: 3,
    amount: 899,
    status: "COMPLETED",
    idempotency_key: "order_demo_001",
    created_at: iso(2)
  },
  {
    id: "order-002",
    user_id: mockUser.id,
    package_id: 2,
    amount: 349,
    status: "COMPLETED",
    idempotency_key: "order_demo_002",
    created_at: iso(26)
  },
  {
    id: "order-003",
    user_id: mockUser.id,
    package_id: 1,
    amount: 99,
    status: "COMPLETED",
    idempotency_key: "order_demo_003",
    created_at: iso(72)
  }
];

export const mockWithdrawals: Withdrawal[] = [
  {
    id: "withdrawal-001",
    user_id: mockUser.id,
    amount: 500,
    status: "PENDING",
    payment_details: {
      method: "USDT TRC20",
      wallet: "TQ9x...8R24"
    },
    admin_note: null,
    created_at: iso(1)
  },
  {
    id: "withdrawal-002",
    user_id: mockUser.id,
    amount: 300,
    status: "COMPLETED",
    payment_details: {
      method: "Bank card",
      holder: "Arina K."
    },
    admin_note: "Paid in batch 24-04",
    created_at: iso(18)
  }
];

export const mockTree: TreeNode = {
  id: mockUser.id,
  username: mockUser.username,
  placement_side: null,
  left_pv: 8420,
  right_pv: 6930,
  package_id: 3,
  is_active: true,
  left_child: {
    id: "f4f112c3-8cdb-4caa-9220-09d873ca3022",
    username: "milana_shop",
    placement_side: "L",
    left_pv: 4360,
    right_pv: 3780,
    package_id: 4,
    is_active: true,
    left_child: {
      id: "tree-node-003",
      username: "biofit_lena",
      placement_side: "L",
      left_pv: 1780,
      right_pv: 920,
      package_id: 2,
      is_active: true,
      left_child: null,
      right_child: null
    },
    right_child: {
      id: "tree-node-004",
      username: "natura_max",
      placement_side: "R",
      left_pv: 1080,
      right_pv: 1470,
      package_id: 2,
      is_active: true,
      left_child: null,
      right_child: null
    }
  },
  right_child: {
    id: "8192cb84-2258-4cbb-aa48-95b01dcaf033",
    username: "cosmo_daria",
    placement_side: "R",
    left_pv: 3150,
    right_pv: 2540,
    package_id: 3,
    is_active: true,
    left_child: {
      id: "tree-node-005",
      username: "vitamin_ivan",
      placement_side: "L",
      left_pv: 730,
      right_pv: 510,
      package_id: 1,
      is_active: true,
      left_child: null,
      right_child: null
    },
    right_child: {
      id: "tree-node-006",
      username: "skinlab_ani",
      placement_side: "R",
      left_pv: 460,
      right_pv: 220,
      package_id: null,
      is_active: false,
      left_child: null,
      right_child: null
    }
  }
};

export const mockEarnings: EarningsPoint[] = [
  { name: "Mon", referral: 80, binary: 310 },
  { name: "Tue", referral: 120, binary: 420 },
  { name: "Wed", referral: 40, binary: 380 },
  { name: "Thu", referral: 180, binary: 500 },
  { name: "Fri", referral: 90, binary: 620 },
  { name: "Sat", referral: 150, binary: 740 },
  { name: "Sun", referral: 210, binary: 690 }
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { id: "lead-001", username: "milana_shop", package: "ELITE", earnings: 18420, growth: 18.4 },
  { id: "lead-002", username: "cosmo_daria", package: "VIP", earnings: 14280, growth: 12.7 },
  { id: "lead-003", username: "biofit_lena", package: "BUSINESS", earnings: 10950, growth: 9.8 },
  { id: "lead-004", username: "natura_max", package: "BUSINESS", earnings: 8320, growth: 7.2 }
];
