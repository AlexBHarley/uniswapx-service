import { EventWatcher, OrderType, OrderValidator } from '@uniswap/uniswapx-sdk'
import { MetricsLogger } from 'aws-embedded-metrics'
import { DynamoDB } from 'aws-sdk'
import { default as bunyan, default as Logger } from 'bunyan'
import { ethers } from 'ethers'
import { REACTOR_ADDRESS_MAPPING } from '../../overrides'
import { BaseOrdersRepository } from '../../repositories/base'
import { DynamoOrdersRepository } from '../../repositories/orders-repository'
import { setGlobalMetrics } from '../../util/metrics'
import { BaseRInj, SfnInjector, SfnStateInputOutput } from '../base/index'

export interface RequestInjected extends BaseRInj {
  chainId: number
  fillChainId: number
  quoteId: string
  orderHash: string
  startingBlockNumber: number
  orderStatus: string
  getFillLogAttempts: number
  retryCount: number
  fillChainProvider: ethers.providers.JsonRpcProvider
  provider: ethers.providers.JsonRpcProvider
  orderWatcher: EventWatcher
  orderQuoter: OrderValidator
}

export interface ContainerInjected {
  dbInterface: BaseOrdersRepository
}

export class CheckOrderStatusInjector extends SfnInjector<ContainerInjected, RequestInjected> {
  public async buildContainerInjected(): Promise<ContainerInjected> {
    return {
      dbInterface: DynamoOrdersRepository.create(new DynamoDB.DocumentClient()),
    }
  }

  public async getRequestInjected(
    event: SfnStateInputOutput,
    log: Logger,
    metrics: MetricsLogger
  ): Promise<RequestInjected> {
    metrics.setNamespace('Uniswap')
    metrics.setDimensions({ Service: 'UniswapXService' })
    setGlobalMetrics(metrics)

    log = log.child({
      serializers: bunyan.stdSerializers,
    })

    // Here we hardcode the
    const orderChainId = event.chainId
    const fillChainId = '5'
    const orderChainRpc = process.env[`RPC_${orderChainId}`]
    const fillChainRpc = process.env[`RPC_${fillChainId}`]
    const orderChainProvider = new ethers.providers.JsonRpcProvider(orderChainRpc)
    const fillChainProvider = new ethers.providers.JsonRpcProvider(fillChainRpc)

    const quoter = new OrderValidator(fillChainProvider, parseInt(fillChainId))
    // TODO: use different reactor address for different order type
    const watcher = new EventWatcher(
      orderChainProvider,
      // @ts-expect-error
      REACTOR_ADDRESS_MAPPING[orderChainId][OrderType.Dutch]
    )

    return {
      log,
      chainId: orderChainId as number,
      provider: orderChainProvider,
      fillChainId: parseInt(fillChainId),
      fillChainProvider,
      orderHash: event.orderHash as string,
      quoteId: event.quoteId as string,
      startingBlockNumber: event.startingBlockNumber ? (event.startingBlockNumber as number) : 0,
      orderStatus: event.orderStatus as string,
      getFillLogAttempts: event.getFillLogAttempts ? (event.getFillLogAttempts as number) : 0,
      retryCount: event.retryCount ? (event.retryCount as number) : 0,
      orderWatcher: watcher,
      orderQuoter: quoter,
    }
  }
}
