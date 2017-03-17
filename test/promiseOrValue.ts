// import 'mocha'
import * as Alexa from '../src/index'
import { assert } from 'chai'

describe('Promise or Value', () => {

  it('Can "then" synchronously', () => {
    const result = Alexa.PromiseOrValue.then(() => 'expected', x => x)
    assert.equal(result, 'expected')
  })

  it('Can "then" synchronously with undefined', () => {
    const result = Alexa.PromiseOrValue.then(() => void(0), x => x)
    assert.isUndefined(result)
  })

  it('Can "then" asynchronously', () => {
    Alexa.PromiseOrValue
    .then(() => Promise.resolve('expected'), x => x)
    .then(result => assert.equal(result, 'expected'))
  })

  it('Can "then" asynchronously with undefined', () => {
    Alexa.PromiseOrValue
    .then(() => Promise.resolve(void(0)), x => x)
    .then(result => assert.isUndefined(result))
  })

  it('Can "catch" synchronously', () => {
    const result = Alexa.PromiseOrValue.then(() => { throw new Error('expected') }, x => x, err => err.message)
    assert.equal(result, 'expected')
  })

  it('Can "catch" asynchronously', () => {
    Alexa.PromiseOrValue
    .then(() => Promise.reject(new Error('expected')), x => x, err => err.message)
    .then(result => assert.equal(result, 'expected'))
  })

})
