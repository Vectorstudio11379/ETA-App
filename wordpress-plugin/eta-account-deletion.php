<?php
/**
 * Account deletion (required by Google Play for apps with accounts).
 *
 *   POST /wp-json/eta/v1/account/delete   { confirm: "DELETE", password? }   signed in (app token)
 *   https://expressteck.tech/delete-account/                                web page for the same thing
 *
 * What happens:
 * - The WordPress user and all their profile data, app tokens and course progress are deleted.
 * - Course enrollments, quiz attempts and other Masteriyo records for the user are deleted.
 * - Their reviews, questions and replies stay on the courses but are anonymised ("Former student").
 * - WooCommerce orders are kept for accounting, with name, email, phone and address removed.
 * Administrators, shop managers and instructors can't delete themselves this way.
 */

defined( 'ABSPATH' ) || exit;

class ETA_Account_Deletion {

	const NS        = 'eta/v1';
	const PAGE_PATH = '/delete-account/';

	/** @var ETA_Mobile_API_Bridge */
	private $bridge;

	public function __construct( $bridge ) {
		$this->bridge = $bridge;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'init', array( $this, 'maybe_render_page' ), 1 );
	}

	public function register_routes() {
		foreach ( array( '/account/delete', '/delete-account', '/user/delete' ) as $route ) {
			register_rest_route( self::NS, $route, array(
				'methods'             => array( 'POST', 'DELETE' ),
				'callback'            => array( $this, 'rest_delete' ),
				'permission_callback' => '__return_true',
			) );
		}
	}

	/** Roles that must never be deleted from the app. */
	private function is_protected( $user ) {
		$staff = array( 'administrator', 'editor', 'shop_manager', 'masteriyo_manager', 'masteriyo_instructor', 'author' );
		return (bool) array_intersect( $staff, (array) $user->roles ) || user_can( $user, 'manage_options' ) || is_super_admin( $user->ID );
	}

	public function rest_delete( WP_REST_Request $request ) {
		$user_id = (int) $this->bridge->get_current_user_id();
		if ( $user_id <= 0 ) {
			return new WP_Error( 'login_required', 'Please sign in to delete your account.', array( 'status' => 401 ) );
		}
		$p       = array_merge( (array) $request->get_params(), (array) $request->get_json_params() );
		$confirm = strtoupper( trim( (string) ( $p['confirm'] ?? $p['confirmation'] ?? '' ) ) );
		if ( 'DELETE' !== $confirm ) {
			return new WP_Error( 'confirmation_required', 'To delete your account, send confirm: "DELETE".', array( 'status' => 400 ) );
		}
		$user = get_user_by( 'id', $user_id );
		if ( ! $user ) {
			return new WP_Error( 'not_found', 'Account not found.', array( 'status' => 404 ) );
		}
		if ( $this->is_protected( $user ) ) {
			return new WP_Error( 'protected_account', 'Staff accounts can’t be deleted from the app. Please contact support.', array( 'status' => 403 ) );
		}
		$password = (string) ( $p['password'] ?? '' );
		if ( '' !== $password && ! wp_check_password( $password, $user->user_pass, $user->ID ) ) {
			return new WP_Error( 'wrong_password', 'That password is not correct.', array( 'status' => 403 ) );
		}
		$this->delete_account( $user );
		return new WP_REST_Response( array(
			'success' => true,
			'deleted' => true,
			'message' => 'Your account and personal data have been deleted.',
		), 200 );
	}

	/** Deletes the account. Shared by the endpoint and the web page. */
	public function delete_account( $user ) {
		global $wpdb;
		$user_id = (int) $user->ID;
		$email   = $user->user_email;
		$name    = $user->display_name ?: $user->user_login;

		// 1. Masteriyo learning records (enrollments, progress, quiz attempts, activity).
		foreach ( array( 'masteriyo_user_items' => 'user_id', 'masteriyo_user_activities' => 'user_id', 'masteriyo_quiz_attempts' => 'user_id', 'masteriyo_notifications' => 'user_id' ) as $t => $col ) {
			$table = $wpdb->prefix . $t;
			if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) !== $table ) {
				continue;
			}
			if ( 'masteriyo_user_items' === $t ) {
				$meta = $wpdb->prefix . 'masteriyo_user_itemmeta';
				if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $meta ) ) === $meta && $wpdb->get_var( "SHOW COLUMNS FROM {$meta} LIKE 'user_item_id'" ) ) {
					$wpdb->query( $wpdb->prepare( "DELETE m FROM {$meta} m INNER JOIN {$table} i ON i.id = m.user_item_id WHERE i.user_id = %d", $user_id ) );
				}
			}
			$wpdb->delete( $table, array( $col => $user_id ) );
		}

		// 2. Reviews, questions and replies: keep the content for other students, remove who wrote it.
		$where = $email ? $wpdb->prepare( 'user_id = %d OR comment_author_email = %s', $user_id, $email ) : $wpdb->prepare( 'user_id = %d', $user_id );
		$wpdb->query( $wpdb->prepare(
			"UPDATE {$wpdb->comments} SET comment_author = %s, comment_author_email = '', comment_author_url = '', comment_author_IP = '', comment_agent = '', user_id = 0 WHERE {$where}",
			'Former student'
		) );

		// 3. WooCommerce orders: kept for accounting, personal data removed.
		if ( function_exists( 'wc_get_orders' ) ) {
			$orders = array();
			foreach ( array_merge( wc_get_orders( array( 'customer_id' => $user_id, 'limit' => -1, 'status' => 'any' ) ), $email ? wc_get_orders( array( 'billing_email' => $email, 'limit' => -1, 'status' => 'any' ) ) : array() ) as $o ) {
				$orders[ $o->get_id() ] = $o;
			}
			foreach ( $orders as $order ) {
				if ( class_exists( 'WC_Privacy_Erasers' ) ) {
					WC_Privacy_Erasers::remove_order_personal_data( $order );
				}
				$order->set_customer_id( 0 );
				$order->add_order_note( 'Customer deleted their account; personal data removed.' );
				$order->save();
			}
		}

		// 4. The user itself (with all user meta: app tokens, avatar, progress, Play account ID, cart).
		require_once ABSPATH . 'wp-admin/includes/user.php';
		wp_delete_user( $user_id );
		if ( function_exists( 'WC' ) && WC()->session && method_exists( WC()->session, 'destroy_session' ) ) {
			WC()->session->destroy_session();
		}

		// 5. Confirmation email.
		if ( $email ) {
			wp_mail(
				$email,
				'Your Express Tech Academy account has been deleted',
				"Hi {$name},\n\nYour Express Tech Academy account and personal data have been deleted, as you asked. "
				. "Purchase records are kept for accounting without your name or contact details.\n\n"
				. "If you didn't ask for this, reply to this email.\n\nExpress Tech Academy"
			);
		}
		do_action( 'eta_account_deleted', $user_id, $email );
	}

	/* ------------------------------------------------------------------ web page (/delete-account/) */

	public function maybe_render_page() {
		$path = wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '', PHP_URL_PATH );
		if ( ! $path || untrailingslashit( $path ) !== untrailingslashit( self::PAGE_PATH ) ) {
			return;
		}
		do_action( 'litespeed_control_set_nocache', 'account deletion page' );
		nocache_headers();

		$state = 'form';
		$error = '';
		if ( 'POST' === ( $_SERVER['REQUEST_METHOD'] ?? '' ) && is_user_logged_in() ) {
			$user = wp_get_current_user();
			if ( ! wp_verify_nonce( $_POST['_wpnonce'] ?? '', 'eta_delete_account_' . $user->ID ) ) {
				$error = 'This page expired. Please try again.';
			} elseif ( 'DELETE' !== strtoupper( trim( (string) wp_unslash( $_POST['confirm'] ?? '' ) ) ) ) {
				$error = 'Type DELETE to confirm.';
			} elseif ( $this->is_protected( $user ) ) {
				$error = 'Staff accounts can’t be deleted here. Please contact support.';
			} else {
				wp_logout();
				$this->delete_account( $user );
				$state = 'done';
			}
		}
		$this->render( $state, $error );
		exit;
	}

	private function render( $state, $error ) {
		$logged_in = is_user_logged_in();
		$user      = $logged_in ? wp_get_current_user() : null;
		$login_url = wp_login_url( home_url( self::PAGE_PATH ) );
		header( 'Content-Type: text/html; charset=utf-8' );
		?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Delete your account | Express Tech Academy</title>
<style>
:root{--bg:#f6f6f7;--card:#fff;--text:#161616;--muted:#5f6368;--line:#e4e4e7;--danger:#dc2626;--field:#f4f4f5}
@media (prefers-color-scheme:dark){:root{--bg:#0e0e0e;--card:#161616;--text:#f5f5f5;--muted:#a3a3a3;--line:#2a2a2a;--danger:#f87171;--field:#0e0e0e}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--text);font:15px/1.6 "DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;padding:16px}
.card{width:100%;max-width:460px;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:28px 24px}
h1{font-size:22px;margin:0 0 8px}
p,li{color:var(--muted)}
ul{padding-left:20px;margin:12px 0}
label{display:block;font-weight:600;margin:16px 0 6px}
input[type=text]{width:100%;height:44px;border-radius:10px;border:1px solid var(--line);background:var(--field);color:var(--text);padding:0 12px;font:inherit}
button,.btn{display:inline-flex;align-items:center;justify-content:center;width:100%;height:48px;margin-top:16px;border:0;border-radius:999px;font:700 15px/1 inherit;cursor:pointer;text-decoration:none}
button{background:var(--danger);color:#fff}
.btn{background:linear-gradient(135deg,#fb923c,#ea580c);color:#fff}
.err{color:var(--danger);font-weight:600}
a{color:inherit}
</style>
</head>
<body>
<main class="card">
<?php if ( 'done' === $state ) : ?>
	<h1>Your account has been deleted</h1>
	<p>Your Express Tech Academy account and personal data are gone. We sent a confirmation to your email.</p>
	<a class="btn" href="<?php echo esc_url( home_url( '/' ) ); ?>">Back to the website</a>
<?php elseif ( ! $logged_in ) : ?>
	<h1>Delete your account</h1>
	<p>Sign in first, then come back to this page to delete your Express Tech Academy account. You can also delete it in the app under Profile → Delete account.</p>
	<a class="btn" href="<?php echo esc_url( $login_url ); ?>">Sign in</a>
	<p style="margin-top:16px">Can’t sign in? Email <a href="mailto:support@expressteck.tech">support@expressteck.tech</a> from your account’s email address and we’ll delete it for you.</p>
<?php else : ?>
	<h1>Delete your account</h1>
	<p>Signed in as <strong><?php echo esc_html( $user->user_email ); ?></strong>. Deleting your account:</p>
	<ul>
		<li>removes your profile, sign-in and course progress;</li>
		<li>removes your access to every course and bundle you bought;</li>
		<li>keeps your reviews and questions on the courses, shown as “Former student”;</li>
		<li>keeps purchase records for accounting, without your name or contact details.</li>
	</ul>
	<p><strong>This can’t be undone.</strong></p>
	<?php if ( $error ) : ?><p class="err"><?php echo esc_html( $error ); ?></p><?php endif; ?>
	<form method="post">
		<?php wp_nonce_field( 'eta_delete_account_' . $user->ID ); ?>
		<label for="confirm">Type DELETE to confirm</label>
		<input type="text" id="confirm" name="confirm" autocomplete="off" autocapitalize="characters" required>
		<button type="submit">Delete my account</button>
	</form>
<?php endif; ?>
</main>
</body>
</html>
<?php
	}
}
