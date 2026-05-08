import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bonusApi,
  orderApi,
  packageApi,
  userApi,
  walletApi,
  withdrawalApi
} from "@/lib/api";
import { toNumber } from "@/lib/utils";
import type {
  DepositRequest,
  PurchasePackageRequest,
  Transaction,
  Wallet,
  WithdrawalRequest
} from "@/types/api";

export const queryKeys = {
  me: ["me"] as const,
  tree: (depth: number) => ["tree", depth] as const,
  wallet: ["wallet"] as const,
  transactions: ["transactions"] as const,
  packages: ["packages"] as const,
  orders: ["orders"] as const,
  bonuses: ["bonuses"] as const,
  withdrawals: ["withdrawals"] as const
};

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: userApi.me
  });
}

export function useTree(depth = 5) {
  return useQuery({
    queryKey: queryKeys.tree(depth),
    queryFn: () => userApi.tree(depth)
  });
}

export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: walletApi.getWallet
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: walletApi.transactions
  });
}

export function usePackages() {
  return useQuery({
    queryKey: queryKeys.packages,
    queryFn: packageApi.list
  });
}

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: orderApi.list
  });
}

export function useBonuses() {
  return useQuery({
    queryKey: queryKeys.bonuses,
    queryFn: bonusApi.list
  });
}

export function useWithdrawals() {
  return useQuery({
    queryKey: queryKeys.withdrawals,
    queryFn: withdrawalApi.list
  });
}

export function useDepositMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepositRequest) => walletApi.deposit(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wallet });
      const previousWallet = queryClient.getQueryData<Wallet>(queryKeys.wallet);
      const previousTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactions
      );

      if (previousWallet) {
        queryClient.setQueryData<Wallet>(queryKeys.wallet, {
          ...previousWallet,
          deposit_balance: toNumber(previousWallet.deposit_balance) + toNumber(payload.amount)
        });
      }

      const optimisticTransaction: Transaction = {
        id: `optimistic-${Date.now()}`,
        wallet_id: previousWallet?.id ?? "wallet",
        type: "DEPOSIT",
        amount: payload.amount,
        balance_type: "DEPOSIT",
        description: "Pending manual deposit",
        idempotency_key: payload.idempotency_key,
        created_at: new Date().toISOString()
      };

      queryClient.setQueryData<Transaction[]>(queryKeys.transactions, [
        optimisticTransaction,
        ...(previousTransactions ?? [])
      ]);

      return { previousWallet, previousTransactions };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousWallet) {
        queryClient.setQueryData(queryKeys.wallet, context.previousWallet);
      }
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKeys.transactions, context.previousTransactions);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
    }
  });
}

export function usePurchasePackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PurchasePackageRequest) => packageApi.purchase(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    }
  });
}

export function useCreateWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawalRequest) => withdrawalApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals });
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
    }
  });
}
