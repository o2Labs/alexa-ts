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