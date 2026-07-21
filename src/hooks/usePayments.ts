import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { store, useSession } from "@/data/store";
import { paymentService } from "@/services/payment.service";
import type {
  InitializePaymentPayload,
  RefundPaymentPayload,
} from "@/types/payment";
import { deliveryKeys } from "./useDeliveries";

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
};

const syncAppState = () => {
  void store.refresh();
};

export function usePayments() {
  const session = useSession();
  return useQuery({
    queryKey: paymentKeys.lists(),
    queryFn: paymentService.list,
    enabled: Boolean(session),
  });
}

export function useInitializePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InitializePaymentPayload) =>
      paymentService.initialize(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      syncAppState();
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reference: string) => paymentService.verify(reference),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      syncAppState();
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RefundPaymentPayload }) =>
      paymentService.refund(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      syncAppState();
    },
  });
}
