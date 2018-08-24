import * as ask from 'ask-sdk-model'
import { Context, AlexaLambda } from './json-types'

/**
 * Helpers to create various fake things for Alexa requests.
 */
export const Fake = Object.freeze({
  timestamp: () => new Date().toISOString(),
  locale: () => 'en-GB',
  userId: () => 'amzn1.ask.account.FAKEACCOUNTID',
  requestId: () =>
    'amzn1.echo-api.request.d15314a4-3a86-4d5a-90b0-5adb6a5b5ce7',
  sessionId: () =>
    'amzn1.echo-api.session.bcea274f-0dd8-43ac-8369-e102f881b42e',
  applicationId: () => 'amzn1.ask.skill.659a0b41-d887-45b0-a158-01b3d2214d5a',

  /**
   * Create a version 1.0 Alexa request
   */
  requestBody: (
    session: ask.Session,
    request: ask.Request,
    context: ask.Context,
  ): ask.RequestEnvelope => ({
    version: '1.0',
    session: session,
    request: request,
    context: context,
  }),

  launchRequest: (): ask.LaunchRequest => ({
    type: 'LaunchRequest',
    requestId: Fake.requestId(),
    timestamp: Fake.timestamp(),
    locale: Fake.locale(),
  }),

  intentRequest: (intent: string, slots?: any): ask.IntentRequest => ({
    type: 'IntentRequest',
    requestId: Fake.requestId(),
    timestamp: Fake.timestamp(),
    dialogState: 'COMPLETED',
    locale: Fake.locale(),
    intent: {
      name: intent,
      slots: slots || {},
      confirmationStatus: 'NONE',
    },
  }),

  sessionEnded: (reason?: ask.SessionEndedReason): ask.SessionEndedRequest => ({
    type: 'SessionEndedRequest',
    reason: reason || 'USER_INITIATED',
    requestId: Fake.requestId(),
    timestamp: Fake.timestamp(),
    locale: Fake.locale(),
  }),

  session: (): ask.Session => ({
    sessionId: Fake.sessionId(),
    application: {
      applicationId: Fake.applicationId(),
    },
    attributes: {},
    user: {
      userId: Fake.userId(),
    },
    new: true,
  }),

  requestContext: (): ask.Context => ({
    AudioPlayer: {
      playerActivity: 'IDLE',
    },
    System: {
      apiEndpoint: 'https://api.amazonalexa.com',
      application: {
        applicationId: Fake.applicationId(),
      },
      device: {
        deviceId: 'string',
        supportedInterfaces: {
          AudioPlayer: {},
        },
      },
      user: {
        userId: Fake.userId(),
        accessToken: undefined,
      },
    },
  }),

  lambdaContext: (): Context => ({
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

type ExecuteRequest = (
  request: ask.RequestEnvelope,
) => Promise<ask.ResponseEnvelope>

export const configure = (
  handler: AlexaLambda,
  lambdaContext?: Context,
): ExecuteRequest => {
  const lambdaContextOrDefault =
    typeof lambdaContext === 'undefined' ? Fake.lambdaContext() : lambdaContext

  return request =>
    new Promise((resolve, reject) =>
      handler(request, lambdaContextOrDefault, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      }),
    )
}

export interface Builders {
  LaunchRequest: () => ask.LaunchRequest
  IntentRequest: (name: string, slots?: any) => ask.IntentRequest
  SessionEndedRequest: (
    reason?: ask.SessionEndedReason,
  ) => ask.SessionEndedRequest
  Session: () => ask.Session
  Context: () => ask.Context
}

const defaultBuilders = (): Builders => ({
  LaunchRequest: Fake.launchRequest,
  IntentRequest: Fake.intentRequest,
  SessionEndedRequest: Fake.sessionEnded,
  Session: Fake.session,
  Context: Fake.requestContext,
})

const extendBuilders = (custom?: Partial<Builders>): Builders => {
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
  private session: ask.Session
  private builders: Builders
  private context: ask.Context

  /**
   * Start a new session
   * @param lambda Alexa lambda function to test.
   * @param builders Optional custom builders to be used.
   */
  constructor(lambda: AlexaLambda, builders?: Partial<Builders>) {
    this.execute = configure(lambda)
    this.builders = extendBuilders(builders)
    this.session = this.builders.Session()
    this.context = this.builders.Context()
    this.context.System.user = this.session.user
  }

  LinkAccount(accessToken: string) {
    this.session.user.accessToken = accessToken
    return this
  }

  LaunchSkill() {
    return this.Request(
      Fake.requestBody(
        this.session,
        this.builders.LaunchRequest(),
        this.context,
      ),
    )
  }

  RequestIntent(name: string, slots?: any) {
    return this.Request(
      Fake.requestBody(
        this.session,
        this.builders.IntentRequest(name, slots),
        this.context,
      ),
    )
  }

  EndSession(reason?: ask.SessionEndedReason) {
    return this.Request(
      Fake.requestBody(
        this.session,
        this.builders.SessionEndedRequest(reason),
        this.context,
      ),
    )
  }

  Request(request: ask.RequestEnvelope) {
    return this.execute(request).then(response => {
      this.session.new = false
      if (
        response &&
        response.sessionAttributes &&
        Object.getOwnPropertyNames(response.sessionAttributes).length > 0
      ) {
        this.session.attributes = response.sessionAttributes
      }
      return response
    })
  }
}
