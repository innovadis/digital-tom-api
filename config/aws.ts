import * as AWS from 'aws-sdk'
import env from 'config/env'

AWS.config.update({
  accessKeyId: env.CLOUDWATCH_ACCESS_KEY,
  secretAccessKey: env.CLOUDWATCH_SECRET,
  region: env.CLOUDWATCH_REGION
})

export default AWS
