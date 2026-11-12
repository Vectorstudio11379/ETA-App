# ETA Mobile API: Endpoint Reference

**Base URL:** `https://expressteck.tech/wp-json/eta/v1`
**Plugin:** ETA App Mobile API Bridge v2.1.0 (checked against the live site on 2026-11-08; review rules updated the same day)
**Format:** JSON request and response bodies (`Content-Type: application/json`). CORS is open.

## Authentication

1. Call `POST /login` (or `/register`, or `/auth/google`). The response has the form `{ "success": true, "token": "...", "user": { ... } }`.
2. Send the token on every user-specific request:
   `Authorization: Bearer <token>`
   If the client drops the Authorization header, send `X-ETA-Auth-Token: <token>` instead. Tokens in the URL (`?auth_token=`) are **not** accepted.
3. Tokens expire 30 days after the last login. A password reset issues a new token and invalidates the old one. When any request returns **401**, clear the saved token and send the user back to the login screen.
4. Student data is looked up **only** from the token. `email` and `user_id` query params on `/my-courses`, `/certificates` and `/courses` are ignored.

---

## Auth

| Method | Full URL | Body |
|---|---|---|
| POST | `https://expressteck.tech/wp-json/eta/v1/register` | `name` (or `fullName`), `email`, `password`, `meta` (optional: `{ phone, country }`) |
| POST | `https://expressteck.tech/wp-json/eta/v1/login` | `username` or `email`, `password` |
| POST | `https://expressteck.tech/wp-json/eta/v1/auth/google` | `id_token` (or `credential` / `token`) |
| POST | `https://expressteck.tech/wp-json/eta/v1/auth/forgot-password` | `email` (or `username`). Emails an OTP code. |
| POST | `https://expressteck.tech/wp-json/eta/v1/auth/verify-reset-code` | `email`, `code` (or `otp`) |
| POST | `https://expressteck.tech/wp-json/eta/v1/auth/reset-password` | `email`, `code`, `password` (or `new_password`) |

Aliases: `/google-login` = `/auth/google`, and `/auth/lost-password` = `/auth/forgot-password`.

## Catalog (public)

| Method | Full URL | Params |
|---|---|---|
| GET | `https://expressteck.tech/wp-json/eta/v1/courses` | none (send the token to get your enrolled courses marked) |
| GET | `https://expressteck.tech/wp-json/eta/v1/course-details?id={courseId}` | `id` (or `course_id`) |
| GET | `https://expressteck.tech/wp-json/eta/v1/course-curriculum?id={courseId}` | `id` (or `course_id`) |
| GET | `https://expressteck.tech/wp-json/eta/v1/bundles` | none |
| GET | `https://expressteck.tech/wp-json/eta/v1/categories` | none |
| GET | `https://expressteck.tech/wp-json/eta/v1/instructors` | none |
| GET | `https://expressteck.tech/wp-json/eta/v1/site-info` | none |

## Student (send the Bearer token)

| Method | Full URL | Params / Body |
|---|---|---|
| GET | `https://expressteck.tech/wp-json/eta/v1/profile` | none |
| POST / PUT | `https://expressteck.tech/wp-json/eta/v1/profile` | any of `name`, `email`, `phone`, `country`, `new_password`, `avatar_base64` / `avatar_url` |
| GET | `https://expressteck.tech/wp-json/eta/v1/my-courses` | none (uses the token) |
| GET | `https://expressteck.tech/wp-json/eta/v1/progress` | none |
| POST | `https://expressteck.tech/wp-json/eta/v1/progress` | `course_id`, `lesson_id`, `completed` (bool), `score` (optional) |
| GET | `https://expressteck.tech/wp-json/eta/v1/cart` | none |
| POST | `https://expressteck.tech/wp-json/eta/v1/cart` | `cart_ids` (array of course IDs) |
| GET | `https://expressteck.tech/wp-json/eta/v1/wishlist` | none |
| POST | `https://expressteck.tech/wp-json/eta/v1/wishlist` | `wishlist_ids` (array of course IDs) |
| GET | `https://expressteck.tech/wp-json/eta/v1/notifications` | none |
| POST | `https://expressteck.tech/wp-json/eta/v1/notifications/mark-read` | `id`, or `all: true` |
| GET | `https://expressteck.tech/wp-json/eta/v1/certificates` | none (alias: `/my-certificates`) |

## Reviews and Q&A

| Method | Full URL | Params / Body |
|---|---|---|
| GET | `https://expressteck.tech/wp-json/eta/v1/reviews?course_id={courseId}` | `course_id`. Send the token to get the correct `can_review` value. |
| POST | `https://expressteck.tech/wp-json/eta/v1/reviews` | **Token required.** `course_id`, `rating` (1–5), `title`, `content` |
| GET | `https://expressteck.tech/wp-json/eta/v1/course-qa?course_id={courseId}` | `course_id` |
| POST | `https://expressteck.tech/wp-json/eta/v1/course-qa` | **Token required.** `course_id`, `question` (5–1000 characters) |
| GET | `https://expressteck.tech/wp-json/eta/v1/certificates/verify?code={certCode}` | `code` (public) |

Alias: `/qa` = `/course-qa`.

### Asking a question

**`POST /course-qa`** needs a signed-in user. The question is credited to that account; `author_name` / `author_email` in the body are ignored. Any signed-in user can ask, whether or not they bought the course.

| Status | `error` | When |
|---|---|---|
| 201 | none (`success: true`, plus the saved `qa_item`) | Question saved; the instructor team is emailed |
| 400 | `Valid course_id is required.` / `Question cannot be empty.` / length message | Missing or unknown course, or a question under 5 or over 1000 characters |
| 401 | `Please sign in to ask a question.` | No token or an expired token |
| 409 | `You have already asked this question.` | Same user, same course, same text |
| 429 | `You have asked several questions recently. …` | More than 5 questions from this user in the last hour |

### Who can post a review

A user can review a course only if they **bought** it or **started watching** it, on the website or in the app. Buying a different course, or just having an account, is not enough.

- **Bought:** a paid website order (processing or completed) that includes the course, directly or through a bundle, or an app purchase verified through `/payment/verify`.
- **Watched:** progress on the course on the website, or at least one lesson saved with `POST /progress` in the app.

The same rule applies to reviews posted from the website.

**`GET /reviews?course_id=…`** returns `can_review` (bool) alongside the reviews. It is `true` only when the token belongs to a user who can review this course, and `false` for guests. Show the "Write a review" form only when it is `true`.

```json
{
  "success": true,
  "course_id": 979,
  "average_rating": 4.9,
  "reviews_count": 1,
  "rating_breakdown": { "5": 1, "4": 0, "3": 0, "2": 0, "1": 0 },
  "reviews": [ ... ],
  "can_review": false
}
```

**`POST /reviews`** credits the review to the signed-in account. `author_name` / `author_email` in the body are ignored. Each user can leave one review per course.

| Status | `error` | When |
|---|---|---|
| 201 | none (`success: true`, plus the saved `review`) | Review published |
| 400 | `Valid course_id is required.` / `Review content cannot be empty.` | Missing or unknown course, or empty `content` |
| 401 | `Please sign in to review this course.` | No token or an expired token |
| 403 | `Only learners who have bought or started watching this course can review it.` | Signed in, but has not bought or watched this course |
| 409 | `You have already reviewed this course.` | The user already has a published or pending review on this course |

All errors come back as `{ "success": false, "error": "..." }`. A 401 here follows the usual rule: clear the token and send the user to log in.

## Payments (Paystack)

| Method | Full URL | Params / Body |
|---|---|---|
| POST | `https://expressteck.tech/wp-json/eta/v1/payment/initialize` | `course_ids` (array) or `course_id` (**required**), `email`, `name`, `phone`. Returns a Paystack `authorization_url` and `reference`. Returns 400 if no valid course is given. |
| GET / POST | `https://expressteck.tech/wp-json/eta/v1/payment/verify?reference={ref}` | `reference` only. The server checks the payment with Paystack, confirms the amount, and enrolls the courses chosen at checkout. Any `course_ids` / `email` sent here are ignored. |
| GET | `https://expressteck.tech/wp-json/eta/v1/payment/status?reference={ref}` | `reference` (or `order_id`) |

Aliases: `/checkout/initialize-paystack` = `/payment/initialize`, and `/checkout/verify-paystack` = `/payment/verify`.

**Web checkout flow (optional):** open `https://expressteck.tech/mobile-checkout/?course_id={id}&email={email}` in a WebView or browser. Both parameters are required (otherwise the page returns 400). Paystack redirects to `https://expressteck.tech/payment-complete/` when payment finishes. Then call `/payment/verify` or `/payment/status`.

> The Paystack webhook (`/payment/webhook`) is server-to-server only. The app must not call it.
