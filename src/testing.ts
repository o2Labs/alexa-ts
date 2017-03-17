import * as Types from './json-types'

/**
 * Helpers to create various fake things for Alexa requests.
 */
export const Fake = Object.freeze({
  timestamp: () => new Date().toISOString(),
  userId: () => "amzn1.ask.account.FAKEACCOUNTID",
  requestId: () => "amzn1.echo-api.request.d15314a4-3a86-4d5a-90b0-5adb6a5b5ce7",
  sessionId: () => "amzn1.echo-api.session.bcea274f-0dd8-43ac-8369-e102f881b42e",
  applicationId: () => "amzn1.ask.skill.659a0b41-d887-45b0-a158-01b3d2214d5a",

  /**
   * Create a version 1.0 Alexa request
   */
  requestBody: (session: Types.Session, request: Types.Request) : Types.RequestBody => ({
    version: '1.0',
    session: session,
    request: request,
  }),

  launchRequest: () : Types.LaunchRequest => ({
    type: 'LaunchRequest',
    requestId: Fake.requestId(),
    timeStamp: Fake.timestamp(),
  }),

  intentRequest: (intent: string, slots?) : Types.IntentRequest => ({
    type: 'IntentRequest',
    requestId: Fake.requestId(),
    timeStamp: Fake.timestamp(),
    intent: {
      name: intent,
      slots: slots || {},
    },
  }),

  sessionEnded: (reason?: Types.SessionEndedReason) : Types.SessionEndedRequest => ({
    type: 'SessionEndedRequest',
    reason: reason || 'USER_INITIATED',
    requestId: Fake.requestId(),
    timeStamp: Fake.timestamp(),
  }),

  session: () : Types.Session => ({
    sessionId: Fake.sessionId(),
    application: {
      applicationId: Fake.applicationId(),
    },
    attributes: {},
    user: {
      userId: Fake.userId(),
      accessToken: null,
    },
    new: true,
  }),

  lambdaContext: () : Types.Context => ({
    awsRequestId: 'e0aa9f2d-5f4a-4ae8-a7b9-bb1a79ed91f6',
    functionName: 'test-function',
    callbackWaitsForEmptyEventLoop: true,
    functionVersion: '$LATEST',
    invokeid: 'invokeid',
    logGroupName: 'logGroupName',
    logStreamName: 'logStreamName',
    memoryLimitInMB: '128',
  }),
})

type ExecuteRequest = (request: Types.RequestBody) => Promise<Types.ResponseBody>

export const configure =
  (handler: Types.AlexaLambda, lambdaContext?: Types.Context) : ExecuteRequest => {
    if (typeof lambdaContext === 'undefined') {
      lambdaContext = Fake.lambdaContext()
    }

    return request =>
      new Promise((resolve, reject) =>
        handler(request, lambdaContext, (err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res)
          }
        }))
  }

export interface Builders {
  LaunchRequest?: () => Types.LaunchRequest
  IntentRequest?: (name: string, slots?) => Types.IntentRequest
  SessionEndedRequest?: (reason?: Types.SessionEndedReason) => Types.SessionEndedRequest
  Session?: () => Types.Session
}

const defaultBuilders = () : Builders => ({
  LaunchRequest: Fake.launchRequest,
  IntentRequest: Fake.intentRequest,
  SessionEndedRequest: Fake.sessionEnded,
  Session: Fake.session,
})

const extendBuilders = (custom?: Builders) => {
  const builders = defaultBuilders()
  if (typeof custom === 'undefined') {
    return builders
  }

  Object.keys(custom).forEach(key => {
    builders[key] = custom[key]
  })

  return builders
}

/**
 * Mock session for an Alexa lambda
 */
export class Session {
  private execute: ExecuteRequest
  private session: Types.Session
  private builders: Builders

  /**
   * Start a new session
   * @param lambda Alexa lambda function to test.
   * @param builders Optional custom builders to be used.
   */
  constructor (lambda: Types.AlexaLambda, builders?: Builders) {
    this.execute = configure(lambda)
    this.builders = extendBuilders(builders)
    this.session = this.builders.Session()
  }

  LinkAccount (accessToken: string) {
    this.session.user.accessToken = accessToken
    return this
  }

  LaunchSkill () {
    return this.Request(Fake.requestBody(this.session, this.builders.LaunchRequest()))
  }

  RequestIntent (name: string, slots?) {
    return this.Request(Fake.requestBody(this.session, this.builders.IntentRequest(name, slots)))
  }

  EndSession (reason?: Types.SessionEndedReason) {
    return this.Request(Fake.requestBody(this.session, this.builders.SessionEndedRequest(reason)))
  }

  Request (request: Types.RequestBody) {
    return this.execute(request).then(response => {
      this.session.new = false
      if (response && response.sessionAttributes && Object.getOwnPropertyNames(response.sessionAttributes).length > 0) {
        this.session.attributes = response.sessionAttributes
      }
      return response
    })
  }
}
