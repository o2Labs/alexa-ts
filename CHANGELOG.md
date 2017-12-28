# v3.0.0-beta
- Upgrade to TypeScript 2.6.
- Remove implicit 'any'.
- Fix where generic types were being used as argument names.
- Use strict checks between null and undefined.

# v2.5.0
- Add request context object to request body.

# v2.4.1
- Add support for newer node versions (by @bfsmith).

# v2.4.0
- Add `Pipe.catch` for handling forward errors.
- Don’t fail when neither `Text` or `SSML` is defined - just say nothing if no speech is defined.
- Don’t bother freezing module objects.
- Add default handling of `SessionEndedRequest` - just return void if not specified in routes.
- Add basic documentation for modules and types.

# v2.3.3
- Fix bug with handling of undefined in PromiseOrValue

# v2.3.2
- Fix detection of promises.

# v2.3.1
- Use `toString()` on Errors in the tracer pipe.

# v2.3.0
- Use PromiseLike interface instead of relying on using built in promise type.
- Add then and catch functions to the module.

# v2.2.1
- Make the `Say` property on a response optional.

# v2.2.0
- Expose function for reading state from request. This is helpful for when you’re writing your own middleware and you want to interrogate the state.

# v2.1.0
- Add raw request argument to intent handlers.
- Add support for forward piping from intent handlers.
NOTE: Having made the IntentResult slightly more complex, TS type inference appears to be less reliable (see the kitchen-sink example change).

# v2.0.3
- Use NPM for publishing - yarn is creating invalid packages :(

# v2.0.2
- Add change log.
- Try to fix packaging again :/

# v2.0.1
Failed attempt to fix npm packaging.

# v2.0.0
Major rework following use in first project.

Breaking changes:
- Package paths changed so everything is in the root, instead of in `dist`. Code referencing `alexa-ts/dist/testing` will now just reference `alexa-ts/testing`.
- Re-order `response` function arguments to be `(response, previousState)` instead of `(previousState, response)` so that the `previousState` argument can be optional.
- Rework `testing` module to cover testing whole session scenarious.

Features:
- Add logging of errors in the `Pipe.tracer()` with the message "Error:".
- Add new `doNothing` pipe, which just calls the next step. This can be useful when composing complex pipes with optional steps.
- Lots more documentation comments :)

# v1.0.1
Fix github path in repo.

# v1.0.0
First workable code!