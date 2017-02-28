import * as Alexa from '../src/index'

type State = 'Started' | 'Other'

const routes: Alexa.Routes<State> = { // Type-checked state management
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
      Say: { SSML: '<speak> try saying <emphasis>hello</emphasis> </speak>' }, // Can also return synchronously or using SSML
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

const auth: Alexa.Pipe = (event, next) => { // Define custom middleware for things like account linking
  if (event.session.user.accessToken) {
    // TODO: Perform custom authorisation
    return next(event)
  } else {
    return Alexa.response({
      Say: { Text: 'Please link your account to use this skill.' },
      Card: { Type: 'LinkAccount' },
    })
  }
}

const unhandled: Alexa.Handler = (event) =>
  Alexa.response({ // Default unhandled response
    Say: { Text: "Sorry, I don't seem able to respond to that right now." },
    EndSession: true,
  })

export const handler = Alexa.Lambda.pipe([ // Host router as an AWS Lambda function
  Alexa.Pipe.tracer(), // Log all requests + responses to the console
  auth,
  Alexa.Pipe.router(routes),
  unhandled,
])
