import { RequestEnvelope } from 'ask-sdk-model'

export type AlexaLambda = (
  event: RequestEnvelope,
  context: Context,
  callback: (err: any, result?: any) => void,
) => any

export interface Context {
  callbackWaitsForEmptyEventLoop: boolean
  logGroupName: string
  logStreamName: string
  functionName: string
  memoryLimitInMB: string
  functionVersion: string
  invokeid: string
  awsRequestId: string
}
