import env from 'config/env'
import logger from 'config/logger'
import * as httpStatus from 'http-status'
import * as express from 'express'
import * as Morgan from 'morgan'
import * as bodyParser from 'body-parser'
import * as compress from 'compression'
import * as cors from 'cors'
import * as expressWinston from 'express-winston'
import * as helmet from 'helmet'
import * as Raven from 'raven'
import * as expressPromiseRouter from 'express-promise-router'
import { APIError } from 'server/helpers/error'
import { graphiqlExpress } from 'apollo-server-express'
import { checkAuthentication, checkAdminRole } from 'server/controllers/auth.controller'
import { Express } from 'express-serve-static-core'
import * as getPort from 'get-port'

import publicRoutes from 'server/public_routes'
import { graphQlRoute, graphQlAdminRoute } from 'config/graphql'

let app: Express
let router

;(async () => {
  app = express()

  router = expressPromiseRouter()

  if (env.NODE_ENV === env.Environments.Development) {
    app.use(Morgan('dev')) // HTTP request logging
  }

  // Parse body params and set them to req.body
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use(compress()) // Enable compression
  app.enable('trust proxy') // Needed if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
  app.use(helmet()) // Secure apps by setting various HTTP headers

  // Load Forest Admin
  // require('config/forestadmin')(app)

  // Enable CORS - Cross Origin Resource Sharing
  if (env.NODE_ENV === env.Environments.Production) {
    app.use(cors())
    // app.use(cors({
    //   origin: [], // TODO add origins for production
    //   optionsSuccessStatus: 200
    // }))

    // Enable Forest Admin (must be done before express error handlers)
  } else {
    app.use(cors())
  }

  // Public routes for login and registration
  app.use('/', publicRoutes)

  // Private GraphQL routes, require authentication

  if (env.NODE_ENV === env.Environments.Development) {
    app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))
    app.use('/admin-graphiql', graphiqlExpress({ endpointURL: '/admin-graphql' }))
  }

  router.use('/graphql', bodyParser.json(), checkAuthentication, graphQlRoute)
  router.use('/admin-graphql', bodyParser.json(), checkAuthentication, checkAdminRole, graphQlAdminRoute)
  app.use('/', router)

  // Enable detailed API logging
  if (env.NODE_ENV !== env.Environments.Test) {
    expressWinston.requestWhitelist.push('body')
    expressWinston.responseWhitelist.push('body')
    app.use(expressWinston.logger({
      winstonInstance: logger,
      meta: true, // optional: log meta data about request (defaults to true)
      msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
      colorStatus: true // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
    }))
  }

  // If error is not an instanceOf APIError, convert it.
  app.use((err, req, res, next) => {
    if (!(err instanceof APIError)) {
      const apiError = new APIError(err.message, err.status, err.isPublic)

      return next(apiError)
    }
    return next(err)
  })

  // Catch 404 and forward to error handler
  app.use((req, res, next) => {
    if (req.url === '/favicon.ico') {
      return res.sendStatus(httpStatus.NOT_FOUND)
    }

    const err = new APIError('API not found', httpStatus.NOT_FOUND)
    return next(err)
  })

  // Error handler, send stacktrace only during development
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars

    // Filter errors that are not really errors
    if (env.NODE_ENV !== env.Environments.Test) {
      if (err instanceof APIError) {
        logger.warn('Handled API error', {
          err,
          request: {
            url: req.url,
            params: req.params,
            query: req.query,
            method: req.method,
            body: req.body
          }
        })
      } else {
        const headersWithoutAuth = req.headers
        delete headersWithoutAuth.authorization

        const request = {
          url: req.url,
          params: req.params,
          query: req.query,
          method: req.method,
          headers: headersWithoutAuth,
          body: req.body
        }

        logger.error('Unhandled exception occurred', {
          err,
          stack: err.stack,
          request
        })

        if (env.NODE_ENV === env.Environments.Production) {
          Raven.captureException(err, {
            request
          } as Raven.CaptureOptions)
        }
      }
    }

    if (env.NODE_ENV === env.Environments.Test) {
      if (err.status === httpStatus.INTERNAL_SERVER_ERROR) { // TODO needed?
        console.log('Internal Server Error:', err.message)
      }
    }

    // Determines what to return to user. Add error stack in development. Only add error message if it is set as public.
    if (env.NODE_ENV === env.Environments.Production) {
      res.status(err.status).json({
        message: err.isPublic ? err.message : httpStatus[err.status]
      })
    } else {
      res.status(err.status).json({
        message: err.message,
        stack: err.stack
      })
    }
  })

  const port = env.NODE_ENV === env.Environments.Test ? await getPort() : env.PORT

  app.listen(port, () => {
    logger.info(`Server started on port ${port} (${env.NODE_ENV})`)
  })

  if (env.NODE_ENV !== env.Environments.Test) {
    console.log('Express: Loaded')
  }
})()

export {
  router
}

export default app
