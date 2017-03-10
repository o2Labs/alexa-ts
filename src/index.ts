import * as Types from './json-types'

export type PromiseOrValue<T> = T | Promise<T>

export const PromiseOrValue = Object.freeze({
  map: <T, U>(promiseOrValue: PromiseOrValue<T>, onFulfilled: (T) => PromiseOrValue<U>) : PromiseOrValue<U> => {
    if (promiseOrValue instanceof Promise) {
      return promiseOrValue.then(onFulfilled)
    } else {
      return onFulfilled(promiseOrValue)
    }
  }
})

export type Handler =
  (event: Types.RequestBody) => PromiseOrValue<Types.ResponseBody | void>

export type Pipe =
  (event: Types.RequestBody, next: Handler) =>
    PromiseOrValue<Types.ResponseBody | void>

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

export type Card = LinkAccount | {
  Type: 'Card'
  Title: string
  Content: string
  Image?: CardImage
}

export interface Response<State> {
  Say?: Speech
  NewState?: State
  Reprompt?: Speech
  Card?: Card
  EndSession?: boolean
}

export type HandlerResult<State> = PromiseOrValue<Response<State> | Types.ResponseBody | void>

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
    throw new Error('Speech contains neither text nor SSML.')
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
    output.outputSpeech = makeSpeech(response.Say)
  }

  if ('Reprompt' in response) {
    output.reprompt = {
      outputSpeech: makeSpeech(response.Reprompt)
    }
  }

  if ('Card' in response) {
    output.card = makeCard(response.Card)
  }

  return output
}

export const State = Object.freeze({
  attributeKey: '_alexaTsState',

  fromRequest: <State>(request: Types.RequestBody, initialState?: State) => {
    if (request && request.session && request.session.attributes && State.attributeKey in request.session.attributes) {
      return request.session.attributes[State.attributeKey]
    } else {
      return initialState
    }
  },
})

const sessionAttributesFromResponse = <State>(response: Response<State>, previousState?: State) => {
  let sessionAttributes: any = {}
  if ('NewState' in response) {
    sessionAttributes[State.attributeKey] = response.NewState
  } else if (typeof previousState !== 'undefined') {
    sessionAttributes[State.attributeKey] = previousState
  }
  return sessionAttributes
}

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

export const Pipe = Object.freeze({
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

  tracer: (logger?: (message: string, obj: any) => void) : Pipe => {
    if (typeof logger === 'undefined') {
      logger = (message, obj) => console.log(message, JSON.stringify(obj))
    }
    return (event, next) => {
      logger('Request:', event)
      try {
        const result = next(event)
        if (result instanceof Promise) {
          return result.then((response) => {
            logger('Response:', response)
            return response
          }).catch((error) => {
            logger('Error:', error)
            throw error
          })
        } else {
          logger('Response:', result)
          return result
        }
      } catch (error) {
        logger('Error:', error)
        throw error
      }
    }
  },

  doNothing: () : Pipe => (event, next) => next(event),
})

export const Handler = Object.freeze({
  middleware: Pipe.toHandler,
  router: <State>(routes: Routes<State>) : Handler => Pipe.toHandler(router(routes)),
  pipe: (steps: Pipe[]) : Handler => Pipe.toHandler(Pipe.join(steps)),
})

const lambdaFromHandler = (handler: Handler) : Types.AlexaLambda =>
  (event, context, callback) => {
    try {
      const promish = handler(event)
      if (promish instanceof Promise) {
        promish.then(data => callback(null, data))
        .catch(callback)
      } else {
        callback(null, promish)
      }
    } catch (err) {
      callback(err)
    }
  }

export const Lambda = Object.freeze({
  handler: lambdaFromHandler,
  router: <State>(routes: Routes<State>) => lambdaFromHandler(Handler.router(routes)),
  pipe: (steps: Pipe[]) => lambdaFromHandler(Handler.pipe(steps))
})
