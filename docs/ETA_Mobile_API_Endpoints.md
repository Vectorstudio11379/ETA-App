# ETA Mobile API: Endpoint Reference

**Base URL:** `https://expressteck.tech/wp-json/eta/v1`
**Plugin:** ETA App Mobile API Bridge v2.1.0 (checked against the live site on 2026-11-08; Q&A replies, bundles, mixed-cart checkout and certificate downloads updated 2026-11-13)
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
| GET | `https://expressteck.tech/wp-json/eta/v1/bundles` | none. Returns every bundle sold on the website, at the website's price (see **Bundles** below). |
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
| GET | `download_url` from `/certificates` or `/my-courses` | Open it in the browser: it returns the certificate PDF. The link is signed for that student and course and lasts 7 days, so fetch `/certificates` again for a fresh link when the user taps Download. No token needed. |

## Reviews and Q&A

| Method | Full URL | Params / Body |
|---|---|---|
| GET | `https://expressteck.tech/wp-json/eta/v1/reviews?course_id={courseId}` | `course_id`. Send the token to get the correct `can_review` value. |
| POST | `https://expressteck.tech/wp-json/eta/v1/reviews` | **Token required.** `course_id`, `rating` (1–5), `title`, `content` |
| GET | `https://expressteck.tech/wp-json/eta/v1/course-qa?course_id={courseId}` | `course_id` |
| POST | `https://expressteck.tech/wp-json/eta/v1/course-qa` | **Token required.** `course_id`, `question` (5–1000 characters) |
| POST | `https://expressteck.tech/wp-json/eta/v1/course-qa/reply` | **Token required.** `question_id` (the question's `id`), `reply` (2–1000 characters) |
| GET | `https://expressteck.tech/wp-json/eta/v1/certificates/verify?code={certCode}` | `code` (public) |

Aliases: `/qa` = `/course-qa`, and `/qa/reply` = `/course-qa/reply`. See **Replying to a question** for other accepted reply addresses.

### Q&A list

**`GET /course-qa?course_id=…`** returns `qa_items`: the course's built-in FAQs first, then student questions (newest first). Each student question appears once.

| Field | Meaning |
|---|---|
| `id` | Question ID, used for replies. `null` on FAQ entries. |
| `type` | `faq` or `question` |
| `question`, `author`, `date`, `date_iso` | The question, who asked it, and when |
| `answer` | Always text. The first instructor reply when there is one, otherwise a "we'll answer soon" message. |
| `answered` | `true` when `answer` is a real instructor reply |
| `can_reply` | `false` on FAQ entries |
| `reply_count`, `replies` | Replies, oldest first. Each has `id`, `question_id`, `author`, `content`, `is_instructor`, `badge` (`Instructor` / `Student`), `date`, `date_iso`. |

### Replying to a question

**Reply address:** `POST https://expressteck.tech/wp-json/eta/v1/course-qa/reply`

Headers: `Authorization: Bearer <token>` and `Content-Type: application/json`

```json
{ "question_id": 229, "reply": "Thanks, that worked!" }
```

- `question_id`: the `id` of a **student question** (`type: "question"`, `can_reply: true`).
- `reply`: 2–1000 characters.

Only signed-in users can reply, and any signed-in user may. A reply from an instructor or admin becomes the question's `answer` on the app and the website. The person who asked is emailed when someone else replies. On success, add the returned `reply` to the end of that question's `replies`.

```json
{
  "success": true,
  "message": "Your reply has been posted.",
  "answered": false,
  "reply": {
    "id": 232, "question_id": 229, "author": "Samson Emmanuel",
    "content": "Thanks, that worked!", "is_instructor": false, "badge": "Student",
    "date": "1 second ago", "date_iso": "2026-11-13T11:40:02+00:00"
  }
}
```

**Show the Reply button only when `can_reply` is `true`.** Built-in FAQ items (`type: "faq"`, `id: null`) can't be replied to. Label them as FAQs, not as student questions.

**Other addresses that also work.** Use the address above in new code. These are accepted too, all `POST` with the same token and body:

| Address | Question ID comes from |
|---|---|
| `/qa/reply` | body |
| `/course-qa/replies`, `/course-qa/answer`, `/qa/answer`, `/qa/replies` | body |
| `/course-qa/{questionId}/reply` (also `/replies`, `/answer`, `/answers`) | URL |
| `/qa/{questionId}/reply`, `/questions/{questionId}/answers` | URL |
| `/courses/{courseId}/qa/{questionId}/reply` | URL |

The question ID can be sent as `question_id`, `questionId`, `qa_id`, `parent_id` or `comment_id`. The text can be sent as `reply`, `content`, `message`, `answer`, `text` or `body`.

| Status | `error` | When |
|---|---|---|
| 201 | none (`success: true`, `answered`, plus the saved `reply`) | Reply saved |
| 400 | `Replies are only for student questions. Built-in FAQ answers cannot be replied to.` | No question ID was sent, for example a reply to an FAQ item (`id: null`) |
| 400 | `Reply cannot be empty.` / length message | Reply missing, under 2 or over 1000 characters |
| 401 | `Please sign in to reply.` | No token or an expired token |
| 404 | `That question was not found.` | Unknown `question_id` |
| 404 | `No route was found matching the URL and request method.` | Wrong address or method. Use the reply address above. |
| 409 | `You have already posted this reply.` | Same user, same question, same text |
| 429 | `You have replied several times recently. …` | More than 10 replies from this student in the last hour (no limit for instructors) |

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

## Bundles

**`GET /bundles`** lists the bundles sold on the website (WooCommerce bundle products), so names, courses and prices always match the website. There are currently 4.

| Field | Meaning |
|---|---|
| `id` / `product_id` / `bundle_id` | The bundle's product ID (for example `671`). Put this ID in the cart and in checkout. |
| `price`, `original_price` (also `sale_price`, `regular_price`, `originalPrice`) | Current price and the crossed-out price, in naira |
| `savings_amount`, `savings_percent` (also `discount`), `badge` | Discount details |
| `course_ids`, `courses`, `packages` | The courses inside the bundle (IDs, summaries, titles) |
| `title`, `slug`, `description`, `thumbnail`, `checkout_url` | Display details; `checkout_url` is the bundle's page on the website |

The old app-only bundles (IDs `101` / `102`, "Complete Digital Career Suite" and "Creative Freelancer Pack") have been removed. They were never sold on the website.

## Payments (Paystack)

| Method | Full URL | Params / Body |
|---|---|---|
| POST | `https://expressteck.tech/wp-json/eta/v1/payment/initialize` | `items` or `course_ids` (array) or `course_id` (**required**): any mix of course IDs and bundle IDs. Also `email`, `name`, `phone`. Returns a Paystack `authorization_url`, `reference`, `amount` and `items` (what is being charged). Returns 400 if no valid course or bundle is given. |
| GET / POST | `https://expressteck.tech/wp-json/eta/v1/payment/verify?reference={ref}` | `reference` only. The server checks the payment with Paystack, confirms the amount, and enrolls the courses chosen at checkout. Any `course_ids` / `email` sent here are ignored. |
| GET | `https://expressteck.tech/wp-json/eta/v1/payment/status?reference={ref}` | `reference` (or `order_id`) |

Aliases: `/checkout/initialize-paystack` = `/payment/initialize`, and `/checkout/verify-paystack` = `/payment/verify`.

**How the total is worked out:** every item is priced on the server. A bundle costs its website price, and each course costs its own price; the app's cart total is not used. A cart with a ₦18,000 bundle and a ₦5,000 course is charged ₦23,000. A course that is also inside a bundle in the same cart is charged only once. After payment, every course in every bundle plus each single course is unlocked.

**Free carts:** if the total is ₦0 (only free courses), there is no Paystack step. The response has `free_enrollment: true`, the courses are unlocked at once, and the user must be signed in (401 otherwise). Send the user to My Courses.

**Web checkout flow (optional):** open `https://expressteck.tech/mobile-checkout/?course_id={id}&email={email}` in a WebView or browser. Both parameters are required (otherwise the page returns 400). Paystack redirects to `https://expressteck.tech/payment-complete/` when payment finishes. Then call `/payment/verify` or `/payment/status`.

> The Paystack webhook (`/payment/webhook`) is server-to-server only. The app must not call it.
