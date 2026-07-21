import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { store, useSession } from "@/data/store";
import { disputeService } from "@/services/dispute.service";
import type {
  CreateDisputePayload,
  DisputeListParams,
  UpdateDisputePayload,
} from "@/types/dispute";
import { deliveryKeys } from "./useDeliveries";

export const disputeKeys = {
  all: ["disputes"] as const,
  lists: () => [...disputeKeys.all, "list"] as const,
  list: (params?: DisputeListParams) =>
    [...disputeKeys.lists(), params ?? {}] as const,
  details: () => [...disputeKeys.all, "detail"] as const,
  detail: (id: string) => [...disputeKeys.details(), id] as const,
};

const syncAppState = () => {
  void store.refresh();
};

export function useDisputes(params?: DisputeListParams) {
  const session = useSession();
  return useQuery({
    queryKey: disputeKeys.list(params),
    queryFn: () => disputeService.list(params),
    enabled: Boolean(session),
  });
}

export function useCreateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDisputePayload) => disputeService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: disputeKeys.all });
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      syncAppState();
    },
  });
}

export function useUpdateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDisputePayload }) =>
      disputeService.update(id, input),
    onSuccess: (dispute) => {
      queryClient.setQueryData(disputeKeys.detail(dispute.id), dispute);
      void queryClient.invalidateQueries({ queryKey: disputeKeys.all });
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      syncAppState();
    },
  });
}
