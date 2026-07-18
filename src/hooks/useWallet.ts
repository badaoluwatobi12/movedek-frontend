import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { store } from "@/data/store";
import { walletService } from "@/services/wallet.service";
import type { InitializeWalletTopUpPayload, TopUpWalletPayload } from "@/types/wallet";

export const walletKeys = {
  all: ["wallet"] as const,
  mine: () => [...walletKeys.all, "mine"] as const,
};

const syncAppState = () => {
  void store.refresh();
};

export function useWallet() {
  const hasToken = Boolean(store.getAuthToken());
  return useQuery({
    queryKey: walletKeys.mine(),
    queryFn: walletService.getMine,
    enabled: hasToken,
  });
}

export function useTopUpWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TopUpWalletPayload) => walletService.topUp(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
      syncAppState();
    },
  });
}

export function useInitializeWalletTopUp() {
  return useMutation({
    mutationFn: (input: InitializeWalletTopUpPayload) => walletService.initializeTopUp(input),
  });
}

export function useVerifyWalletTopUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reference: string) => walletService.verifyTopUp(reference),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.all });
      syncAppState();
    },
  });
}
