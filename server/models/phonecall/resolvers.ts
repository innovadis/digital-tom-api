import env from 'config/env'
import { PhoneCall } from './model'
import * as mutations from './mutations'
import * as query from './query'

export default {
  Query: {
    async status(_, args): Promise<PhoneCall> {
      return query.status(args)
    }
  },

  Mutation: {
    async call(_, args): Promise<PhoneCall> {
      return mutations.call(args)
    },

    async notification(_, args): Promise<void> {
      return mutations.notification(args)
    }
  }
}
