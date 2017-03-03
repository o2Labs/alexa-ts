// import 'mocha'
import * as Alexa from '../src/index'
import { assert } from 'chai'
import { Session } from '../src/testing'

describe('testing helpers', () => {

  it('maintains state during session', () => {
    const session = new Session(Alexa.Lambda.router({
      InitialState: 0,
      Standard: {
        Next: (state) : Alexa.Response<number> => ({
          Say: { Text: `${state}` },
          NewState: state + 1,
        })
      }
    }))

    return session
      .RequestIntent('AMAZON.NextIntent')
      .then((response) => {
        assert.equal(response.sessionAttributes['_alexaTsState'], 1)
        return session.RequestIntent('AMAZON.NextIntent')
      })
      .then((response) => {
        assert.equal(response.sessionAttributes['_alexaTsState'], 2)
        return session.RequestIntent('AMAZON.NextIntent')
      })
  })

})
