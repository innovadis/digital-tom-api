import env from 'config/env'
import { PhoneCall, PhoneCallModel } from './model'
import * as Joi from 'joi'
import { validate } from 'server/helpers/validation'

export interface IStatusArgs {
  callSid: string
}

export const statusValidation: IStatusArgs = {
  callSid: Joi.string().required() as any
}

export async function status(args: IStatusArgs): Promise<PhoneCall> {
  validate(args, statusValidation)

  let callSid = args.callSid

  if (env.NODE_ENV === env.Environments.Development) {
    callSid = '123'
  }

  const call = PhoneCallModel.findOne({
    callSid
  })

  if (!call) throw new Error('callsid does not exist')

  return call
}
