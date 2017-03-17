import * as Types from './json-types'

export type PromiseOrValue<T> = T | PromiseLike<T>

const isPromise = obj => (typeof obj !== 'undefined') && typeof obj.then === 'function'

const then = <T, U>(action: () => PromiseOrValue<T>, onFulfilled: (T) => PromiseOrValue<U>, onRejected?: (reason: any) => PromiseOrValue<U>): PromiseOrValue<U> => {
  try {
    const result = action()
    if (isPromise(result)) {
      return (result as PromiseLike<T>).then(onFulfilled, onRejected)
    } else {
      return onFulfilled(result)
    }
  } catch (err) {
    if (typeof onRejected !== 'undefined') {
      return onRejected(err)
    } else {
      throw err
    }
  }
}

export interface PromiseOrValueModule {
  /** Apply a transformation to the result of a promise or value */
  map: <T, U>(promiseOrValue: PromiseOrValue<T>, onFulfilled: (T) => PromiseOrValue<U>) => PromiseOrValue<U>
  /** Attach callbacks for the resolution/rejection of the result of the action */
  then: <T, U>(action: () => PromiseOrValue<T>, onFulfilled: (T) => PromiseOrValue<U>, onRejected?: (reason: any) => PromiseOrValue<U>) => PromiseOrValue<U>
  /** Handle errors thrown by the action */
  catch: <T>(action: () => PromiseOrValue<T>, onRejected: (reason: any) => T) => T
}

/** Functions for when a result may be either synchronous (a value) or asynchronous (a `Promise`) */
export const PromiseOrValue: PromiseOrValueModule = {
  map: <T, U>(promiseOrValue: PromiseOrValue<T>, onFulfilled: (T) => PromiseOrValue<U>) : PromiseOrValue<U> => {
    if (isPromise(promiseOrValue)) {
      return (promiseOrValue as PromiseLike<T>).then(onFulfilled)
    } else {
      return onFulfilled(promiseOrValue)
    }
  },

  then: then,

  catch: <T>(action: () => PromiseOrValue<T>, onRejected: (reason: any) => T) => {
    return then(action, x => x, onRejected)
  }
}

/**
 * An Alexa `Handler` takes a raw request and return a raw response either synchronously or asynchronously.
 *
 * _Only in the special case of the `SessionEnded` request, the response should be void._
 */
export type Handler =
  (event: Types.RequestBody) => PromiseOrValue<Types.ResponseBody | void>

/**
 * An Alexa Middleware `Pipe` is the same as the Alexa Handler with the addition of having the option of
 * calling the next step in the pipe.
 */
export type Pipe =
  (event: Types.RequestBody, next: Handler) =>
    PromiseOrValue<Types.ResponseBody | void>

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
export type Card = LinkAccount | {
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

export type HandlerResult<State> = PromiseOrValue<Response<State> | Types.ResponseBody | void>

/**
 * Mapping of the `name` of the slot to the `value`.
 *
 * _This uses the `name` property, not the slot key._
 */
export type Slots = Map<string, any>

export type IntentHandler<State> = (sessionState: State, slots: Slots, request: Types.RequestBody, next: Handler) => HandlerResult<State>

export interface StandardIntentRoutes<State> {
  /** Built-in AMAZON.CancelIntent. */
  Cancel?: IntentHandler<State>,
  /** Built-in AMAZON.HelpIntent. */
  Help?: IntentHandler<State>,
  /** Built-in AMAZON.LoopOffIntent. */
  LoopOff?: IntentHandler<State>,
  /** Built-in AMAZON.LoopOnIntent. */
  LoopOn?: IntentHandler<State>,
  /** Built-in AMAZON.NextIntent. */
  Next?: IntentHandler<State>,
  /** Built-in AMAZON.NoIntent. */
  No?: IntentHandler<State>,
  /** Built-in AMAZON.PauseIntent. */
  Pause?: IntentHandler<State>,
  /** Built-in AMAZON.PreviousIntent. */
  Previous?: IntentHandler<State>,
  /** Built-in AMAZON.RepeatIntent. */
  Repeat?: IntentHandler<State>,
  /** Built-in AMAZON.ResumeIntent. */
  Resume?: IntentHandler<State>,
  /** Built-in AMAZON.ShuffleOffIntent. */
  ShuffleOff?: IntentHandler<State>,
  /** Built-in AMAZON.ShuffleOnIntent. */
  ShuffleOn?: IntentHandler<State>,
  /** Built-in AMAZON.StartOverIntent. */
  StartOver?: IntentHandler<State>,
  /** Built-in AMAZON.StopIntent. */
  Stop?: IntentHandler<State>,
  /** Built-in AMAZON.YesIntent. */
  Yes?: IntentHandler<State>,
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

const makeSpeech = (speech: Speech) : Types.OutputSpeech => {
  if (typeof speech.SSML !== 'undefined') {
    return {
      type: 'SSML',
      ssml: speech.SSML
    }
  } else if (typeof speech.Text !== 'undefined') {
    return {
      type: 'PlainText',
      text: speech.Text
    }
  } else {
    return undefined
  }
}

const makeCard = (card: Card) : Types.Card => {
  if (card.Type === 'LinkAccount') {
    return {
      type: 'LinkAccount',
    }
  } else if ('Image' in card) {
    return {
      type: 'Standard',
      title: card.Title,
      text: card.Content,
      image: {
        largeImageUrl: card.Image.LargeUrl,
        smallImageUrl: card.Image.SmallUrl,
      }
    }
  } else {
    return {
      type: 'Simple',
      title: card.Title,
      content: card.Content,
    }
  }
}

const makeResponse = (response: Response<any>) : Types.Response => {
  const output: Types.Response = {
    shouldEndSession: response.EndSession || false
  }

  if ('Say' in response) {
    const speech = makeSpeech(response.Say)
    if (typeof speech !== 'undefined') {
      output.outputSpeech = speech
    }
  }

  if ('Reprompt' in response) {
    const speech = makeSpeech(response.Reprompt)
    if (typeof speech !== 'undefined') {
      output.reprompt = { outputSpeech: speech }
    }
  }

  if ('Card' in response) {
    output.card = makeCard(response.Card)
  }

  return output
}

export interface StateModule {
  /** The string key used to store state from AlexaTs in the Alexa session attributes */
  attributeKey: string
  /** Get the state (if available) from the request, otherwise return the initial state. */
  fromRequest: <State>(request: Types.RequestBody, initialState?: State) => State
}

/** Functions for accessing raw AlexaTs state */
export const State: StateModule = {
  attributeKey: '_alexaTsState',

  fromRequest: <State>(request: Types.RequestBody, initialState?: State) => {
    if (request && request.session && request.session.attributes && State.attributeKey in request.session.attributes) {
      return request.session.attributes[State.attributeKey]
    } else {
      return initialState
    }
  },
}

const sessionAttributesFromResponse = <State>(response: Response<State>, previousState?: State) => {
  let sessionAttributes: any = {}
  if ('NewState' in response) {
    sessionAttributes[State.attributeKey] = response.NewState
  } else if (typeof previousState !== 'undefined') {
    sessionAttributes[State.attributeKey] = previousState
  }
  return sessionAttributes
}

/** Expand a short-hand `Response` into a raw Alexa `ResponseBody` */
export const response = <State>(response: Response<State>, previousState?: State) : Types.ResponseBody => {
  return {
    version: '1.0',
    response: makeResponse(response),
    sessionAttributes: sessionAttributesFromResponse(response, previousState),
  }
}

const handlerObjToMap = <State>(obj) => {
  const map = new Map<string, IntentHandler<State>>()
  Object.keys(obj).forEach(key => map.set(`AMAZON.${key}Intent`, obj[key]))
  return map
}

const slotsToMap = (slots) : Slots => {
  const map = new Map<string, any>()
  if (slots instanceof Object) {
    Object.keys(slots).forEach(key => map.set(slots[key].name, slots[key].value))
  }
  return map
}

const buildRequestIfNeeded = <State>(outputOrResponse: Response<State> | Types.ResponseBody, previousState: State) => {
  if ('Say' in outputOrResponse) {
    return response(outputOrResponse as Response<State>, previousState)
  } else {
    return outputOrResponse as Types.ResponseBody
  }
}

const mapIntentResult = <State>(result: HandlerResult<State>, state: State) =>
  PromiseOrValue.map(result, output => buildRequestIfNeeded(output, state))

const router = <State>(routes: Routes<State>) : Pipe => {
  const standardIntents = handlerObjToMap(routes.Standard || {})
  const customIntents = new Map(routes.Custom || [])
  return (event, next) => {
    const state = State.fromRequest(event, routes.InitialState)
    switch (event.request.type) {
      case 'LaunchRequest':
        if ('Launch' in routes) {
          return mapIntentResult(routes.Launch(state, new Map<string, any>(), event, next), state)
        }
        break
      case 'SessionEndedRequest': // Special case - can't respond.
        if ('SessionEnded' in routes) {
          return routes.SessionEnded()
        }
        break
      case 'IntentRequest':
        const intentRequest = event.request as Types.IntentRequest
        const slots = slotsToMap(intentRequest.intent.slots)

        if (standardIntents.has(intentRequest.intent.name)) {
          const handler = standardIntents.get(intentRequest.intent.name)
          return mapIntentResult(handler(state, slots, event, next), state)
        }

        if (customIntents.has(intentRequest.intent.name)) {
          const handler = customIntents.get(intentRequest.intent.name)
          return mapIntentResult(handler(state, slots, event, next), state)
        }
    }

    return next(event)
  }
}

/** Functions for creating and composing middleware `Pipe`s */
export interface PipeModule {
  /** Create a pipe by calling a series of child pipes. */
  join: (steps: Pipe[]) => Pipe

  /** Handle specific request types and intents. */
  router: <State>(routes: Routes<State>) => Pipe

  /** Catch and handle errors from subsequent handlers. */
  catch: (onError: ((error: any) => any)) => Pipe

  /** Log the incoming request and the response or error thrown by the subsequent handlers. */
  tracer: (logger?: (message: string, obj: any) => void) => Pipe

  /** Just call the next step in the pipe. */
  doNothing: () => Pipe

  /** Convert a pipe into a handler. */
  toHandler: (pipe: Pipe) => Handler
}

export const Pipe: PipeModule = {
  join: (steps: Pipe[]) : Pipe =>
    (event, next) => {
      const processNext = (remainingHandlers: Pipe[]) => (event) => {
        if (remainingHandlers.length === 0) {
          if (typeof next !== 'undefined') {
            return next(event)
          }
        } else {
          const nextHandler = remainingHandlers[0]
          const newRemaining = remainingHandlers.slice(1)
          return nextHandler(event, processNext(newRemaining))
        }
      }
      return processNext(steps)(event)
    },

  toHandler: (pipe: Pipe) : Handler => event =>
    pipe(event, () => { throw new Error('Event unhandled') }),

  router: router,

  catch: (onError) : Pipe => (request, next) =>
    PromiseOrValue.catch(() => next(request), onError),

  tracer: (logger?: (message: string, obj: any) => void) : Pipe => {
    if (typeof logger === 'undefined') {
      logger = (message, obj) => console.log(message, JSON.stringify(obj))
    }
    return (event, next) => {
      logger('Request:', event)
      try {
        const result = next(event)
        if (isPromise(result)) {
          return (result as PromiseLike<Types.ResponseBody>).then((response) => {
            logger('Response:', response)
            return response
          }, (error) => {
            logger('Error:', error.toString())
            throw error
          })
        } else {
          logger('Response:', result)
          return result
        }
      } catch (error) {
        logger('Error:', error.toString())
        throw error
      }
    }
  },

  doNothing: () : Pipe => (event, next) => next(event),
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
  router: <State>(routes: Routes<State>) : Handler => Pipe.toHandler(router(routes)),
  pipe: (steps: Pipe[]) : Handler => Pipe.toHandler(Pipe.join(steps)),
}

const lambdaFromHandler = (handler: Handler) : Types.AlexaLambda =>
  (event, context, callback) => {
    PromiseOrValue.then(() => handler(event), data => callback(null, data), callback)
  }

/** Functions for creating an AWS lambda handler */
export interface LambdaModule {
  /** Create a lambda handler from an Alexa Handler */
  handler: (handler: Handler) => Types.AlexaLambda
  /** Create a lambda handler from request & intent routes */
  router: <State>(routes: Routes<State>) => Types.AlexaLambda
  /** Create a lambda handler from a middleware pipeline */
  pipe: (steps: Pipe[]) => Types.AlexaLambda
}

/** Functions for creating an AWS lambda handler */
export const Lambda: LambdaModule = {
  handler: lambdaFromHandler,
  router: <State>(routes: Routes<State>) => lambdaFromHandler(Handler.router(routes)),
  pipe: (steps: Pipe[]) => lambdaFromHandler(Handler.pipe(steps))
}
