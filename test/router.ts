// import 'mocha'
import * as Alexa from '../src/index'
import { assert } from 'chai'
import { Session } from '../src/testing'

describe('Routing', () => {

  describe('LaunchRequest', () => {

    it('should fire launch handler with initial state', () =>
      new Session(Alexa.Lambda.router({
        InitialState: 'InitialState',
        Launch: (state) => ({
          Say: { Text: state },
        })
      }))
      .LaunchSkill()
      .then((response) => {
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
      new Session(Alexa.Lambda.router({
        InitialState: 'InitialState',
        Launch: () => Promise.resolve({
          Say: { Text: 'Expected' },
        })
      }))
      .LaunchSkill()
      .then((response) => {
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
      new Session(Alexa.Lambda.router({
        InitialState: 'InitialState',
        Launch: () => ({
          Say: { Text: 'Expected' },
          NewState: 'ExpectedState',
        })
      }))
      .LaunchSkill()
      .then((response) => {
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
      new Session(Alexa.Lambda.router({
        InitialState: 'InitialState',
        Standard: {
          Help: (state) : Alexa.Response<string> => ({
            Say: { Text: state },
            NewState: 'ExpectedState',
          })
        },
      }))
      .RequestIntent('AMAZON.HelpIntent')
      .then((response) => {
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
      new Session(Alexa.Lambda.router({
        InitialState: 'InitialState',
        Custom: [
          ['CustomIntent', (state, slots) : Alexa.Response<string> => ({
            Say: { Text: `You said ${slots.get('Word')}.` },
          })]
        ],
      }))
      .RequestIntent('CustomIntent', {
        Word: {
          name: 'Word',
          value: 'Expected',
        }
      })
      .then((response) => {
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

  describe('accessing the raw request', () => {
    const startSession = () =>
      new Session(Alexa.Lambda.router({
        InitialState: '',
        Launch: (state, slots, request) => {
          if (request.session.user.accessToken) {
            return {
              Say: { Text: 'Logged in' }
            }
          } else {
            return {
              Say: { Text: 'Please log in' },
              Card: { Type: 'LinkAccount' },
            }
          }
        },
      }))

    it('detects non-logged in user', () =>
      startSession()
      .LaunchSkill()
      .then((result) => {
        assert.deepEqual(result.response, {
          "outputSpeech": {
            "type": "PlainText",
            "text": "Please log in"
          },
          "shouldEndSession": false,
          "card": {
            "type": "LinkAccount"
          }
        })
      })
    )

    it('detects logged-in user', () =>
      startSession()
      .LinkAccount('SomeAccessToken')
      .LaunchSkill()
      .then((result) => {
        assert.deepEqual(result.response, {
          "outputSpeech": {
            "type": "PlainText",
            "text": "Logged in"
          },
          "shouldEndSession": false,
        })
      })
    )
  })

  it('can fall through to next step in pipe', () => {
    return new Session(Alexa.Lambda.pipe([
      // Step 1: router
      Alexa.Pipe.router({
        InitialState: '',
        Launch: (state, slots, request, next) => {
          return next(request)
        },
      }),
      // Step 2: Catch-all handler
      () => Alexa.response({
        Say: { Text: 'Fall-through' },
      }),
    ]))
    .LaunchSkill()
    .then((result) => {
      assert.deepEqual(result.response, {
        "outputSpeech": {
          "type": "PlainText",
          "text": "Fall-through"
        },
        "shouldEndSession": false
      })
    })
  })

  it('returns void when no end session handler specified', () =>
    new Session(Alexa.Lambda.pipe([
      Alexa.Pipe.router({
        InitialState: null,
      }),
      () => { throw new Error('Unhandled') },
    ])).EndSession().then(resp => {
      assert.isUndefined(resp)
    })
  )

})
