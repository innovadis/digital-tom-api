import env from 'config/env'
import * as mutations from './mutations'

export default {
  Mutation: {
    async log(_, args): Promise<void> {
      mutations.log(args)
    }
  }
}
