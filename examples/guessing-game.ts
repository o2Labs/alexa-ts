import * as Alexa from '../src/index'

interface GuessingState {
  Name: 'Guessing'
  Target: number
  Guesses: number
}

type State = { Name: 'NotStarted' } | GuessingState | { Name: 'Finished' }

const State = {
  startGuessing: () : GuessingState => ({
    Name: 'Guessing',
    Target: Math.round((Math.random() * 99) + 1),
    Guesses: 0,
  }),
  nextGuess: (state: GuessingState) : GuessingState => ({
    Name: 'Guessing',
    Target: state.Target,
    Guesses: state.Guesses + 1,
  }),
}

const startNewGame = () : Alexa.Response<State> => ({
  Say: { Text: 'Try and guess the number I\'m thinking of. It\'s between 1 and 100.' },
  NewState: State.startGuessing()
})

const checkGuess = (state: GuessingState, slots: Alexa.Slots) : Alexa.Response<State> => {
  let guess = slots.get('Guess')
  if (typeof guess === 'string') {
    guess = parseInt(guess, 10)
  }
  if (guess < state.Target) {
    return {
      Say: { Text: `Is it ${guess}? Nope, too low! Guess again.` },
      NewState: State.nextGuess(state),
    }
  } else if (guess > state.Target) {
    return {
      Say: { Text: `Is it ${guess}? Nope, too high! Guess again.` },
      NewState: State.nextGuess(state),
    }
  } else if (guess === state.Target) {
    return {
      Say: { Text: `Is it ${guess}? Yes! Congratulations, you guessed it in ${state.Guesses + 1} tries. Would you like to play again?`},
      NewState: { Name: 'Finished' }
    }
  } else {
    return { Say: { Text: 'Sorry, I couldn\'t tell what number you said.' } }
  }
}

const help = () : Alexa.Response<State> => ({
  Say: { Text: 'Guess a number between 1 and 100, or say "Stop".' }
})

const stop = () : Alexa.Response<State> => ({
  Say: { Text: '' },
  EndSession: true,
})

/** IntentSchema.json
 * {
 *   "intents": [
 *     {
 *       "intent": "GuessNumber",
 *       "slots": [{ "name": "Guess", "type": "AMAZON.NUMBER" }]
 *     },
 *     { "intent": "AMAZON.YesIntent" },
 *     { "intent": "AMAZON.NoIntent" },
 *     { "intent": "AMAZON.HelpIntent" },
 *     { "intent": "AMAZON.StopIntent" }
 *   ]
 * }
 *
 * Utterances.txt
 * GuessNumber I guess {Guess}
 * GuessNumber is it {Guess}
 * GuessNumber what about {Guess}
 * GuessNumber my guess is {Guess}
 * GuessNumber if the number is {Guess}
 * GuessNumber {Guess}
 */
const routes: Alexa.Routes<State> = {
  InitialState: { Name: 'NotStarted' },
  Launch: startNewGame,
  Standard: {
    Yes: (state) => {
      if (state.Name === 'Finished') {
        return startNewGame()
      } else {
        return help()
      }
    },
    No: (state) => {
      if (state.Name === 'Finished') {
        return stop()
      } else {
        return help()
      }
    },
    Help: help,
    Stop: stop,
  },
  Custom: [
    ["GuessNumber", (state, slots) => {
      if (state.Name === 'Guessing') {
        return checkGuess(state, slots)
      } else {
        return checkGuess(State.startGuessing(), slots)
      }
    }],
  ],
}

const unhandled = () => Alexa.response({
  Say: { Text: 'Sorry, I didn\'t get that, try saying a number.' }
}, null)

export const handler = Alexa.Lambda.pipe([ // To host in AWS lambda
  Alexa.Pipe.tracer(),
  Alexa.Pipe.router(routes),
  unhandled,
])
