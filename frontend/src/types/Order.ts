export const OrderStatus = {
    Pending: 0,
    Paid: 1,
    Shipped: 2,
    Delivered: 3,
    Cancelled: 4,
    Refunded: 5,
} as const

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const orderStatusLabels: Record<OrderStatus, string> = {
    [OrderStatus.Pending]: 'Pending',
    [OrderStatus.Paid]: 'Paid',
    [OrderStatus.Shipped]: 'Shipped',
    [OrderStatus.Delivered]: 'Delivered',
    [OrderStatus.Cancelled]: 'Cancelled',
    [OrderStatus.Refunded]: 'Refunded',
}

export interface OrderItemDto {
    productId: number
    productName: string
    unitPrice: number
    quantity: number
}

export interface OrderDto {
    id: number
    status: OrderStatus
    totalAmount: number
    createdAt: string
    items: OrderItemDto[]
    clientSecret?: string | null
}

export interface AdminOrderDto {
    id: number
    userId: string
    userFullName: string
    userEmail: string
    status: OrderStatus
    totalPrice: number
    createdAt: string
    items: OrderItemDto[]
}

export interface PagedResult<T> {
    items: T[]
    page: number
    pageSize: number
    totalCount: number
}

export const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.Pending]: [OrderStatus.Paid, OrderStatus.Cancelled],
    [OrderStatus.Paid]: [OrderStatus.Shipped, OrderStatus.Refunded],
    [OrderStatus.Shipped]: [OrderStatus.Delivered, OrderStatus.Refunded],
    [OrderStatus.Delivered]: [OrderStatus.Refunded],
    [OrderStatus.Cancelled]: [],
    [OrderStatus.Refunded]: [],
}