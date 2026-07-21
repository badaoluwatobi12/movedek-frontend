import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { store, useSession } from "@/data/store";
import { deliveryService } from "@/services/delivery.service";
import type {
  AssignCourierPayload,
  CreateDeliveryPayload,
  DeliveryListParams,
  UpdateDeliveryStatusPayload,
} from "@/types/delivery";

export const deliveryKeys = {
  all: ["deliveries"] as const,
  lists: () => [...deliveryKeys.all, "list"] as const,
  list: (params?: DeliveryListParams) =>
    [...deliveryKeys.lists(), params ?? {}] as const,
  details: () => [...deliveryKeys.all, "detail"] as const,
  detail: (id: string) => [...deliveryKeys.details(), id] as const,
};

const syncAppState = () => {
  void store.refresh();
};

export function useDeliveries(params?: DeliveryListParams) {
  const session = useSession();

  return useQuery({
    queryKey: deliveryKeys.list(params),
    queryFn: () => deliveryService.list(params),
    enabled: Boolean(session),
  });
}

export function useDelivery(id?: string) {
  const session = useSession();

  return useQuery({
    queryKey: deliveryKeys.detail(id ?? ""),
    queryFn: () => deliveryService.get(id ?? ""),
    enabled: Boolean(session) && Boolean(id),
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeliveryPayload) => deliveryService.create(input),
    onSuccess: (delivery) => {
      queryClient.setQueryData(deliveryKeys.detail(delivery.id), delivery);
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      syncAppState();
    },
  });
}

export function useCancelDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deliveryService.cancel(id),
    onSuccess: (delivery) => {
      queryClient.setQueryData(deliveryKeys.detail(delivery.id), delivery);
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      syncAppState();
    },
  });
}

export function useAssignCourier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AssignCourierPayload }) =>
      deliveryService.assignCourier(id, input),
    onSuccess: (delivery) => {
      queryClient.setQueryData(deliveryKeys.detail(delivery.id), delivery);
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      syncAppState();
    },
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateDeliveryStatusPayload;
    }) => deliveryService.updateStatus(id, input),
    onSuccess: (delivery) => {
      queryClient.setQueryData(deliveryKeys.detail(delivery.id), delivery);
      void queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      syncAppState();
    },
  });
}
