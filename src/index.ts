import * as Types from './json-types'

export type PromiseOrValue<T> = T | PromiseLike<T>

const isPromise = (obj: any) =>
  typeof obj !== 'undefined' && typeof obj.then === 'function'

/** Functions for when a result may be either synchronous (a value) or asynchronous (a `Promise`) */
export namespace PromiseOrValue {
  /** Apply a transformation to the result of a promise or value */
  export function map<T, U>(
    promiseOrValue: PromiseOrValue<T>,
    onFulfilled: (value: T) => PromiseOrValue<U>,
  ): PromiseOrValue<U> {
    if (isPromise(promiseOrValue)) {
      return (promiseOrValue as PromiseLike<T>).then(onFulfilled)
    } else {
      return onFulfilled(promiseOrValue as T)
    }
  }

  /** Attach callbacks for the resolution/rejection of the result of the action */
  export function then<T, U>(
    action: () => PromiseOrValue<T>,
    onFulfilled: (value: T) => PromiseOrValue<U>,
    onRejected?: (reason: any) => PromiseOrValue<U>,
  ): PromiseOrValue<U> {
    try {
      const result = action()
      if (isPromise(result)) {
        return (result as PromiseLike<T>).then(onFulfilled, onRejected)
      } else {
        return onFulfilled(result as T)
      }
    } catch (err) {
      if (typeof onRejected !== 'undefined') {
        return onRejected(err)
      } else {
        throw err
      }
    }
  }

  /** Handle errors thrown by the action */
  export function catchErr<T>(
    action: () => PromiseOrValue<T>,
    onRejected: (reason: any) => T,
  ): PromiseOrValue<T> {
    return then(action, x => x, onRejected)
  }

  /** Turn a promise or value into a promise */
  export function asPromise<T>(
    promiseOrValue: PromiseOrValue<T>,
  ): PromiseLike<T> {
    if (isPromise(promiseOrValue)) {
      return promiseOrValue as PromiseLike<T>
    } else {
      return Promise.resolve(promiseOrValue as T)
    }
  }
}

/**
 * An Alexa `Handler` takes a raw request and return a raw response either synchronously or asynchronously.
 *
 * _Only in the special case of the `SessionEnded` request, the response should be void._
 */
export type Handler = (
  event: Types.RequestBody,
) => PromiseOrValue<Types.ResponseBody | void>

/**
 * An Alexa Middleware `Pipe` is the same as the Alexa Handler with the addition of having the option of
 * calling the next step in the pipe.
 */
export type Pipe = (
  event: Types.RequestBody,
  next: Handler,
) => PromiseOrValue<Types.ResponseBody | void>

/**
 * The words to be spoken.
 *
 * _If `SSML` is specified, the `Text` will be ignored._
 */
export interface Speech {
  Text?: string
  SSML?: string
}

export interface LinkAccount {
  Type: 'LinkAccount'
}

export interface CardImage {
  /** 720w x 480h */
  SmallUrl: string
  /** 1200w x 800h */
  LargeUrl: string
}

/**
 * Short-hand model for cards. _The `Type` can either be `LinkAccount` or `Card`._
 *
 * _This infers if the card is "Simple" or "Standard" based on the use of the `Image` property._
 */
export type Card =
  | LinkAccount
  | {
      Type: 'Card'
      /** Title of the card */
      Title: string
      /**
       * A string containing the text content.
       *
       * _New lines can be added with either `\n` or `\r\n`._
       */
      Content: string
      /** Optional image to be displayed */
      Image?: CardImage
    }

/** Short-hand response from an intent or launch request */
export interface Response<State> {
  Say?: Speech
  NewState?: State
  Reprompt?: Speech
  Card?: Card
  EndSession?: boolean
}

export type HandlerResult<State> = PromiseOrValue<
  Response<State> | Types.ResponseBody | void
>

/**
 * Mapping of the `name` of the slot to the `value`.
 *
 * _This uses the `name` property, not the slot key._
 */
export type Slots = Map<string, any>

export type IntentHandler<State> = (
  sessionState: State,
  slots: Slots,
  request: Types.RequestBody,
  next: Handler,
) => HandlerResult<State>

export interface StandardIntentRoutes<State> {
  /** Built-in AMAZON.CancelIntent. */
  Cancel?: IntentHandler<State>
  /** Built-in AMAZON.HelpIntent. */
  Help?: IntentHandler<State>
  /** Built-in AMAZON.LoopOffIntent. */
  LoopOff?: IntentHandler<State>
  /** Built-in AMAZON.LoopOnIntent. */
  LoopOn?: IntentHandler<State>
  /** Built-in AMAZON.NextIntent. */
  Next?: IntentHandler<State>
  /** Built-in AMAZON.NoIntent. */
  No?: IntentHandler<State>
  /** Built-in AMAZON.PauseIntent. */
  Pause?: IntentHandler<State>
  /** Built-in AMAZON.PreviousIntent. */
  Previous?: IntentHandler<State>
  /** Built-in AMAZON.RepeatIntent. */
  Repeat?: IntentHandler<State>
  /** Built-in AMAZON.ResumeIntent. */
  Resume?: IntentHandler<State>
  /** Built-in AMAZON.ShuffleOffIntent. */
  ShuffleOff?: IntentHandler<State>
  /** Built-in AMAZON.ShuffleOnIntent. */
  ShuffleOn?: IntentHandler<State>
  /** Built-in AMAZON.StartOverIntent. */
  StartOver?: IntentHandler<State>
  /** Built-in AMAZON.StopIntent. */
  Stop?: IntentHandler<State>
  /** Built-in AMAZON.YesIntent. */
  Yes?: IntentHandler<State>
}

export interface Routes<State> {
  /** Default state when no state has yet been specified. */
  InitialState: State
  /** Executed when the skill is started without an intent. */
  Launch?: IntentHandler<State>
  /** Executed after a session was ended (e.g. by the user saying "stop" or not responding. */
  SessionEnded?: () => PromiseOrValue<void>
  /** Standard built-in intents. */
  Standard?: StandardIntentRoutes<State>
  /** Custom named intent handlers. */
  Custom?: Iterable<[string, IntentHandler<State>]>
}

const makeSpeech = (speech: Speech): Types.OutputSpeech | undefined => {
  if (typeof speech.SSML !== 'undefined') {
    return {
      type: 'SSML',
      ssml: speech.SSML,
    }
  } else if (typeof speech.Text !== 'undefined') {
    return {
      type: 'PlainText',
      text: speech.Text,
    }
  } else {
    return undefined
  }
}

const makeCard = (card: Card): Types.Card => {
  if (card.Type === 'LinkAccount') {
    return {
      type: 'LinkAccount',
    }
  }
  if (card.Image !== undefined) {
    return {
      type: 'Standard',
      title: card.Title,
      text: card.Content,
      image: {
        largeImageUrl: card.Image.LargeUrl,
        smallImageUrl: card.Image.SmallUrl,
      },
    }
  }
  return {
    type: 'Simple',
    title: card.Title,
    content: card.Content,
  }
}

const makeResponse = (response: Response<any>): Types.Response => {
  const output: Types.Response = {
    shouldEndSession: response.EndSession || false,
  }

  if (response.Say !== undefined) {
    const speech = makeSpeech(response.Say)
    if (typeof speech !== 'undefined') {
      output.outputSpeech = speech
    }
  }

  if (response.Reprompt !== undefined) {
    const speech = makeSpeech(response.Reprompt)
    if (typeof speech !== 'undefined') {
      output.reprompt = { outputSpeech: speech }
    }
  }

  if (response.Card !== undefined) {
    output.card = makeCard(response.Card)
  }

  return output
}

/** Functions for accessing raw AlexaTs state */
export namespace State {
  /** The string key used to store state from AlexaTs in the Alexa session attributes */
  export const attributeKey = '_alexaTsState'

  /** Get the state (if available) from the request, otherwise return the initial state. */
  export function fromRequest<State>(
    request: Types.RequestBody,
    initialState: State,
  ): State {
    if (
      request &&
      request.session &&
      request.session.attributes &&
      State.attributeKey in request.session.attributes
    ) {
      return request.session.attributes[State.attributeKey]
    } else {
      return initialState
    }
  }
}

const sessionAttributesFromResponse = <State>(
  response: Response<State>,
  previousState?: State,
) => {
  let sessionAttributes: any = {}
  if ('NewState' in response) {
    sessionAttributes[State.attributeKey] = response.NewState
  } else if (typeof previousState !== 'undefined') {
    sessionAttributes[State.attributeKey] = previousState
  }
  return sessionAttributes
}

/** Expand a short-hand `Response` into a raw Alexa `ResponseBody` */
export const response = <State>(
  response: Response<State>,
  previousState?: State,
): Types.ResponseBody => {
  return {
    version: '1.0',
    response: makeResponse(response),
    sessionAttributes: sessionAttributesFromResponse(response, previousState),
  }
}

const handlerObjToMap = <State>(obj: any) => {
  const map = new Map<string, IntentHandler<State>>()
  Object.keys(obj).forEach(key => map.set(`AMAZON.${key}Intent`, obj[key]))
  return map
}

const slotsToMap = (slots: any): Slots => {
  const map = new Map<string, any>()
  if (slots instanceof Object) {
    Object.keys(slots).forEach(key =>
      map.set(slots[key].name, slots[key].value),
    )
  }
  return map
}

const buildRequestIfNeeded = <State>(
  outputOrResponse: void | Response<State> | Types.ResponseBody,
  previousState: State,
) => {
  if (typeof outputOrResponse !== 'object') {
    return
  }
  if (outputOrResponse['Say'] !== undefined) {
    return response(outputOrResponse as Response<State>, previousState)
  } else {
    return outputOrResponse as Types.ResponseBody
  }
}

const mapIntentResult = <State>(result: HandlerResult<State>, state: State) =>
  PromiseOrValue.map(result, output => buildRequestIfNeeded(output, state))

/** Functions for creating and composing middleware `Pipe`s */
export namespace Pipe {
  /** Create a pipe by calling a series of child pipes. */
  export const join = (steps: Pipe[]): Pipe => (event, next) => {
    const processNext = (remainingHandlers: Pipe[]) => (
      event: Types.RequestBody,
    ): PromiseOrValue<Types.ResponseBody | void> => {
      if (remainingHandlers.length === 0) {
        if (typeof next !== 'undefined') {
          return next(event)
        } else {
          throw new Error('Event unhandled')
        }
      } else {
        const nextHandler = remainingHandlers[0]
        const newRemaining = remainingHandlers.slice(1)
        return nextHandler(event, processNext(newRemaining))
      }
    }
    return processNext(steps)(event)
  }

  /** Convert a pipe into a handler. */
  export const toHandler = (pipe: Pipe): Handler => event =>
    pipe(event, () => {
      throw new Error('Event unhandled')
    })

  /** Handle specific request types and intents. */
  export const router = <State>(routes: Routes<State>): Pipe => {
    const standardIntents = handlerObjToMap(routes.Standard || {})
    const customIntents = new Map(routes.Custom || [])
    return (event, next) => {
      const state = State.fromRequest(event, routes.InitialState)
      switch (event.request.type) {
        case 'LaunchRequest':
          if (routes.Launch !== undefined) {
            return mapIntentResult(
              routes.Launch(state, new Map<string, any>(), event, next),
              state,
            )
          }
          break
        case 'SessionEndedRequest': // Special case - can't respond.
          if (routes.SessionEnded !== undefined) {
            return routes.SessionEnded()
          }
          return
        case 'IntentRequest':
          const intentRequest = event.request as Types.IntentRequest
          const slots = slotsToMap(intentRequest.intent.slots)

          const standardHandler = standardIntents.get(intentRequest.intent.name)
          if (standardHandler !== undefined) {
            return mapIntentResult(
              standardHandler(state, slots, event, next),
              state,
            )
          }

          const customHandler = customIntents.get(intentRequest.intent.name)
          if (customHandler !== undefined) {
            return mapIntentResult(
              customHandler(state, slots, event, next),
              state,
            )
          }
      }

      return next(event)
    }
  }

  /** Catch and handle errors from subsequent handlers. */
  export const catchErr = (onError: ((error: any) => any)): Pipe => (
    request,
    next,
  ) => PromiseOrValue.catchErr(() => next(request), onError)

  /** Log the incoming request and the response or error thrown by the subsequent handlers. */
  export const tracer = (
    logger?: (message: string, obj: any) => void,
  ): Pipe => {
    const log =
      logger !== undefined
        ? logger
        : (message: string, obj: any) =>
            console.log(message, JSON.stringify(obj))
    return (event, next) => {
      log('Request:', event)
      try {
        const result = next(event)
        if (isPromise(result)) {
          return (result as PromiseLike<Types.ResponseBody>).then(
            response => {
              log('Response:', response)
              return response
            },
            error => {
              log('Error:', error.toString())
              throw error
            },
          )
        } else {
          log('Response:', result)
          return result
        }
      } catch (error) {
        log('Error:', error.toString())
        throw error
      }
    }
  }

  /** Just call the next step in the pipe. */
  export const doNothing = (): Pipe => (event, next) => next(event)
}

/** Functions for creating an Alexa handler */
export interface HandlerModule {
  /** Create a handler from a middleware pipeline */
  middleware: (pipe: Pipe) => Handler
  /** Create a handler from request & intent routes */
  router: <State>(routes: Routes<State>) => Handler
  /** Create a handler from middleware pipeline steps */
  pipe: (steps: Pipe[]) => Handler
}

export const Handler: HandlerModule = {
  middleware: Pipe.toHandler,
  router: <State>(routes: Routes<State>): Handler =>
    Pipe.toHandler(Pipe.router(routes)),
  pipe: (steps: Pipe[]): Handler => Pipe.toHandler(Pipe.join(steps)),
}

const lambdaFromHandler = (handler: Handler): Types.AlexaLambda => (
  event,
  context,
  callback,
) => {
  PromiseOrValue.then(
    () => handler(event),
    data => callback(null, data),
    callback,
  )
}

/** Functions for creating an AWS lambda handler */
export namespace Lambda {
  /** Create a lambda handler from an Alexa Handler */
  export const handler = lambdaFromHandler

  /** Create a lambda handler from request & intent routes */
  export const router = <State>(routes: Routes<State>) =>
    lambdaFromHandler(Handler.router(routes))

  /** Create a lambda handler from a middleware pipeline */
  export const pipe = (steps: Pipe[]) => lambdaFromHandler(Handler.pipe(steps))
}
