import env from 'config/env'
import logger from 'config/logger'
import { PhoneCall, PhoneCallModel } from './model'
import { UserModel } from 'server/models/user/model'
import { strongPasswordRegex } from 'server/helpers/regex'
import { validate } from 'server/helpers/validation'
import * as Joi from 'joi'
import { APIError } from 'server/helpers/error'
import * as query from './query'
import * as mongoose from 'mongoose'
import * as Twilio from 'twilio'
import { sendSlackMessage } from 'server/helpers/slack'
import * as httpStatus from 'http-status'

const TwilioClient = Twilio(env.TWILIO_ACCOUNT_ID, env.TWILIO_TOKEN)

enum NOTIFICATION_TYPES {
  Package = 'package',
  NoAnswer = 'no answer'
}

export interface ICallArgs {
  name: string
}

export interface INotificationArgs {
  type: string
}

export interface ITwilioCall {
  CallSid: string
  CallStatus: string
  Duration: number
}

export const callValidation: ICallArgs = {
  name: Joi.string().required() as any
}

const notificationValidation: INotificationArgs = {
  type: Joi.string().required().allow([NOTIFICATION_TYPES.Package, NOTIFICATION_TYPES.NoAnswer]) as any
}

export async function call(args: ICallArgs): Promise<PhoneCall> {
  validate(args, callValidation)

  const targetUser = await UserModel.findOne({
    name: env.NODE_ENV === env.Environments.Production ? args.name : 'christiaan'
  })

  if (!targetUser) {
    throw new APIError(`user with name ${args.name} does not exist`, httpStatus.BAD_REQUEST)
  }

  const call = new PhoneCallModel()
  call.targetUser = targetUser
  call.targetNumber = targetUser.phoneNumber

  let callResponse
  if (env.NODE_ENV === env.Environments.Production) {
    callResponse = await TwilioClient.calls.create({
      url: 'https://s3.eu-central-1.amazonaws.com/digital-tom/person_waiting.xml',
      to: targetUser.phoneNumber,
      from: '+' + env.TWILIO_SOURCE_NUMBER,
      statusCallback: 'https://api.digitalereceptionist.nl/external/twilio-callback',
      method: 'GET'
    })

    call.callSid = callResponse.sid

    await call.save()

    logger.info('placed call')

    return call
  } else {
    logger.info('DEV: did not actually place call')

    call.callSid = Math.floor(Math.random() * 10000).toString()
    call.status = 'busy'

    await call.save()

    return call
  }
}

export async function notification(args: INotificationArgs): Promise<void> {
  validate(args, notificationValidation)

  if (args.type === NOTIFICATION_TYPES.Package) {
    sendSlackMessage(
      'De bezorger heeft een pakketje achtergelaten op de balie van de receptie. :tada:\n\nKan iemand die ophalen?',
      [
        {
          text: 'Ga jij het ophalen? Geef het aan zodat je collega\'s niet voor niets gaan',
          callback_id: 'package_confirm',
          color: '#0029a8',
          attachment_type: 'default',
          actions: [
            {
              name: 'confirm',
              text: 'Ik haal het op!',
              type: 'button',
              value: true
            }
          ]
        }
      ]
    )
  } else if (args.type === NOTIFICATION_TYPES.NoAnswer) {
    sendSlackMessage(
      'Er staat iemand beneden die probeerde te bellen via mij maar niemand nam op :slightly_frowning_face:\n\nKan iemand kijken of er beneden iemand staat te wachten? Hij heeft wel gezien dat hij naar deze verdieping kan lopen.',
      [
        {
          text: 'Ga jij kijken? Geef het aan zodat je collega\'s niet ook gaan',
          callback_id: 'noanswer_confirm',
          color: '#0029a8',
          attachment_type: 'default',
          actions: [
            {
              name: 'confirm',
              text: 'Ik ben onderweg!',
              type: 'button',
              value: true
            }
          ]
        }
      ]
    )
  }
}

export async function twilioCallback(twilioCall: ITwilioCall): Promise<boolean> {

  // TODO check twilio security token
  const call = await PhoneCallModel.findOne({
    callSid: twilioCall.CallSid
  })

  if (!call) {
    logger.error(`call with sid ${twilioCall.CallSid} not found`)

    return false
  }

  call.status = twilioCall.CallStatus
  call.duration = twilioCall.Duration

  await call.save()

  logger.info(`set call status with sid ${call.callSid} to: ${call.status}`)

  return true
}

// Note to self:
// Schema.gql User: these are the exposed properties, clients connecting to the graphql endpoint get these back
// Schema.gql Mutation: these are the properties allowed to be set by graphql
// IUpdateUserArgs: these are properties that are updatable from within the codebase (typescript will complain on unknown props)
// Model: has all properties that are saved to database and returned when fetching from database

// So a property like User.Roles cannot be updated from graphql because graphql will error since it is not in the Mutation schema.
// It can also not be updated from the codebase because Roles is not in IUpdateUserArgs
