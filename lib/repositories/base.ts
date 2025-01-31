import { OrderEntity, ORDER_STATUS, SettledAmount } from '../entities/index'
import { GetOrdersQueryParams } from '../handlers/get-orders/schema'

export type QueryResult = {
  orders: OrderEntity[]
  cursor?: string
}

export interface BaseOrdersRepository {
  getByHash: (hash: string) => Promise<OrderEntity | undefined>
  putOrderAndUpdateNonceTransaction: (order: OrderEntity) => Promise<void>
  countOrdersByOffererAndStatus: (offerer: string, orderStatus: ORDER_STATUS) => Promise<number>
  getOrders: (limit: number, queryFilters: GetOrdersQueryParams, cursor?: string) => Promise<QueryResult>
  getByOfferer: (offerer: string, limit: number) => Promise<QueryResult>
  getByOrderStatus: (orderStatus: string, limit: number) => Promise<QueryResult>
  getNonceByAddressAndChain: (address: string, chainId: number) => Promise<string>
  updateOrderStatus: (
    orderHash: string,
    status: ORDER_STATUS,
    txHash?: string,
    settledAmounts?: SettledAmount[]
  ) => Promise<void>
}
