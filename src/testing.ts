import * as Types from './json-types'

export const makeRequest = (intent?, slots?) : Types.Request => {
  if (intent) {
    return {
      type: 'IntentRequest',
      requestId: '',
      timeStamp: '',
      intent: {
        name: intent,
        slots: slots || {},
      },
    }
  } else {
    return {
      type: 'LaunchRequest',
      requestId: '',
      timeStamp: '',
    }
  }
}

export const makeUnauthorisedSession = () : Types.Session => ({
  sessionId: 'SessionId.11112-as213-sdq-232d-thisismadeup',
  application: {
    applicationId: 'TESTAPIID',
  },
  attributes: {},
  user: {
    userId: null,
    accessToken: null,
  },
  new: true,
})

export const makeAuthorisedSession = () => {
  const session = makeUnauthorisedSession()
  session.user.accessToken = 'SomeAccessToken'
  return session
}

export const startSession = (request: Types.Request) : Types.RequestBody => ({
  version: '1.0',
  session: makeUnauthorisedSession(),
  request: request,
})

export const lambdaContext = () => ({
  awsRequestId: '',
  functionName: '',
  callbackWaitsForEmptyEventLoop: true,
  functionVersion: '',
  invokeid: '',
  logGroupName: '',
  logStreamName: '',
  memoryLimitInMB: '128',
})

export const configure = (handler: Types.AlexaLambda) =>
  (request: Types.RequestBody) : Promise<Types.ResponseBody> =>
    new Promise((resolve, reject) =>
      handler(request, lambdaContext(), (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      }))

export const executeLambda = (handler, request) => configure(handler)(request)
