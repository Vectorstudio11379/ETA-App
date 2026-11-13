# Mobile App Polish Design

## Intent

Make the selected country visible in the app header, stop duplicate course cards in My Courses, and give navigation and key screen content a more polished, subtle motion treatment.

## Goals

- Show the flag for the signed-in user's selected country; keep Nigeria as the fallback for unknown or missing country values.
- Render each enrolled course once, using course identifiers and aliases to recognize duplicate records without merging distinct courses.
- Add short, restrained page and content transitions throughout the app, while respecting the device's reduced-motion preference when supported.

## Non-goals and constraints

- Do not change currency selection, payment logic, backend APIs, course content, or the visual theme.
- Reuse Expo Router and the installed Reanimated dependency; do not add packages or long-running decorative animations.
- Preserve the current course-card layout and fallback to courses marked enrolled in app state when the live enrollment list is unavailable.

## Approaches

- **A — App-wide polished motion (selected):** tune the existing native-stack transition and use Reanimated for brief screen/content entrances and light interaction feedback. This covers navigation and key content without another dependency; keep effects short and consistent.
- **B — Screen-only motion:** animate My Courses and selected controls while leaving route transitions unchanged. This is narrower but does not deliver the requested app-wide page-transition feel.

The user selected A and the subtle fade/lift motion direction.

## Implementation decisions

- Resolve the header flag from the profile's country using the existing supported-country data. Signup continues to save the selected country name; currency behavior remains unchanged.
- Deduplicate live enrollments and the app-state fallback by stable course identity (ID, product ID, or slug), using a normalized title only when stable identifiers are unavailable.
- Apply native route transitions globally and restrained Reanimated entrances to key screen content, with no new animation dependency.

## Builder calls

- Keep unknown country values safe by showing the existing Nigeria flag.
- Prefer the record with the most useful enrollment/progress data when duplicate records refer to the same course.
- Avoid animating every state update; motion should occur on navigation or first content entry, not during ordinary rerenders.
