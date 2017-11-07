import env from 'config/env'
import * as httpStatus from 'http-status'
import { twilioCallback } from 'server/models/phonecall/mutations'
const router = require('express-promise-router')()

/** POST /external/twilio-callback */
router.route('/twilio-callback')
  .post(async (req, res) => {
    const success = await twilioCallback(req.body)

    if (success) return res.sendStatus(httpStatus.OK)

    res.sendStatus(httpStatus.BAD_REQUEST)
  })

export default router
