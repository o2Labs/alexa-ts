import * as Alexa from '../src/index'
import { Session } from '../src/testing'

describe('counting skill', () => {
  const handler = Alexa.Lambda.router({
    InitialState: 0,
    Standard: {
      Next: (state): Alexa.Response<number> => ({
        Say: { Text: `${state}` },
        NewState: state + 1,
      }),
    },
  })

  it('keeps counting up each time you say "next"', () => {
    // Start a session within a test.
    const session = new Session(handler)

    return session
      .RequestIntent('AMAZON.NextIntent')
      .then(response => {
        // Perform another intent within the same session.
        return session.RequestIntent('AMAZON.NextIntent')
      })
      .then(response =>
        // Session state is maintained.
        expect(response.sessionAttributes['_alexaTsState']).toEqual(2),
      )
  })
})
