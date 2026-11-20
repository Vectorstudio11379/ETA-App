<?php
/**
 * Google Play Billing for the Android app.
 *
 * The app sells courses and bundles through Google Play (one-time, non-consumable products).
 * The website keeps using Paystack.
 *
 *   GET  /wp-json/eta/v1/google-play/products   Play product ID for every course and bundle.
 *   GET  /wp-json/eta/v1/google-play/account    The student's obfuscated account ID for the purchase (signed in).
 *   POST /wp-json/eta/v1/google-play/verify     { product_id, purchase_token } after a purchase (signed in).
 *   POST /wp-json/eta/v1/google-play/webhook    Real-time developer notifications (Google Cloud Pub/Sub push).
 *
 * WordPress only grants access after Google's own Play Developer API confirms the purchase.
 * Refunds and revoked purchases (voided purchase notifications) remove the access again.
 *
 * Settings: WordPress admin -> Settings -> ETA Google Play (package name, service account key, webhook URL).
 */

defined( 'ABSPATH' ) || exit;

class ETA_Google_Play {

	const NS          = 'eta/v1';
	const OPT         = 'eta_google_play_settings';
	const KEY_OPT     = 'eta_google_play_service_account';
	const LOG_OPT     = 'eta_google_play_log';
	const RECORD_PFX  = '_eta_play_';
	const API         = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/';

	/** @var ETA_Mobile_API_Bridge */
	private $bridge;

	public function __construct( $bridge ) {
		$this->bridge = $bridge;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'admin_post_eta_google_play_save', array( $this, 'admin_save' ) );
		add_action( 'eta_google_play_retry_ack', array( $this, 'retry_ack' ), 10, 2 );
	}

	/* ------------------------------------------------------------------ settings */

	private function settings() {
		$s = get_option( self::OPT, array() );
		$s = is_array( $s ) ? $s : array();
		if ( empty( $s['package_name'] ) ) {
			$s['package_name'] = 'com.eta.app';
		}
		if ( empty( $s['webhook_secret'] ) ) {
			$s['webhook_secret'] = wp_generate_password( 40, false );
			update_option( self::OPT, $s, false );
		}
		return $s;
	}

	private function service_account() {
		$json = get_option( self::KEY_OPT, '' );
		$key  = is_string( $json ) ? json_decode( $json, true ) : null;
		return ( is_array( $key ) && ! empty( $key['client_email'] ) && ! empty( $key['private_key'] ) ) ? $key : null;
	}

	public function webhook_url() {
		return add_query_arg( 'key', $this->settings()['webhook_secret'], rest_url( self::NS . '/google-play/webhook' ) );
	}

	private function log( $event, $data = array() ) {
		$log = get_option( self::LOG_OPT, array() );
		$log = is_array( $log ) ? $log : array();
		array_unshift( $log, array( 'time' => current_time( 'mysql' ), 'event' => $event ) + $data );
		update_option( self::LOG_OPT, array_slice( $log, 0, 50 ), false );
	}

	/* ------------------------------------------------------------------ products */

	/** Play product ID for a course or bundle: course_<course id> / bundle_<bundle product id>, unless overridden. */
	public function play_product_id( $post_id, $type ) {
		$custom = (string) get_post_meta( $post_id, '_eta_play_product_id', true );
		return $custom ? strtolower( $custom ) : ( 'bundle' === $type ? 'bundle_' : 'course_' ) . (int) $post_id;
	}

	/** Every sellable course and bundle with its Play product ID. */
	public function catalog() {
		$items   = array();
		$courses = get_posts( array( 'post_type' => 'mto-course', 'post_status' => 'publish', 'posts_per_page' => 200, 'fields' => 'ids', 'orderby' => 'ID', 'order' => 'ASC' ) );
		foreach ( $courses as $cid ) {
			$price = (float) ( get_post_meta( $cid, '_price', true ) ?: 0 );
			$items[] = array(
				'product_id' => $this->play_product_id( $cid, 'course' ),
				'type'       => 'course',
				'id'         => (int) $cid,
				'title'      => html_entity_decode( get_the_title( $cid ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'course_ids' => array( (int) $cid ),
				'price_ngn'  => $price,
				'free'       => $price <= 0,
			);
		}
		foreach ( $this->bridge->get_bundle_product_ids() as $pid ) {
			list( $price ) = $this->bridge->get_bundle_prices( $pid );
			$items[] = array(
				'product_id' => $this->play_product_id( $pid, 'bundle' ),
				'type'       => 'bundle',
				'id'         => (int) $pid,
				'title'      => html_entity_decode( get_the_title( $pid ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'course_ids' => $this->bridge->get_bundle_course_ids( $pid ),
				'price_ngn'  => (float) $price,
				'free'       => (float) $price <= 0,
			);
		}
		return $items;
	}

	private function find_product( $product_id ) {
		$product_id = strtolower( trim( (string) $product_id ) );
		foreach ( $this->catalog() as $item ) {
			if ( $item['product_id'] === $product_id && ! $item['free'] && $item['course_ids'] ) {
				return $item;
			}
		}
		return null;
	}

	/* ------------------------------------------------------------------ account binding */

	/** Opaque per-student ID passed to Google Play as obfuscatedAccountId (no personal data). */
	public function account_id_for( $user_id ) {
		$id = (string) get_user_meta( $user_id, '_eta_play_account_id', true );
		if ( ! $id ) {
			$id = 'eta' . substr( hash_hmac( 'sha256', 'eta-play|' . (int) $user_id, wp_salt( 'auth' ) ), 0, 40 );
			update_user_meta( $user_id, '_eta_play_account_id', $id );
		}
		return $id;
	}

	private function user_for_account_id( $account_id ) {
		if ( ! $account_id ) {
			return 0;
		}
		$users = get_users( array( 'meta_key' => '_eta_play_account_id', 'meta_value' => (string) $account_id, 'number' => 1, 'fields' => 'ID' ) );
		return $users ? (int) $users[0] : 0;
	}

	/* ------------------------------------------------------------------ Google API */

	private function b64url( $data ) {
		return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
	}

	private function access_token() {
		$cached = get_transient( 'eta_google_play_token' );
		if ( $cached ) {
			return $cached;
		}
		$key = $this->service_account();
		if ( ! $key ) {
			return new WP_Error( 'play_not_configured', 'Google Play is not configured on the server (no service account key).' );
		}
		$now    = time();
		$header = $this->b64url( wp_json_encode( array( 'alg' => 'RS256', 'typ' => 'JWT' ) ) );
		$claims = $this->b64url( wp_json_encode( array(
			'iss'   => $key['client_email'],
			'scope' => 'https://www.googleapis.com/auth/androidpublisher',
			'aud'   => 'https://oauth2.googleapis.com/token',
			'iat'   => $now,
			'exp'   => $now + 3600,
		) ) );
		$sig = '';
		if ( ! openssl_sign( $header . '.' . $claims, $sig, $key['private_key'], OPENSSL_ALGO_SHA256 ) ) {
			return new WP_Error( 'play_key_invalid', 'The Google service account key could not sign a request.' );
		}
		$res = wp_remote_post( 'https://oauth2.googleapis.com/token', array(
			'timeout' => 20,
			'body'    => array(
				'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				'assertion'  => $header . '.' . $claims . '.' . $this->b64url( $sig ),
			),
		) );
		if ( is_wp_error( $res ) ) {
			return new WP_Error( 'play_unreachable', 'Could not reach Google to sign in.' );
		}
		$body = json_decode( wp_remote_retrieve_body( $res ), true );
		if ( empty( $body['access_token'] ) ) {
			return new WP_Error( 'play_auth_failed', 'Google rejected the service account key: ' . sanitize_text_field( $body['error_description'] ?? $body['error'] ?? 'unknown error' ) );
		}
		set_transient( 'eta_google_play_token', $body['access_token'], max( 60, (int) ( $body['expires_in'] ?? 3600 ) - 300 ) );
		return $body['access_token'];
	}

	private function api( $method, $path, $body = null ) {
		$token = $this->access_token();
		if ( is_wp_error( $token ) ) {
			return $token;
		}
		$args = array(
			'method'  => $method,
			'timeout' => 20,
			'headers' => array( 'Authorization' => 'Bearer ' . $token, 'Content-Type' => 'application/json' ),
		);
		if ( null !== $body ) {
			$args['body'] = wp_json_encode( $body );
		}
		$res = wp_remote_request( self::API . rawurlencode( $this->settings()['package_name'] ) . $path, $args );
		if ( is_wp_error( $res ) ) {
			return new WP_Error( 'play_unreachable', 'Could not reach Google Play. Please try again.', array( 'status' => 503 ) );
		}
		$code = (int) wp_remote_retrieve_response_code( $res );
		$data = json_decode( wp_remote_retrieve_body( $res ), true );
		if ( $code >= 400 ) {
			$msg = sanitize_text_field( $data['error']['message'] ?? 'HTTP ' . $code );
			return new WP_Error( 'play_api_error', 'Google Play: ' . $msg, array( 'status' => 404 === $code || 400 === $code ? 400 : 502, 'google_status' => $code ) );
		}
		return is_array( $data ) ? $data : array();
	}

	private function get_purchase( $product_id, $token ) {
		return $this->api( 'GET', '/purchases/products/' . rawurlencode( $product_id ) . '/tokens/' . rawurlencode( $token ) );
	}

	private function acknowledge( $product_id, $token ) {
		$res = $this->api( 'POST', '/purchases/products/' . rawurlencode( $product_id ) . '/tokens/' . rawurlencode( $token ) . ':acknowledge', new stdClass() );
		return ! is_wp_error( $res );
	}

	public function retry_ack( $product_id, $token ) {
		$p = $this->get_purchase( $product_id, $token );
		if ( ! is_wp_error( $p ) && 0 === (int) ( $p['purchaseState'] ?? -1 ) && 0 === (int) ( $p['acknowledgementState'] ?? 1 ) ) {
			$ok = $this->acknowledge( $product_id, $token );
			$this->log( $ok ? 'ack_retry_ok' : 'ack_retry_failed', array( 'product_id' => $product_id ) );
			if ( ! $ok ) {
				wp_schedule_single_event( time() + HOUR_IN_SECONDS, 'eta_google_play_retry_ack', array( $product_id, $token ) );
			}
		}
	}

	/* ------------------------------------------------------------------ purchase records */

	private function record_key( $token ) {
		return self::RECORD_PFX . md5( (string) $token );
	}

	private function get_record( $token ) {
		$r = get_option( $this->record_key( $token ), null );
		return is_array( $r ) ? $r : null;
	}

	private function save_record( $token, $record ) {
		update_option( $this->record_key( $token ), $record, false );
		if ( ! empty( $record['user_id'] ) ) {
			$list = get_user_meta( $record['user_id'], '_eta_play_purchases', true );
			$list = is_array( $list ) ? $list : array();
			$list[ md5( (string) $token ) ] = $record['product_id'];
			update_user_meta( $record['user_id'], '_eta_play_purchases', $list );
		}
	}

	/* ------------------------------------------------------------------ fulfilment */

	/**
	 * Check a purchase with Google and grant access. Shared by /verify and the webhook.
	 * $user_id = 0 means "find the student from the purchase's obfuscated account ID".
	 */
	private function fulfil( $product_id, $token, $user_id, $source ) {
		$item = $this->find_product( $product_id );
		if ( ! $item ) {
			return new WP_Error( 'unknown_product', 'This product is not sold in the app.', array( 'status' => 404 ) );
		}
		$record = $this->get_record( $token );
		if ( $record && $user_id > 0 && (int) $record['user_id'] > 0 && (int) $record['user_id'] !== $user_id ) {
			return new WP_Error( 'purchase_in_use', 'This purchase belongs to another account.', array( 'status' => 409 ) );
		}

		$p = $this->get_purchase( $item['product_id'], $token );
		if ( is_wp_error( $p ) ) {
			return $p;
		}
		$state = (int) ( $p['purchaseState'] ?? -1 );
		if ( 2 === $state ) {
			return array( 'success' => false, 'status' => 'pending', 'enrolled' => false, 'message' => 'Your payment is pending. Access unlocks automatically once Google Play confirms it.' );
		}
		if ( 0 !== $state ) {
			return new WP_Error( 'purchase_not_completed', 'Google Play reports this purchase as cancelled.', array( 'status' => 400 ) );
		}

		// Whose purchase is it? The app sets obfuscatedAccountId to the student's ID from /google-play/account.
		$account_id = (string) ( $p['obfuscatedExternalAccountId'] ?? '' );
		$owner      = $this->user_for_account_id( $account_id );
		if ( $user_id > 0 && $owner > 0 && $owner !== $user_id ) {
			return new WP_Error( 'purchase_in_use', 'This purchase was made from another account.', array( 'status' => 403 ) );
		}
		if ( $user_id <= 0 ) {
			$user_id = $owner ?: (int) ( $record['user_id'] ?? 0 );
		}
		if ( $user_id <= 0 ) {
			// Webhook arrived before the app reported the purchase; /verify will finish it.
			$this->save_record( $token, array( 'product_id' => $item['product_id'], 'user_id' => 0, 'state' => 'unclaimed', 'google_order_id' => (string) ( $p['orderId'] ?? '' ), 'time' => time() ) );
			return array( 'success' => false, 'status' => 'unclaimed', 'enrolled' => false, 'message' => 'Purchase recorded; waiting for the app to report it.' );
		}

		$order_id = (int) ( $record['order_id'] ?? 0 );
		if ( ! $order_id ) {
			$order_id = $this->create_order( $user_id, $item, $p );
		}
		$enrolled = $this->bridge->enroll_user_in_courses( $user_id, $item['course_ids'] );

		$acked = 1 === (int) ( $p['acknowledgementState'] ?? 0 );
		if ( ! $acked ) {
			$acked = $this->acknowledge( $item['product_id'], $token );
			if ( ! $acked && ! wp_next_scheduled( 'eta_google_play_retry_ack', array( $item['product_id'], $token ) ) ) {
				wp_schedule_single_event( time() + 10 * MINUTE_IN_SECONDS, 'eta_google_play_retry_ack', array( $item['product_id'], $token ) );
			}
		}

		$this->save_record( $token, array(
			'product_id'      => $item['product_id'],
			'user_id'         => $user_id,
			'course_ids'      => $item['course_ids'],
			'order_id'        => $order_id,
			'google_order_id' => (string) ( $p['orderId'] ?? '' ),
			'test_purchase'   => isset( $p['purchaseType'] ) && 0 === (int) $p['purchaseType'],
			'state'           => 'granted',
			'acknowledged'    => (bool) $acked,
			'time'            => time(),
		) );
		$this->log( 'granted', array( 'source' => $source, 'user_id' => $user_id, 'product_id' => $item['product_id'], 'order_id' => $order_id ) );

		return array(
			'success'      => true,
			'status'       => 'purchased',
			'verified'     => true,
			'enrolled'     => true,
			'product_id'   => $item['product_id'],
			'course_ids'   => $item['course_ids'],
			'unlocked_ids' => $enrolled,
			'order_id'     => $order_id,
			'acknowledged' => (bool) $acked,
			'message'      => 'Purchase verified. Your course is unlocked.',
		);
	}

	private function create_order( $user_id, $item, $p ) {
		if ( ! function_exists( 'wc_create_order' ) ) {
			return 0;
		}
		try {
			$order   = wc_create_order( array( 'customer_id' => $user_id ) );
			$pid     = 'bundle' === $item['type'] ? $item['id'] : (int) get_post_meta( $item['id'], '_wc_product_id', true );
			$product = $pid ? wc_get_product( $pid ) : false;
			if ( $product ) {
				$order->add_product( $product, 1 );
			}
			$user = get_user_by( 'id', $user_id );
			if ( $user ) {
				$order->set_address( array( 'first_name' => $user->display_name, 'email' => $user->user_email ), 'billing' );
			}
			$order->set_payment_method( 'google_play' );
			$order->set_payment_method_title( 'Google Play (Android app)' );
			$order->calculate_totals();
			$order->update_meta_data( '_eta_course_ids', $item['course_ids'] );
			$order->update_meta_data( '_eta_play_product_id', $item['product_id'] );
			$order->update_meta_data( '_eta_play_order_id', (string) ( $p['orderId'] ?? '' ) );
			$order->save();
			$order->payment_complete( (string) ( $p['orderId'] ?? '' ) );
			$order->add_order_note( sprintf( 'Paid with Google Play. Google order: %s. Price shown is the website price; Google Play charged the price set in Play Console.%s', $p['orderId'] ?? 'n/a', ( isset( $p['purchaseType'] ) && 0 === (int) $p['purchaseType'] ) ? ' TEST PURCHASE (no money charged).' : '' ) );
			if ( 'completed' !== $order->get_status() ) {
				$order->update_status( 'completed' );
			}
			return (int) $order->get_id();
		} catch ( \Exception $e ) {
			return 0;
		}
	}

	/** Refund / voided purchase: remove access unless another purchase still covers the course. */
	private function revoke( $token, $reason ) {
		$record = $this->get_record( $token );
		if ( ! $record || 'granted' !== ( $record['state'] ?? '' ) ) {
			if ( $record ) {
				$record['state'] = 'revoked';
				$this->save_record( $token, $record );
			}
			return;
		}
		$user_id = (int) $record['user_id'];
		$keep    = $this->courses_covered_elsewhere( $user_id, $token, (int) ( $record['order_id'] ?? 0 ) );
		$remove  = array_diff( array_map( 'intval', (array) $record['course_ids'] ), $keep );
		if ( $remove ) {
			global $wpdb;
			$table = $wpdb->prefix . 'masteriyo_user_items';
			foreach ( $remove as $cid ) {
				$wpdb->update( $table, array( 'status' => 'inactive', 'date_modified' => current_time( 'mysql' ) ), array( 'user_id' => $user_id, 'item_id' => $cid, 'item_type' => 'user_course' ) );
			}
			$cache = get_user_meta( $user_id, '_eta_enrolled_courses', true );
			if ( is_array( $cache ) ) {
				update_user_meta( $user_id, '_eta_enrolled_courses', array_values( array_diff( array_map( 'intval', $cache ), $remove ) ) );
			}
		}
		if ( ! empty( $record['order_id'] ) && function_exists( 'wc_get_order' ) ) {
			$order = wc_get_order( $record['order_id'] );
			if ( $order && 'refunded' !== $order->get_status() ) {
				$order->update_status( 'refunded', 'Google Play: ' . $reason . '. Course access removed.' );
			}
		}
		$record['state'] = 'revoked';
		$this->save_record( $token, $record );
		$this->log( 'revoked', array( 'user_id' => $user_id, 'product_id' => $record['product_id'], 'reason' => $reason, 'removed' => array_values( $remove ) ) );
	}

	/** Courses the student still has through other Play purchases or other paid orders. */
	private function courses_covered_elsewhere( $user_id, $token, $order_id ) {
		$keep = array();
		$list = get_user_meta( $user_id, '_eta_play_purchases', true );
		foreach ( (array) $list as $hash => $pid ) {
			if ( md5( (string) $token ) === $hash ) {
				continue;
			}
			$r = get_option( self::RECORD_PFX . $hash, null );
			if ( is_array( $r ) && 'granted' === ( $r['state'] ?? '' ) ) {
				$keep = array_merge( $keep, (array) $r['course_ids'] );
			}
		}
		if ( function_exists( 'wc_get_orders' ) ) {
			$orders = wc_get_orders( array( 'customer_id' => $user_id, 'status' => array( 'completed', 'processing' ), 'limit' => 100 ) );
			foreach ( $orders as $order ) {
				if ( (int) $order->get_id() === $order_id ) {
					continue;
				}
				$keep = array_merge( $keep, (array) $order->get_meta( '_eta_course_ids' ) );
				foreach ( $order->get_items() as $line ) {
					$pid = (int) $line->get_product_id();
					$keep = array_merge( $keep, $this->bridge->get_bundle_course_ids( $pid ) );
					global $wpdb;
					$cid = (int) $wpdb->get_var( $wpdb->prepare( "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key IN ('_wc_product_id','_product_id') AND meta_value = %s LIMIT 1", $pid ) );
					if ( $cid ) {
						$keep[] = $cid;
					}
				}
			}
		}
		return array_values( array_unique( array_map( 'intval', $keep ) ) );
	}

	/* ------------------------------------------------------------------ REST */

	public function register_routes() {
		register_rest_route( self::NS, '/google-play/products', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'rest_products' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NS, '/google-play/account', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'rest_account' ),
			'permission_callback' => '__return_true',
		) );
		foreach ( array( '/google-play/verify', '/checkout/verify-google-play', '/payment/google-play/verify' ) as $route ) {
			register_rest_route( self::NS, $route, array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'rest_verify' ),
				'permission_callback' => '__return_true',
			) );
		}
		register_rest_route( self::NS, '/google-play/webhook', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'rest_webhook' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function rest_products() {
		$items = array_values( array_filter( $this->catalog(), function ( $i ) { return ! $i['free'] && $i['course_ids']; } ) );
		return new WP_REST_Response( $items, 200 );
	}

	public function rest_account() {
		$user_id = $this->bridge->get_current_user_id();
		if ( $user_id <= 0 ) {
			return new WP_Error( 'login_required', 'Please sign in to buy courses.', array( 'status' => 401 ) );
		}
		return new WP_REST_Response( array( 'obfuscated_account_id' => $this->account_id_for( $user_id ) ), 200 );
	}

	public function rest_verify( WP_REST_Request $request ) {
		$user_id = $this->bridge->get_current_user_id();
		if ( $user_id <= 0 ) {
			return new WP_Error( 'login_required', 'Please sign in to unlock your purchase.', array( 'status' => 401 ) );
		}
		$p          = array_merge( (array) $request->get_params(), (array) $request->get_json_params() );
		$product_id = sanitize_text_field( $p['product_id'] ?? $p['productId'] ?? $p['sku'] ?? '' );
		$token      = trim( (string) ( $p['purchase_token'] ?? $p['purchaseToken'] ?? $p['token'] ?? '' ) );
		$package    = sanitize_text_field( $p['package_name'] ?? $p['packageName'] ?? '' );
		if ( ! $product_id || ! $token || ! preg_match( '/^[A-Za-z0-9._\-]{20,500}$/', $token ) ) {
			return new WP_Error( 'missing_purchase', 'product_id and purchase_token are required.', array( 'status' => 400 ) );
		}
		if ( $package && $package !== $this->settings()['package_name'] ) {
			return new WP_Error( 'wrong_package', 'This purchase was made in a different app.', array( 'status' => 400 ) );
		}
		$res = $this->fulfil( $product_id, $token, $user_id, 'app' );
		if ( is_wp_error( $res ) ) {
			$this->log( 'verify_failed', array( 'user_id' => $user_id, 'product_id' => $product_id, 'error' => $res->get_error_code() ) );
			return $res;
		}
		return new WP_REST_Response( $res, ! empty( $res['success'] ) ? 200 : 202 );
	}

	public function rest_webhook( WP_REST_Request $request ) {
		$secret = (string) $request->get_param( 'key' );
		if ( ! $secret || ! hash_equals( $this->settings()['webhook_secret'], $secret ) ) {
			return new WP_Error( 'forbidden', 'Invalid webhook key.', array( 'status' => 403 ) );
		}
		$body = json_decode( $request->get_body(), true );
		$data = isset( $body['message']['data'] ) ? json_decode( base64_decode( $body['message']['data'] ), true ) : null;
		if ( ! is_array( $data ) ) {
			return new WP_REST_Response( array( 'status' => 'ignored' ), 200 );
		}
		if ( ! empty( $data['packageName'] ) && $data['packageName'] !== $this->settings()['package_name'] ) {
			return new WP_REST_Response( array( 'status' => 'ignored', 'reason' => 'other package' ), 200 );
		}
		if ( isset( $data['testNotification'] ) ) {
			$this->log( 'test_notification' );
			return new WP_REST_Response( array( 'status' => 'ok', 'test' => true ), 200 );
		}

		if ( isset( $data['oneTimeProductNotification'] ) ) {
			$n     = $data['oneTimeProductNotification'];
			$type  = (int) ( $n['notificationType'] ?? 0 );
			$token = (string) ( $n['purchaseToken'] ?? '' );
			$sku   = (string) ( $n['sku'] ?? '' );
			if ( 1 === $type && $token && $sku ) { // ONE_TIME_PRODUCT_PURCHASED
				$res = $this->fulfil( $sku, $token, 0, 'webhook' );
				if ( is_wp_error( $res ) ) {
					$this->log( 'webhook_failed', array( 'product_id' => $sku, 'error' => $res->get_error_code() ) );
					// Ask Pub/Sub to retry only when Google or the network failed.
					$retry = in_array( $res->get_error_code(), array( 'play_unreachable', 'play_auth_failed' ), true );
					return new WP_REST_Response( array( 'status' => 'error', 'error' => $res->get_error_code() ), $retry ? 503 : 200 );
				}
				return new WP_REST_Response( array( 'status' => $res['status'] ), 200 );
			}
			if ( 2 === $type && $token ) { // ONE_TIME_PRODUCT_CANCELED (a pending purchase was cancelled)
				$this->revoke( $token, 'purchase cancelled' );
				return new WP_REST_Response( array( 'status' => 'cancelled' ), 200 );
			}
		}

		if ( isset( $data['voidedPurchaseNotification'] ) ) {
			$token = (string) ( $data['voidedPurchaseNotification']['purchaseToken'] ?? '' );
			if ( $token ) {
				$this->revoke( $token, 1 === (int) ( $data['voidedPurchaseNotification']['refundType'] ?? 1 ) ? 'refunded or charged back' : 'voided' );
			}
			return new WP_REST_Response( array( 'status' => 'revoked' ), 200 );
		}

		return new WP_REST_Response( array( 'status' => 'ignored' ), 200 );
	}

	/* ------------------------------------------------------------------ admin page */

	public function admin_menu() {
		add_options_page( 'ETA Google Play', 'ETA Google Play', 'manage_options', 'eta-google-play', array( $this, 'admin_page' ) );
	}

	public function admin_save() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Not allowed.' );
		}
		check_admin_referer( 'eta_google_play_save' );
		$s = $this->settings();
		$s['package_name'] = sanitize_text_field( wp_unslash( $_POST['package_name'] ?? $s['package_name'] ) );
		if ( ! empty( $_POST['regenerate_secret'] ) ) {
			$s['webhook_secret'] = wp_generate_password( 40, false );
		}
		update_option( self::OPT, $s, false );
		$msg = 'saved';
		$raw = trim( (string) wp_unslash( $_POST['service_account'] ?? '' ) );
		if ( '' !== $raw ) {
			$key = json_decode( $raw, true );
			if ( is_array( $key ) && ! empty( $key['client_email'] ) && ! empty( $key['private_key'] ) && openssl_pkey_get_private( $key['private_key'] ) ) {
				update_option( self::KEY_OPT, wp_json_encode( array( 'client_email' => $key['client_email'], 'private_key' => $key['private_key'] ) ), false );
				delete_transient( 'eta_google_play_token' );
			} else {
				$msg = 'badkey';
			}
		}
		if ( ! empty( $_POST['test_connection'] ) ) {
			delete_transient( 'eta_google_play_token' );
			$t   = $this->access_token();
			$msg = is_wp_error( $t ) ? 'testfail:' . rawurlencode( $t->get_error_message() ) : 'testok';
		}
		wp_safe_redirect( add_query_arg( array( 'page' => 'eta-google-play', 'msg' => $msg ), admin_url( 'options-general.php' ) ) );
		exit;
	}

	public function admin_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$s   = $this->settings();
		$key = $this->service_account();
		$msg = isset( $_GET['msg'] ) ? sanitize_text_field( wp_unslash( $_GET['msg'] ) ) : '';
		?>
		<div class="wrap">
			<h1>ETA Google Play</h1>
			<p>Android app purchases are checked with Google Play before a course is unlocked. The website keeps using Paystack.</p>
			<?php if ( 'saved' === $msg ) : ?><div class="notice notice-success"><p>Settings saved.</p></div><?php endif; ?>
			<?php if ( 'badkey' === $msg ) : ?><div class="notice notice-error"><p>That is not a valid service account JSON key. Paste the whole downloaded .json file.</p></div><?php endif; ?>
			<?php if ( 'testok' === $msg ) : ?><div class="notice notice-success"><p>Connected: Google accepted the service account key.</p></div><?php endif; ?>
			<?php if ( 0 === strpos( $msg, 'testfail:' ) ) : ?><div class="notice notice-error"><p><?php echo esc_html( rawurldecode( substr( $msg, 9 ) ) ); ?></p></div><?php endif; ?>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="eta_google_play_save">
				<?php wp_nonce_field( 'eta_google_play_save' ); ?>
				<table class="form-table" role="presentation">
					<tr><th><label for="package_name">App package name</label></th>
						<td><input name="package_name" id="package_name" class="regular-text" value="<?php echo esc_attr( $s['package_name'] ); ?>"><p class="description">The applicationId in Play Console, e.g. com.eta.app.</p></td></tr>
					<tr><th><label for="service_account">Service account key</label></th>
						<td><?php if ( $key ) : ?><p>Saved: <code><?php echo esc_html( $key['client_email'] ); ?></code>. Paste a new key only to replace it.</p><?php else : ?><p><strong>Not set.</strong></p><?php endif; ?>
							<textarea name="service_account" id="service_account" rows="5" class="large-text code" placeholder="Paste the service account .json key here" autocomplete="off"></textarea>
							<p class="description">The key is stored in the database and is never shown again.</p></td></tr>
					<tr><th>Webhook (Pub/Sub push) URL</th>
						<td><input class="large-text code" readonly value="<?php echo esc_attr( $this->webhook_url() ); ?>" onclick="this.select()">
							<p class="description">Use this as the push endpoint of the Pub/Sub subscription for real-time developer notifications. Keep it private: the key in it is the webhook password.</p>
							<label><input type="checkbox" name="regenerate_secret" value="1"> Make a new webhook key (update the Pub/Sub subscription afterwards)</label></td></tr>
				</table>
				<p><button class="button button-primary">Save</button> <button class="button" name="test_connection" value="1">Save and test connection</button></p>
			</form>
			<h2>Play product IDs</h2>
			<p>Create one <em>one-time product</em> in Play Console for each paid course and bundle, with exactly these product IDs.</p>
			<table class="widefat striped"><thead><tr><th>Product ID</th><th>Type</th><th>Title</th><th>Website price (NGN)</th></tr></thead><tbody>
			<?php foreach ( $this->catalog() as $i ) : if ( $i['free'] || ! $i['course_ids'] ) { continue; } ?>
				<tr><td><code><?php echo esc_html( $i['product_id'] ); ?></code></td><td><?php echo esc_html( $i['type'] ); ?></td><td><?php echo esc_html( $i['title'] ); ?></td><td><?php echo esc_html( number_format( $i['price_ngn'] ) ); ?></td></tr>
			<?php endforeach; ?>
			</tbody></table>
			<h2>Recent activity</h2>
			<table class="widefat striped"><thead><tr><th>Time</th><th>Event</th><th>Details</th></tr></thead><tbody>
			<?php foreach ( array_slice( (array) get_option( self::LOG_OPT, array() ), 0, 20 ) as $row ) : ?>
				<tr><td><?php echo esc_html( $row['time'] ?? '' ); ?></td><td><?php echo esc_html( $row['event'] ?? '' ); ?></td><td><code><?php echo esc_html( wp_json_encode( array_diff_key( $row, array( 'time' => 1, 'event' => 1 ) ) ) ); ?></code></td></tr>
			<?php endforeach; ?>
			</tbody></table>
		</div>
		<?php
	}
}
