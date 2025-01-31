import Joi from 'joi'
import FieldValidator from '../../../util/field-validator'

export const PostOrderRequestBodyJoi = Joi.object({
  encodedOrder: FieldValidator.isValidEncodedOrder().required(),
  signature: FieldValidator.isValidSignature().required(),
  chainId: FieldValidator.isValidChainId().required(),
  quoteId: FieldValidator.isValidQuoteId(),
})

export const PostOrderResponseJoi = Joi.object({
  hash: FieldValidator.isValidOrderHash(),
})

export type PostOrderRequestBody = {
  encodedOrder: string
  signature: string
  chainId: number
  quoteId?: string
}

export type PostOrderResponse = {
  hash: string
}
