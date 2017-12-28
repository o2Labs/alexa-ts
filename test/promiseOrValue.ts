import * as Alexa from '../src/index'

describe('Promise or Value', () => {
  it('Can "then" synchronously', () => {
    const result = Alexa.PromiseOrValue.then(() => 'expected', x => x)
    expect(result).toEqual('expected')
  })

  it('Can "then" synchronously with undefined', () => {
    const result = Alexa.PromiseOrValue.then(() => void 0, x => x)
    expect(result).toBeUndefined()
  })

  it('Can "then" asynchronously', () => {
    return Alexa.PromiseOrValue.asPromise(
      Alexa.PromiseOrValue.then(() => Promise.resolve('expected'), x => x),
    ).then(result => expect(result).toEqual('expected'))
  })

  it('Can "then" asynchronously with undefined', () => {
    return Alexa.PromiseOrValue.asPromise(
      Alexa.PromiseOrValue.then(() => Promise.resolve(void 0), x => x),
    ).then(result => expect(result).toBeUndefined())
  })

  it('Can "catch" synchronously', () => {
    const result = Alexa.PromiseOrValue.then(
      () => {
        throw new Error('expected')
      },
      x => x,
      err => err.message,
    )
    expect(result).toEqual('expected')
  })

  it('Can "catch" asynchronously', () => {
    return Alexa.PromiseOrValue.asPromise(
      Alexa.PromiseOrValue.then(
        () => Promise.reject(new Error('expected')),
        x => x,
        err => err.message,
      ),
    ).then(result => expect(result).toEqual('expected'))
  })
})
