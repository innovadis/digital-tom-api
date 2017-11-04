import env from 'config/env'
import logger from 'config/logger'
import { validate } from 'server/helpers/validation'
import * as Joi from 'joi'
import { APIError } from 'server/helpers/error'

export enum LOG_TYPES {
  Event = 'event',
  Speech = 'speech'
}

export interface ILogArgs {
  event: LOG_TYPES
  message: string
}

const logValidation: ILogArgs = {
  event: Joi.string().required().allow([LOG_TYPES.Event, LOG_TYPES.Speech]) as any,
  message: Joi.string().required() as any
}

export function log(args: ILogArgs): void {
  validate(args, logValidation)

  logger.info('client logging', args)
}
