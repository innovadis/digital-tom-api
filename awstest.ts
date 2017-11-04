import * as AWS from 'aws-sdk'
import env from './config/env'

AWS.config.update({
  accessKeyId: env.CLOUDWATCH_ACCESS_KEY,
  secretAccessKey: env.CLOUDWATCH_SECRET,
  region: env.CLOUDWATCH_REGION
})

const logs = new AWS.CloudWatchLogs()

  ; (async () => {
    const result = await logs.getLogEvents({
      logGroupName: 'digital-tom',
      logStreamName: '2017-11-04' // TODO
    }).promise()

    const speech = result.events
      .filter(x => {
        const event = JSON.parse(x.message)

        return event.meta.event === 'speech'
      })
      .map(x => {
        const event = JSON.parse(x.message)

        return event.meta.message
      })

    console.log(speech)
  })()
