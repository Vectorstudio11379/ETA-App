# Google Play Billing for the Android app

Google Play requires the Android app to sell courses through Google Play Billing. The website keeps using Paystack.

The flow works like Paystack:
1. Google Play takes the payment in the app.
2. The app sends the purchase token to WordPress.
3. WordPress asks Google whether the purchase is real and paid, then unlocks the course.
4. Google also sends a webhook to WordPress for every purchase, refund and cancellation. WordPress unlocks the course, or removes access after a refund.

Nothing is unlocked from what the app says alone. WordPress always checks the purchase with Google first.

---

## Part 1: setup (site owner)

### 1. Create the products in Play Console
Go to **Play Console → your app → Monetize with Play → Products → One-time products**. Create one product per paid course and bundle, using **exactly** these product IDs. Set each price in Play Console; Google converts it for each country.

| Product ID | Type | Title | Website price (NGN) |
|---|---|---|---|
| `course_1079` | Course | The Complete Digital Marketing Masterclass | 6,000 |
| `course_955` | Course | The Complete Content Writing Masterclass | 5,000 |
| `course_954` | Course | The Complete Copywriting Masterclass | 5,000 |
| `course_680` | Course | Paid Online Survey & International Testing Masterclass | 10,000 |
| `course_470` | Course | PayPal Mastery Course | 3,000 |
| `bundle_668` | Bundle | AI & Automation Power Suite | 20,000 |
| `bundle_669` | Bundle | Digital Creator & Social Media Launchpad | 15,000 |
| `bundle_670` | Bundle | Global Remote Career & Virtual Assistant Bundle | 18,000 |
| `bundle_671` | Bundle | Financial Freedom & Global Trading Mastery | 20,000 |

- **Free courses don't need a Play product.** There are 6 of them; the app keeps enrolling them for free.
- **The live list is always available.** It's at **WordPress admin → Settings → ETA Google Play** and at `GET /wp-json/eta/v1/google-play/products`. New paid courses appear there automatically: `course_<course ID>` or `bundle_<bundle product ID>`.

### 2. Give WordPress access to the Play Developer API
1. In **Google Cloud Console**, open the project linked to Play Console and enable the **Google Play Android Developer API**.
2. Go to **IAM & Admin → Service accounts** and create a service account (for example `eta-play-billing`). Under **Keys → Add key → JSON**, download the key file.
3. In **Play Console → Users and permissions**, invite the service account's email. Give it these app permissions:
   - **View financial data**
   - **Manage orders and subscriptions**
4. In **WordPress admin → Settings → ETA Google Play**:
   1. Check the package name. It's `com.eta.app` unless the app's applicationId is different.
   2. Paste the whole JSON key file.
   3. Click **Save and test connection**. You should see "Connected".

The key is stored in the WordPress database and never shown again. Don't send it by email or chat, and don't commit it to GitHub.

Google can take up to 24 hours to apply new service account permissions. Until then, verification can fail with a permission error.

### 3. Connect the webhook (real-time developer notifications)
1. In **Google Cloud → Pub/Sub**, create a topic, for example `play-billing`.
2. On the topic, add the principal `google-play-developer-notifications@system.gserviceaccount.com` with the role **Pub/Sub Publisher**.
3. Create a **subscription** on the topic. Set the type to **Push**. For the endpoint URL, copy the **Webhook URL** from WordPress admin → Settings → ETA Google Play. It ends in `?key=…`.
4. In **Play Console → Monetize with Play → Monetization setup → Real-time developer notifications**:
   - Enter the topic name: `projects/<your-project-id>/topics/play-billing`.
   - Choose to receive notifications for **all one-time products and voided purchases**.
   - Click **Send test notification**.
5. Back on the WordPress settings page, **Recent activity** should show `test_notification`.

The `?key=` in the webhook URL acts as its password, so keep it private. If it leaks, tick "Make a new webhook key" in WordPress, save, and update the push URL in Pub/Sub.

### 4. Test before release
1. Add your Google account as a **license tester** in **Play Console → Settings → License testing**.
2. Make a test purchase from an internal-testing build. Test purchases charge nothing.
3. Check the result:
   - The course unlocks.
   - A WooCommerce order appears with payment method "Google Play (Android app)". It's marked as a test purchase in the order notes.
   - The settings page shows `granted`.

---

## Part 2: what the app must do (app developer)

Base URL: `https://expressteck.tech/wp-json/eta/v1`. Send the student's token as `Authorization: Bearer <token>` on every signed-in call.

### Endpoints

| Method | Address | Sign-in | Body | Response |
|---|---|---|---|---|
| GET | `/google-play/products` | no | – | List of `{ product_id, type, id, title, course_ids, price_ngn }` for every paid course and bundle |
| GET | `/google-play/account` | yes | – | `{ obfuscated_account_id }` |
| POST | `/google-play/verify` | yes | `{ product_id, purchase_token, package_name }` | See below |
| POST | `/google-play/webhook?key=…` | Google only | Pub/Sub push message | Not for the app |

`/checkout/verify-google-play` and `/payment/google-play/verify` are the same as `/google-play/verify`. The field names `productId`, `sku`, `purchaseToken` and `packageName` are also accepted.

### Purchase flow (react-native-iap or expo-iap)
1. **Find the Play product ID for each course and bundle.**
   - Courses: `course_${course.id}`.
   - Bundles: `bundle_${bundle.id}`.
   - Or read the list from `/google-play/products`.
2. **Load the product details from Google Play.** Show Google's localized price (`displayPrice` / `localizedPrice`), not the NGN price from `/courses`. The two can differ.
3. **Get the student's account ID.** Before buying, call `GET /google-play/account` and keep `obfuscated_account_id`.
4. **Start the purchase.** Pass the account ID with it:
   ```ts
   await requestPurchase({ skus: [productId], obfuscatedAccountIdAndroid: obfuscatedAccountId });
   ```
   This ties the purchase to the student, so the webhook can unlock it even if the app closes before step 5.
5. **Send the purchase to WordPress.** In the purchase listener:
   ```ts
   const res = await api.post('/google-play/verify', {
     product_id: purchase.productId,
     purchase_token: purchase.purchaseToken,
     package_name: 'com.eta.app',
   });
   ```
   Then handle the result:
   - **200** (`status: "purchased"`, `enrolled: true`): the course is unlocked. Refresh `/my-courses` and open it. Then call `finishTransaction({ purchase, isConsumable: false })`. WordPress has already acknowledged the purchase, so ignore an "already acknowledged" error.
   - **202** (`status: "pending"`): the payment is still pending, for example cash at a shop. Tell the student; the webhook unlocks the course when Google confirms it.
   - **400 / 403 / 404 / 409**: show `message`. Don't retry, and **never consume** the purchase.
   - **401**: the student is signed out. Sign them in, then send the same purchase again.
   - **502 / 503**: Google or the network failed. Retry later; the purchase is safe.
6. **Restore purchases.** On app start, and from a "Restore purchases" button, call `getAvailablePurchases()`. Send each purchase to `/google-play/verify` again. Repeating it is safe: an already-verified purchase just returns 200.

### Rules
- **Products are one-time and non-consumable.** Never call `consumePurchase` and never pass `isConsumable: true`, or the student loses the course.
- **Use Google Play Billing only on Android.** Remove the Paystack checkout from the Android build. Free courses still enroll through `/checkout/initialize-paystack`, which returns `free_enrollment: true` without any payment.
- **WordPress decides access.** After a purchase, read `isEnrolled` from `/courses`, `/bundles` and `/my-courses`. Don't keep a local "purchased" flag.
- **Refunds remove access automatically.** Google sends a voided-purchase notification and WordPress turns off those courses, unless the student also owns them through another purchase.
- **iPhone:** Apple has the same rule for its App Store. An iOS release will need Apple In-App Purchase.

### Errors from `/google-play/verify`

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `missing_purchase` | `product_id` or `purchase_token` missing |
| 400 | `wrong_package` | `package_name` isn't the app configured in WordPress |
| 400 | `purchase_not_completed` | Google reports the purchase as cancelled |
| 400 | `play_api_error` | Google doesn't know this token for this product |
| 401 | `login_required` | No valid student token |
| 403 / 409 | `purchase_in_use` | The purchase belongs to another student account |
| 404 | `unknown_product` | The product ID isn't a paid course or bundle on the site |
| 503 | `play_not_configured` / `play_unreachable` | The server has no key yet, or Google couldn't be reached |
