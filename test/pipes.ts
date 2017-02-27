// import 'mocha'
import * as Alexa from '../src/index'
import { assert } from 'chai'
import * as helpers from '../src/testing'

describe('Creating pipes', () => {
  const expectedResult = {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: 'Expected',
      },
      shouldEndSession: false
    },
    sessionAttributes: {
      _alexaTsState: 'ExpectedState'
    }
  }

  it('can pass-through synchronously', () =>
    helpers.executeLambda(
      Alexa.Lambda.pipe([
        (event, next) => next(event),
        (event) => Alexa.response('ExpectedState', { Say: { Text: 'Expected' } }),
      ]),
      {
        version: '1.0',
        session: helpers.makeUnauthorisedSession(),
        request: helpers.makeRequest(),
      }
    ).then((response) => {
      assert.deepEqual(response, expectedResult)
    })
  )

  it('can not execute next step', () =>
    helpers.executeLambda(
      Alexa.Lambda.pipe([
        (event) => Alexa.response('ExpectedState', { Say: { Text: 'Expected' } }),
        (event) => Alexa.response('OtherState', { Say: { Text: 'Not Expected' } }),
      ]),
      {
        version: '1.0',
        session: helpers.makeUnauthorisedSession(),
        request: helpers.makeRequest(),
      }
    ).then((response) => {
      assert.deepEqual(response, expectedResult)
    })
  )

  it('can pass-through asynchronously', () =>
    helpers.executeLambda(
      Alexa.Lambda.pipe([
        (event, next) => Promise.resolve(next(event)),
        (event) => Promise.resolve(Alexa.response('ExpectedState', { Say: { Text: 'Expected' } })),
      ]),
      {
        version: '1.0',
        session: helpers.makeUnauthorisedSession(),
        request: helpers.makeRequest(),
      }
    ).then((response) =>
      assert.deepEqual(response, expectedResult)
    )
  )

  it('throws an error when unhandled', (done) => {
    helpers.executeLambda(
      Alexa.Lambda.pipe([
        (event, next) => next(event),
      ]),
      {
        version: '1.0',
        session: helpers.makeUnauthorisedSession(),
        request: helpers.makeRequest(),
      }
    ).then((response) => done(new Error('No error thrown'))
    ).catch((err) => {
      try {
        assert.instanceOf(err, Error)
        assert.equal(err.message, 'Event unhandled')
        done()
      } catch (fail) {
        done(fail)
      }
    })
  })

})
