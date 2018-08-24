import * as Alexa from '../src/index'
import { Session } from '../src/testing'
import * as ask from 'ask-sdk-model'

describe('Creating pipes', () => {
  const expectedResult: ask.ResponseEnvelope = {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: 'Expected',
      },
      shouldEndSession: false,
    },
    sessionAttributes: {
      _alexaTsState: 'ExpectedState',
    },
  }

  it('can pass-through synchronously', () =>
    new Session(
      Alexa.Lambda.pipe([
        (event, next) => next(event),
        event => Alexa.response({ Say: { Text: 'Expected' } }, 'ExpectedState'),
      ]),
    )
      .LaunchSkill()
      .then(response => {
        expect(response).toEqual(expectedResult)
      }))

  it('can not execute next step', () =>
    new Session(
      Alexa.Lambda.pipe([
        event => Alexa.response({ Say: { Text: 'Expected' } }, 'ExpectedState'),
        event =>
          Alexa.response({ Say: { Text: 'Not Expected' } }, 'OtherState'),
      ]),
    )
      .LaunchSkill()
      .then(response => {
        expect(response).toEqual(expectedResult)
      }))

  it('can pass-through asynchronously', () =>
    new Session(
      Alexa.Lambda.pipe([
        (event, next) => Promise.resolve(next(event)),
        event =>
          Promise.resolve(
            Alexa.response({ Say: { Text: 'Expected' } }, 'ExpectedState'),
          ),
      ]),
    )
      .LaunchSkill()
      .then(response => expect(response).toEqual(expectedResult)))

  it('throws an error when unhandled', done => {
    new Session(Alexa.Lambda.pipe([(event, next) => next(event)]))
      .LaunchSkill()
      .then(response => done(new Error('No error thrown')))
      .catch(err => {
        try {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toEqual('Event unhandled')
          done()
        } catch (fail) {
          done(fail)
        }
      })
  })
})

describe('Logging pipe', () => {
  it('logs request and response', () => {
    const logs: { message: string; obj: any }[] = []
    const logger = (message: string, obj: any) => {
      logs.push({ message, obj })
    }
    const routes = {
      InitialState: null,
      Launch: () => ({
        Say: { Text: 'Hello' },
      }),
    }
    return new Session(
      Alexa.Lambda.pipe([Alexa.Pipe.tracer(logger), Alexa.Pipe.router(routes)]),
    )
      .LaunchSkill()
      .then(() =>
        expect(logs.map(log => log.message)).toEqual(['Request:', 'Response:']),
      )
  })

  it('logs errors', () => {
    const logs: { message: string; obj: any }[] = []
    const logger = (message: string, obj: any) => {
      logs.push({ message, obj })
    }
    return new Session(
      Alexa.Lambda.pipe([
        Alexa.Pipe.tracer(logger),
        () => {
          throw new Error('Expected error')
        },
      ]),
    )
      .LaunchSkill()
      .then(() => {
        throw new Error('No exception raised')
      })
      .catch(() => {
        const errorLog = logs.find(log => log.message === 'Error:')
        if (!errorLog) {
          throw new Error('Should find log with message "Error:"')
        }
        expect(errorLog.obj).toEqual('Error: Expected error')
      })
  })

  it('logs errors from promises', () => {
    const logs: { message: string; obj: any }[] = []
    const logger = (message: string, obj: any) => {
      logs.push({ message, obj })
    }
    return new Session(
      Alexa.Lambda.pipe([
        Alexa.Pipe.tracer(logger),
        () => Promise.reject(new Error('Expected error')),
      ]),
    )
      .LaunchSkill()
      .then(() => {
        throw new Error('No exception raised')
      })
      .catch(() => {
        const errorLog = logs.find(log => log.message === 'Error:')
        if (!errorLog) {
          throw new Error('Should find log with message "Error:"')
        }
        expect(errorLog.obj).toEqual('Error: Expected error')
      })
  })
})
