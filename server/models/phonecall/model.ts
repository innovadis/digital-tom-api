import env from 'config/env'
import * as mongoose from 'mongoose'
import { User } from 'server/models/user/model'
import { prop, arrayProp, Typegoose, ModelType, InstanceType, staticMethod, instanceMethod, pre, Ref } from 'typegoose'

@pre<PhoneCall>('save', async function (next) {
  if (this.isNew) {
    this.created = new Date()
  }

  next()
})

export class PhoneCall extends Typegoose {
  _id: string

  @prop({
    required: true,
    unique: true
  })
  callSid: string

  @prop({
    ref: User,
    required: true
  })
  targetUser: Ref<User>

  @prop({
    required: true
  })
  targetNumber: string

  @prop({
    required: true,
    default: 0
  })
  duration: Number

  @prop({
    required: true,
    default: 'in progress'
  })
  status: String

  @prop()
  created: Date // Set in pre-save
}

export const PhoneCallModel = new PhoneCall().getModelForClass(PhoneCall)
