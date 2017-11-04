import * as Liana from 'forest-express-mongoose'

Liana.collection('speech', {
  fields: [
    { field: 'timestamp', type: 'Date' },
    { field: 'words', type: 'String' }
  ]
})
