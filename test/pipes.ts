// import 'mocha'
import * as Alexa from '../src/index'
import { assert } from 'chai'
import { Session } from '../src/testing'

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
    new Session(
      Alexa.Lambda.pipe([
        (event, next) => next(event),
        (event) => Alexa.response({ Say: { Text: 'Expected' } }, 'ExpectedState'),
      ]))
    .LaunchSkill().then((response) => {
      assert.deepEqual(response, expectedResult)
    })
  )

  it('can not execute next step', () =>
    new Session(
      Alexa.Lambda.pipe([
        (event) => Alexa.response({ Say: { Text: 'Expected' } }, 'ExpectedState'),
        (event) => Alexa.response({ Say: { Text: 'Not Expected' } }, 'OtherState'),
      ]))
    .LaunchSkill()
    .then((response) => {
      assert.deepEqual(response, expectedResult)
    })
  )

  it('can pass-through asynchronously', () =>
    new Session(
      Alexa.Lambda.pipe([
        (event, next) => Promise.resolve(next(event)),
        (event) => Promise.resolve(Alexa.response({ Say: { Text: 'Expected' } }, 'ExpectedState')),
      ]))
    .LaunchSkill()
    .then((response) =>
      assert.deepEqual(response, expectedResult)
    )
  )

  it('throws an error when unhandled', (done) => {
    new Session(
      Alexa.Lambda.pipe([
        (event, next) => next(event),
      ]))
    .LaunchSkill()
    .then((response) => done(new Error('No error thrown')))
    .catch((err) => {
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
