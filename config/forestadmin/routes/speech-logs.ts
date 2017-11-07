import * as Liana from 'forest-express-mongoose'
import AWS from 'config/aws'
import * as Moment from 'moment'

import { router } from 'config/express'

const logs = new AWS.CloudWatchLogs()

router.get('/forest/speech', Liana.ensureAuthenticated, async function (req, res) {
  // const result = await logs.getLogEvents({
  //   logGroupName: 'digital-tom',
  //   logStreamName: Moment().format('YYYY-MM-DD') // TODO
  // }).promise()

  // const speech = result.events
  //   .filter(x => {
  //     const anyEvent = JSON.parse(x.message)

  //     return anyEvent.meta.event === 'speech'
  //   })
  //   .map(logEvent => {
  //     const speechEvent = JSON.parse(logEvent.message)

  //     return {
  //       timestamp: logEvent.timestamp,
  //       message: speechEvent.meta.message
  //     }
  //   })

  // res.send({
  //   data: speech.map(wordObject => {
  //     return {
  //       type: 'speech',
  //       attributes: {
  //         timestamp: new Date(wordObject.timestamp),
  //         words: wordObject.message
  //       }
  //     }
  //   })
  // })
})
