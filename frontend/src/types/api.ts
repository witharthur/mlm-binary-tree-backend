export type Money = number | string;

export type PlacementSide = "L" | "R";

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
}

export interface User {
  id: string;
  username: string;
  email: string;
  sponsor_id?: string | null;
  parent_id?: string | null;
  placement_side?: PlacementSide | null;
  left_child_id?: string | null;
  right_child_id?: string | null;
  left_pv: Money;
  right_pv: Money;
  package_id?: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  main_balance: Money;
  deposit_balance: Money;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: string;
  amount: Money;
  balance_type: string;
  description?: string | null;
  idempotency_key: string;
  created_at: string;
}

export interface Package {
  id: number;
  name: "START" | "BUSINESS" | "VIP" | "ELITE" | string;
  price: Money;
  pv_value: number;
  is_active: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  package_id: number;
  amount: Money;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | string;
  idempotency_key: string;
  created_at: string;
}

export interface BonusLog {
  id: string;
  user_id: string;
  type: "REFERRAL" | "BINARY" | string;
  amount: Money;
  source_user_id?: string | null;
  idempotency_key: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: Money;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | string;
  payment_details?: Record<string, unknown> | null;
  admin_note?: string | null;
  created_at: string;
}

export interface TreeNode {
  id: string;
  username: string;
  placement_side?: PlacementSide | null;
  left_pv?: Money;
  right_pv?: Money;
  package_id?: number | null;
  is_active?: boolean;
  left_child?: TreeNode | null;
  right_child?: TreeNode | null;
}

export interface DepositRequest {
  amount: Money;
  idempotency_key: string;
}

export interface PurchasePackageRequest {
  package_id: number;
  idempotency_key: string;
}

export interface WithdrawalRequest {
  amount: Money;
  payment_details?: Record<string, unknown>;
}

export interface DashboardMetric {
  label: string;
  value: string;
  trend: string;
}

export interface EarningsPoint {
  name: string;
  referral: number;
  binary: number;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  package: string;
  earnings: number;
  growth: number;
}
