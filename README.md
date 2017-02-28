A lightweight framework for building Alexa skills.

## Hello World

```typescript
import * as Alexa from 'alexa-ts'

export const handler = Alexa.Lambda.pipe([
  Alexa.Pipe.router({
    InitialState: null,
    Launch: () => ({
      Say: { Text: 'Hello world' },
    }),
    Standard: {
      Help: () => ({
        Say: { Text: 'Try saying "hello"' },
      }),
    },
    Custom: [
      ["HelloWorldIntent", (state, slots) => ({
        Say: { Text: 'Hello world' },
      })]
    ]
  }),
  () => // Unhandled requests
    Alexa.response(null, {
      Say: { Text: 'Sorry, I didn\'t understand.' },
    }),
])
```

## More Examples

- [The kitchen sink](examples/kitchen-sink.ts) - Shows off lots of the available features. ([JS version](examples/kitchen-sink.js))
- [Guessing game](examples/guessing-game.ts) - demonstrates managing complex state. ([JS version](examples/guessing-game.js))

## Features

### Typed-checked state management

When using the router component, the state used in all handlers must be of the same type.

Normally you'd want to specify the type of the state when creating the routes object:

You must also specify an initial state which is a constant value, which will be used whenever a new session is initiated. This is the only required field in the routing table.

```typescript
class CustomStateType {
  // Some fields etc
}

const routes: Alexa.Routes<CustomStateType> = {
  InitialState: new CustomStateType(),
}
```

### Piping

Compose your Alexa application out of smaller compoents which can be chained together into an execution pipeline using `Alexa.Lambda.pipe(steps)`, or use `Pipe.join(steps)` to just create a new pipe out of other pipe sections.

Examples of where this might be used are:

- Logging all requests and responses to your skill.
- Checking if account linking has been set up before executing the router.

Each pipe step is a function which is given the incoming request and a callback to execute the next step in the chain. The step must return a response (or throw an exception).

When calling the `next` you must pass the request. This allows steps in the chain to modify the original message for subsequent steps. You can also intercept the result of the next step before you can choose to return it, however, each step might return either a `ResponseBody` object, or a promise of the same type.

_Note: In the special case of the SessionEnded handler, `void` is returned. All other handlers must return a response._

### Promise Support

All of the IntentHandler, Handler and Pipe types can return either a value or a promise to return these values.

Here's an example of returning asynchronously within a handler.

```typescript
export const handler = Alexa.Lambda.handler(() =>
  getMessageAsync()
  .then(message =>
    Alexa.response({
      Say: { Text: message },
    })
  )
)
```

## Building & Publishing

- Install Packages: `yarn`
- Publish: `yarn publish`
- Build & Test: `gulp build`
- Rebuild on changes: `gulp watch`
