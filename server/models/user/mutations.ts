import { User, UserModel } from './model'
import { strongPasswordRegex } from 'server/helpers/regex'
import { validate } from 'server/helpers/validation'
import * as Joi from 'joi'
import { APIError } from 'server/helpers/error'
import * as query from './query'
import * as mongoose from 'mongoose'
import * as httpStatus from 'http-status'

export interface IAddUserArgs {
  name: string
  email: string
  password: string
}

export interface IUpdateUserArgs {
  name?: string
  password?: string
}

export const addUserValidation: IAddUserArgs = {
  name: Joi.string().max(64).min(2).required() as any,
  email: Joi.string().email().required() as any,
  password: Joi.string().regex(strongPasswordRegex).required() as any
}

const updateUserValidation: IUpdateUserArgs = {
  name: Joi.string().max(64).min(2).optional() as any,
  password: Joi.string().regex(strongPasswordRegex).optional() as any
}

export async function updateUser(id: string, args: IUpdateUserArgs): Promise<User> {
  validate(args, updateUserValidation)

  const user = await UserModel.get(id)

  if (!user) throw new APIError('user not found', httpStatus.NOT_FOUND)

  for (const key of Object.keys(args)) {
    if (args[key] !== undefined) user[key] = args[key]
  }

  await user.save()

  return user
}

// Note to self:
// Schema.gql User: these are the exposed properties, clients connecting to the graphql endpoint get these back
// Schema.gql Mutation: these are the properties allowed to be set by graphql
// IUpdateUserArgs: these are properties that are updatable from within the codebase (typescript will complain on unknown props)
// Model: has all properties that are saved to database and returned when fetching from database

// So a property like User.Roles cannot be updated from graphql because graphql will error since it is not in the Mutation schema.
// It can also not be updated from the codebase because Roles is not in IUpdateUserArgs
