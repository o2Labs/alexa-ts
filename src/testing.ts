import * as Types from './json-types'

const timestamp = () => "2017-03-03T13:53:57Z"
const userId = () => "amzn1.ask.account.FAKEACCOUNTID"
const requestId = () => "amzn1.echo-api.request.d15314a4-3a86-4d5a-90b0-5adb6a5b5ce7"
const sessionId = () => "amzn1.echo-api.session.bcea274f-0dd8-43ac-8369-e102f881b42e"
const applicationId = () => "amzn1.ask.skill.659a0b41-d887-45b0-a158-01b3d2214d5a"

const requestBody = (session: Types.Session, request: Types.Request) : Types.RequestBody => ({
  version: '1.0',
  session: session,
  request: request,
})

const launchRequest = () : Types.LaunchRequest => ({
  type: 'LaunchRequest',
  requestId: requestId(),
  timeStamp: timestamp(),
})

const intentRequest = (intent: string, slots?) : Types.IntentRequest => ({
  type: 'IntentRequest',
  requestId: requestId(),
  timeStamp: timestamp(),
  intent: {
    name: intent,
    slots: slots || {},
  },
})

const newSession = () : Types.Session => ({
  sessionId: sessionId(),
  application: {
    applicationId: applicationId(),
  },
  attributes: {},
  user: {
    userId: userId(),
    accessToken: null,
  },
  new: true,
})

export const lambdaContext = () => ({
  awsRequestId: 'e0aa9f2d-5f4a-4ae8-a7b9-bb1a79ed91f6',
  functionName: 'test-function',
  callbackWaitsForEmptyEventLoop: true,
  functionVersion: '$LATEST',
  invokeid: 'invokeid',
  logGroupName: 'logGroupName',
  logStreamName: 'logStreamName',
  memoryLimitInMB: '128',
})

type ExecuteRequest = (request: Types.RequestBody) => Promise<Types.ResponseBody>

export const configure =
  (handler: Types.AlexaLambda) : ExecuteRequest =>
    request =>
      new Promise((resolve, reject) =>
        handler(request, lambdaContext(), (err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res)
          }
        }))

export class Session {
  private execute: ExecuteRequest
  private session: Types.Session
  constructor (lambda: Types.AlexaLambda) {
    this.execute = configure(lambda)
    this.session = newSession()
  }

  LinkAccount (accessToken: string) {
    this.session.user.accessToken = accessToken
    return this
  }

  LaunchSkill () {
    return this.executeAndSaveState(requestBody(this.session, launchRequest()))
  }

  RequestIntent (name: string, slots?) {
    return this.executeAndSaveState(requestBody(this.session, intentRequest(name, slots)))
  }

  private executeAndSaveState (request) {
    return this.execute(request).then(response => {
      this.session.new = false
      if (response.sessionAttributes && Object.getOwnPropertyNames(response.sessionAttributes).length > 0) {
        this.session.attributes = response.sessionAttributes
      }
      return response
    })
  }
}
