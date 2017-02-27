A lightweight framework for building Alexa skills.

## Motivations

- Support for promises (but you can also return synchronously too).
- More complex (and checked) session states.
- Pluggable middleware for dealing with cross-cutting concerns such as authorisation.
- More discoverable APIs with less magic strings.
- Simplified domain model, abstracted from the wire types.

## Building & Publishing

- Install Packages: `yarn`
- Publish: `yarn publish`
- Build & Test: `gulp build`
- Rebuild on changes: `gulp watch`

## [Examples](examples)

The [guessing game example](examples/guessing-game.ts) is a good demonstration of how to manage complex state ([JS version](examples/guessing-game.js)).

Here's a quick example demonstrating lots of the available featues:

```typescript
import * as Alexa from 'alexaish'

type State = 'Started' | 'Other'

const router: Alexa.Routes<State> = { // Type-checked state management
    InitialState: 'Started',
    Launch: () =>
        new Promise((resolve) => resolve({ // Can return promises
            Say: { Text: 'Hello world' }, // Low-ceremony responses
            NewState: 'Other' // Changing the state as part of the response
    })),
    SessionEnded: () => {
        console.log('Session ended')
    },
    Standard: { // Support for built-in standard intents
        Help: state => ({
            Say: { Text: 'Some help' }, // Can also return synchronously
        }),
        Stop: state => ({
            Say: { Text: 'Bye!' },
            EndSession: true, // Can end a session immediately (leaves open by default).
        })
    },
    Custom: [
        ["MyCustomIntent", (state, slots) => ({ // Support for custom intents
            Say: { Text: 'Something interesting' },
            EndSession: true,
        })],
    ],
}

const auth : Alexa.Handler = (event, next) => { // Define custom middleware for things like account linking
    if (event.session.user.accessToken) {
        // TODO: Perform custom authorisation
        return next(event)
    } else {
        return Alexa.response({}, {
            Say: { Text: 'Please link your account to use this skill.' },
            Card: { Type: 'LinkAccount' },
        })
    }
}

const unhandled : Alexa.Handler = (event) =>
    Alexa.response({}, { // Default unhandled response
        Say: { Text: "Sorry, I don't seem able to respond to that right now." },
        EndSession: true,
    })

export const handler = Alexa.Lambda.pipe([ // Host router as an AWS Lambda function
  Alexa.Pipe.tracer(), // Log all requests + responses to the console
  auth,
  Alexa.Pipe.router(routes),
  unhandled,
])
```
