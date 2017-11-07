import env from 'config/env'
import * as fs from 'fs'
import * as path from 'path'

module.exports = function (expressApp) {
  if (env.NODE_ENV !== env.Environments.Test) {
    if (!env.FOREST_AUTH_SECRET || !env.FOREST_ENV_SECRET) {
      console.log('Forest Admin: Missing credentials, not loading')
      return
    }

    expressApp.use(require('forest-express-mongoose').init({
      envSecret: env.FOREST_ENV_SECRET,
      authSecret: env.FOREST_AUTH_SECRET,
      mongoose: require('mongoose')
    }))

    // const collectionsDir = path.join(__dirname, 'collections')
    // const routesDir = path.join(__dirname, 'routes')

    // for (const file of fs.readdirSync(collectionsDir)) {
    //   require(path.join(collectionsDir, file))
    // }

    // for (const file of fs.readdirSync(routesDir)) {
    //   require(path.join(routesDir, file))
    // }

    console.log('Forest Admin: Loaded')
  }
}

// TODO move custom forest stuff and combine it
