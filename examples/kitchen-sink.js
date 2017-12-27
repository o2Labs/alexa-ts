"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Alexa = require("../src/index");
const routes = {
    InitialState: 'Started',
    Launch: () => new Promise((resolve) => resolve({
        Say: { Text: 'Hello world' },
        NewState: 'Other' // Changing the state as part of the response
    })),
    SessionEnded: () => {
        console.log('Session ended');
    },
    Standard: {
        Help: state => ({
            Say: { SSML: '<speak> try saying <emphasis>hello</emphasis> </speak>' },
        }),
        Stop: state => ({
            Say: { Text: 'Bye!' },
            EndSession: true,
        })
    },
    Custom: [
        ["MyCustomIntent", (state, slots) => ({
                Say: { Text: 'Something interesting' },
                EndSession: true,
            })],
    ],
};
const auth = (event, next) => {
    if (event.session.user.accessToken) {
        // TODO: Perform custom authorisation
        return next(event);
    }
    else {
        return Alexa.response({
            Say: { Text: 'Please link your account to use this skill.' },
            Card: { Type: 'LinkAccount' },
        });
    }
};
const unhandled = (event) => Alexa.response({
    Say: { Text: "Sorry, I don't seem able to respond to that right now." },
    EndSession: true,
});
exports.handler = Alexa.Lambda.pipe([
    Alexa.Pipe.tracer(),
    auth,
    Alexa.Pipe.router(routes),
    unhandled,
]);
