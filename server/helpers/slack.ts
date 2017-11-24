import axios from 'axios'
import env from 'config/env'
import logger from 'config/logger'

export async function sendSlackMessage(message: string, attachments: Object) {
  const channel = env.NODE_ENV === 'production' ? '#general' : '#test'

  const payload: any = {
    channel,
    username: 'Digital Tom',
    text: `\nBeste Innovadiërs,\n\n${message}`,
    icon_emoji: ':+1:'
  }

  if (attachments) payload.attachments = attachments

  await axios.post(env.SLACK_WEBHOOK, payload)

  logger.info('sent slack message', payload)
}
