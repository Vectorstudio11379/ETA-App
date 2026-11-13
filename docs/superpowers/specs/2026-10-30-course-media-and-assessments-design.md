# Course media and assessments design

## Intent

Make course videos, quizzes, and assignments from the ETA courses API work reliably in the mobile app.

## Goals and constraints

- Return real, playable lesson media URLs from the WordPress courses API, preserving its secure-media behavior.
- Include quiz questions and assignment details in the API response, mapped into the app's existing lesson model.
- Render those API-provided assessments in the app, with safe handling for missing or incomplete fields.
- Retain bundled course data as a fallback for absent fields, without inventing media URLs or assessment answers.
- Keep other course and lesson behavior unchanged. The live API will reflect plugin changes only after the plugin is deployed.

## Approaches

- **End-to-end (selected):** Repair the WordPress API payload and make the app consume it robustly. This corrects the source of truth while keeping the app compatible with incomplete responses.
- **App-only fallback:** Fill API gaps from the bundled catalog. This is quicker to ship, but leaves the API incomplete and risks stale fallback content.

The end-to-end approach was selected because both the response and the app's expected lesson fields contribute to the failure.

## Implementation outline

Inspect the WordPress plugin's lesson/media and assessment storage, then map actual video, quiz, and assignment data into the established app lesson types. Update app-side API normalization and lesson rendering to support the resulting payload and partial legacy responses. Refresh the checked-in plugin archive from the updated API source. Validate representative video, quiz, and assignment lessons against the live response shape and the bundled catalog.

## Non-goals

Changing course content, inventing replacement videos or quiz answers, redesigning the player, or deploying the WordPress plugin.
