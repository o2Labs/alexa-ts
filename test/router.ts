// import 'mocha'
import * as Alexa from '../src/index'
import { assert } from 'chai'
import * as helpers from '../src/testing'

describe('Routing', () => {

  describe('LaunchRequest', () => {

    it('should fire launch handler with initial state', () =>
      helpers.executeLambda(Alexa.Lambda.router({
        InitialState: 'InitialState',
        Launch: (state) => ({
          Say: { Text: state },
        })
      }), {
        version: '1.0',
        session: helpers.makeUnauthorisedSession(),
        request: helpers.makeRequest(),
      }).then((response) => {
        assert.deepEqual(response, {
          version: '1.0',
          response: {
            outputSpeech: {
              type: 'PlainText',
              text: 'InitialState',
            },
            shouldEndSession: false
          },
          sessionAttributes: {
            _alexaTsState: 'InitialState',
          }
        })
      })
    )

    it('can return a promise', () =>
      helpers.executeLambda(Alexa.Lambda.router({
        InitialState: 'InitialState',
        Launch: () => Promise.resolve({
          Say: { Text: 'Expected' },
        })
      }), {
        version: '1.0',
        session: helpers.makeUnauthorisedSession(),
        request: helpers.makeRequest(),
      }).then((response) => {
        assert.deepEqual(response, {
          version: '1.0',
          response: {
            outputSpeech: {
              type: 'PlainText',
              text: 'Expected',
            },
            shouldEndSession: false
          },
          sessionAttributes: {
            _alexaTsState: 'InitialState',
          }
        })
      })
    )

    it('can set a new state', () =>
      helpers.executeLambda(Alexa.Lambda.router({
        InitialState: 'InitialState',
        Launch: () => ({
          Say: { Text: 'Expected' },
          NewState: 'ExpectedState',
        })
      }), {
        version: '1.0',
        session: helpers.makeUnauthorisedSession(),
        request: helpers.makeRequest(),
      }).then((response) => {
        assert.deepEqual(response, {
          version: '1.0',
          response: {
            outputSpeech: {
              type: 'PlainText',
              text: 'Expected',
            },
            shouldEndSession: false
          },
          sessionAttributes: {
            _alexaTsState: 'ExpectedState',
          }
        })
      })
    )

  })

  describe('Standard intents', () => {

    it('calls expected method', () =>
      helpers.executeLambda(Alexa.Lambda.router({
        InitialState: 'InitialState',
        Standard: {
          Help: (state) : Alexa.Response<string> => ({
            Say: { Text: state },
            NewState: 'ExpectedState',
          })
        },
      }), {
        version: '1.0',
        session: helpers.makeUnauthorisedSession(),
        request: helpers.makeRequest('AMAZON.HelpIntent'),
      }).then((response) => {
        assert.deepEqual(response, {
          version: '1.0',
          response: {
            outputSpeech: {
              type: 'PlainText',
              text: 'InitialState',
            },
            shouldEndSession: false
          },
          sessionAttributes: {
            _alexaTsState: 'ExpectedState',
          }
        })
      })
    )

  })

  describe('Custom intents', () => {
    it('can accept slots', () =>
      helpers.executeLambda(Alexa.Lambda.router({
        InitialState: 'InitialState',
        Custom: [
          ['CustomIntent', (state, slots) : Alexa.Response<string> => ({
            Say: { Text: `You said ${slots.get('Word')}.` },
          })]
        ],
      }), {
        version: '1.0',
        session: helpers.makeUnauthorisedSession(),
        request: helpers.makeRequest('CustomIntent', {
          Word: {
            name: 'Word',
            value: 'Expected',
          }
        }),
      }).then((response) => {
        assert.deepEqual(response, {
          version: '1.0',
          response: {
            outputSpeech: {
              type: 'PlainText',
              text: 'You said Expected.',
            },
            shouldEndSession: false
          },
          sessionAttributes: {
            _alexaTsState: 'InitialState',
          }
        })
      })
    )
  })

})
