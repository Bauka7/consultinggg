import api, { unwrap } from './client';
import type { ApiResponse, PaginatedData, Order, OrderStatus, OrderStatusHistory, UpdateOrderDto } from './types';

export type { Order, OrderStatus, OrderStatusHistory, UpdateOrderDto };
export { ORDER_FLOW, ORDER_STATUS_LABELS } from './types';

export const ordersApi = {
  list: (params?: { page?: number; limit?: number; status?: OrderStatus; search?: string }) =>
    api.get<ApiResponse<PaginatedData<Order>>>('/orders', { params }).then(unwrap),

  get: (id: string) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`).then(unwrap),

  update: (id: string, dto: UpdateOrderDto) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}`, dto).then(unwrap),

  updateTracking: (id: string, data: { cargoCompany?: string; trackingNumber?: string; eta?: string }) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}/tracking`, data).then(unwrap),

  getHistory: (id: string) =>
    api.get<ApiResponse<OrderStatusHistory[]>>(`/orders/${id}/history`).then(unwrap),
};
