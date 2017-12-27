"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import 'mocha'
const Alexa = require("../src/index");
const chai_1 = require("chai");
const testing_1 = require("../src/testing");
describe('counting skill', () => {
    const handler = Alexa.Lambda.router({
        InitialState: 0,
        Standard: {
            Next: (state) => ({
                Say: { Text: `${state}` },
                NewState: state + 1,
            })
        }
    });
    it('keeps counting up each time you say "next"', () => {
        // Start a session within a test.
        const session = new testing_1.Session(handler);
        return session
            .RequestIntent('AMAZON.NextIntent')
            .then((response) => {
            // Perform another intent within the same session.
            return session.RequestIntent('AMAZON.NextIntent');
        }).then((response) => 
        // Session state is maintained.
        chai_1.assert.equal(response.sessionAttributes['_alexaTsState'], 2));
    });
});
