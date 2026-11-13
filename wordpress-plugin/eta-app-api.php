<?php
/**
 * Plugin Name: ETA App Mobile API Bridge
 * Plugin URI: https://expressteck.tech
 * Description: Complete Mobile REST API Bridge for ETA React Native App providing Live Courses, Bundles, Instructors, Quizzes, Assignments, Unified Paystack Checkout, and Web Payment Endpoints.
 * Version: 2.1.0
 * Author: ETA App Team
 * Author URI: https://expressteck.tech
 * License: GPL2
 */

/**
 * Express Tech Academy - Mobile REST API Bridge
 *
 * Dedicated REST endpoints for the ETA React Native mobile application:
 * - Dynamic Course Catalog & Curriculum (Video lectures, Quizzes, Practical Assignments)
 * - Flagship Course Bundles
 * - Official Team / Instructors (Alex Mercer, Maya Chen, Dmitry Volkov, Ethan Brooks, Sofia Reyes)
 * - Dynamic Site Information, Announcements & Support Channels
 * - Student Enrollment & Progress Tracking
 * - Unified Paystack Checkout & Auto-Enrollment (using WooCommerce + Masteriyo database)
 *
 * Namespace: /wp-json/eta/v1/
 *
 * @package ExpressTechReact
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Cloudflare R2 Media Security Gateway & Dynamic Token Signer
require_once __DIR__ . '/cloudflare-media.php';

if ( ! class_exists( 'ETA_Mobile_API_Bridge' ) ) {

class ETA_Mobile_API_Bridge {

	const NAMESPACE = 'eta/v1';

	// App login tokens expire after 30 days without a fresh login.
	const TOKEN_TTL = 30 * DAY_IN_SECONDS;

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'rest_api_init', array( $this, 'add_cors_support' ) );
		add_action( 'template_redirect', array( $this, 'handle_maintenance_actions' ), 2 );
		add_action( 'template_redirect', array( $this, 'handle_web_payment_endpoints' ), 5 );
		add_filter( 'pre_get_avatar_data', array( $this, 'filter_custom_avatar_data' ), 10, 2 );
	}

	/**
	 * CORS headers support for web and mobile requests
	 */
	public function add_cors_support() {
		remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
		add_filter( 'rest_pre_serve_request', function( $value ) {
			header( 'Access-Control-Allow-Origin: *' );
			header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
			header( 'Access-Control-Allow-Credentials: true' );
			header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, X-Requested-With' );
			return $value;
		} );
	}

	/**
	 * Register all mobile REST routes
	 */
	public function register_routes() {
		// 1. Courses Catalog
		register_rest_route( self::NAMESPACE, '/courses', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_courses' ),
			'permission_callback' => '__return_true',
		) );

		// 2. Flagship Course Bundles
		register_rest_route( self::NAMESPACE, '/bundles', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_bundles' ),
			'permission_callback' => '__return_true',
		) );

		// 3. Official Leadership & Instructors (5 Team Members)
		register_rest_route( self::NAMESPACE, '/instructors', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_instructors' ),
			'permission_callback' => '__return_true',
		) );

		// 4. Dynamic Categories
		register_rest_route( self::NAMESPACE, '/categories', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_categories' ),
			'permission_callback' => '__return_true',
		) );

		// 5. Site Info & Support
		register_rest_route( self::NAMESPACE, '/site-info', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_site_info' ),
			'permission_callback' => '__return_true',
		) );

		// 6. Student's Enrolled Courses & Progress
		register_rest_route( self::NAMESPACE, '/my-courses', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_my_courses' ),
			'permission_callback' => '__return_true',
		) );

		// 6b. Course Curriculum & Modules
		register_rest_route( self::NAMESPACE, '/course-curriculum', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_course_curriculum_endpoint' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NAMESPACE, '/course-details', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_course_details_endpoint' ),
			'permission_callback' => '__return_true',
		) );

		// 7. Save Student Progress
		register_rest_route( self::NAMESPACE, '/progress', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_progress' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'save_progress' ),
				'permission_callback' => '__return_true',
			),
		) );

		// 8. Paystack Checkout Initialize
		register_rest_route( self::NAMESPACE, '/checkout/initialize-paystack', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'initialize_paystack_checkout' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NAMESPACE, '/payment/initialize', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'initialize_paystack_checkout' ),
			'permission_callback' => '__return_true',
		) );

		// 9. Paystack Payment Verification & Auto-Enrollment
		register_rest_route( self::NAMESPACE, '/checkout/verify-paystack', array(
			'methods'             => array( 'GET', 'POST' ),
			'callback'            => array( $this, 'verify_paystack_payment' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NAMESPACE, '/payment/verify', array(
			'methods'             => array( 'GET', 'POST' ),
			'callback'            => array( $this, 'verify_paystack_payment' ),
			'permission_callback' => '__return_true',
		) );

		// 9b. Payment Status Check
		register_rest_route( self::NAMESPACE, '/payment/status', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_payment_status' ),
			'permission_callback' => '__return_true',
		) );

		// 9c. Paystack Server Webhook
		register_rest_route( self::NAMESPACE, '/payment/webhook', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'handle_paystack_webhook' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NAMESPACE, '/checkout/paystack-webhook', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'handle_paystack_webhook' ),
			'permission_callback' => '__return_true',
		) );

		// 10. Student Registration
		register_rest_route( self::NAMESPACE, '/register', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'register_user' ),
			'permission_callback' => '__return_true',
		) );

		// 11. Student Login
		register_rest_route( self::NAMESPACE, '/login', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'login_user' ),
			'permission_callback' => '__return_true',
		) );

		// 11b. Google Authentication
		register_rest_route( self::NAMESPACE, '/auth/google', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'google_auth_user' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NAMESPACE, '/google-login', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'google_auth_user' ),
			'permission_callback' => '__return_true',
		) );
		// The mobile app posts { id_token } here.
		foreach ( array( array( 'lms/v1', '/google-auth' ), array( self::NAMESPACE, '/google-auth' ) ) as $g ) {
			register_rest_route( $g[0], $g[1], array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'google_auth_user' ),
				'permission_callback' => '__return_true',
			) );
		}

		// 12. Dynamic Instructors Directory
		register_rest_route( self::NAMESPACE, '/instructors', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_instructors' ),
			'permission_callback' => '__return_true',
		) );

		// 13. Student Profile (GET /profile, POST /profile, PUT /profile)
		register_rest_route( self::NAMESPACE, '/profile', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_user_profile' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => array( 'POST', 'PUT' ),
				'callback'            => array( $this, 'update_user_profile' ),
				'permission_callback' => '__return_true',
			),
		) );

		// 14. Cart Management (GET /cart, POST /cart)
		register_rest_route( self::NAMESPACE, '/cart', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_user_cart' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'save_user_cart' ),
				'permission_callback' => '__return_true',
			),
		) );

		// 15. Wishlist Management (GET /wishlist, POST /wishlist)
		register_rest_route( self::NAMESPACE, '/wishlist', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_user_wishlist' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'save_user_wishlist' ),
				'permission_callback' => '__return_true',
			),
		) );

		// 16. User Notifications (GET /notifications)
		register_rest_route( self::NAMESPACE, '/notifications', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_user_notifications' ),
			'permission_callback' => '__return_true',
		) );

		// 16b. Mark Notifications Read (POST /notifications/mark-read)
		register_rest_route( self::NAMESPACE, '/notifications/mark-read', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'mark_notifications_read' ),
			'permission_callback' => '__return_true',
		) );

		// 17. (Removed) /fix-cloudflare-media wrote uploaded code into the theme.
		//     Deploy theme files through Hostinger / FTP instead.

		// 18. Forgotten Password Flow (OTP Generation, Verification, & Reset)
		register_rest_route( self::NAMESPACE, '/auth/forgot-password', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'handle_forgot_password' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NAMESPACE, '/auth/lost-password', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'handle_forgot_password' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NAMESPACE, '/auth/verify-reset-code', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'handle_verify_reset_code' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NAMESPACE, '/auth/reset-password', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'handle_reset_password' ),
			'permission_callback' => '__return_true',
		) );

		// 19. Database Repair & Table Optimization
		register_rest_route( self::NAMESPACE, '/database-repair', array(
			'methods'             => array( 'GET', 'POST' ),
			'callback'            => array( $this, 'handle_database_repair_endpoint' ),
			'permission_callback' => array( $this, 'require_admin' ),
		) );

		// 20. Course Reviews & Ratings (GET /reviews, POST /reviews)
		register_rest_route( self::NAMESPACE, '/reviews', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_course_reviews' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'submit_course_review' ),
				'permission_callback' => '__return_true',
			),
		) );

		// 21. Course Q&A (GET /course-qa, POST /course-qa, aliases /qa)
		register_rest_route( self::NAMESPACE, '/course-qa', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_course_qa' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'submit_course_qa' ),
				'permission_callback' => '__return_true',
			),
		) );
		register_rest_route( self::NAMESPACE, '/qa', array(
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_course_qa' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'submit_course_qa' ),
				'permission_callback' => '__return_true',
			),
		) );
		// Reply to a question (POST /course-qa/reply, alias /qa/reply). Sign-in checked in the callback.
		foreach ( array( '/course-qa/reply', '/qa/reply' ) as $reply_route ) {
			register_rest_route( self::NAMESPACE, $reply_route, array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'submit_course_qa_reply' ),
				'permission_callback' => '__return_true',
			) );
		}
		// Other reply URL shapes apps commonly use, e.g. /course-qa/replies, /qa/answer,
		// /course-qa/222/reply, /questions/222/answers, /courses/979/qa/222/reply.
		$qa_base   = '(?:course-qa|qa|questions|course-questions|course_qa)';
		$qa_action = '(?:reply|replies|answer|answers|comment|comments)';
		foreach ( array(
			'/' . $qa_base . '/(?:replies|answer|answers|comment|comments|' . 'respond)',
			'/' . $qa_base . '/(?P<question_id>[^/]*)/' . $qa_action,
			'/courses?/(?P<course_id>\d+)/' . $qa_base . '/(?P<question_id>[^/]*)/' . $qa_action,
		) as $reply_route ) {
			register_rest_route( self::NAMESPACE, $reply_route, array(
				'methods'             => 'POST, PUT',
				'callback'            => array( $this, 'submit_course_qa_reply' ),
				'permission_callback' => '__return_true',
			) );
		}

		// 22. Student Certificates & Verification (GET /certificates, GET /my-certificates)
		register_rest_route( self::NAMESPACE, '/certificates', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_student_certificates' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NAMESPACE, '/my-certificates', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_student_certificates' ),
			'permission_callback' => '__return_true',
		) );
		// Signed certificate PDF download (link from /certificates, /my-courses, the website and emails).
		register_rest_route( self::NAMESPACE, '/certificates/download', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'download_certificate' ),
			'permission_callback' => '__return_true',
		) );
		register_rest_route( self::NAMESPACE, '/certificates/verify', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'verify_certificate_endpoint' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function handle_maintenance_actions() {
		if ( isset( $_GET['eta_action'] ) && 'database_repair' === $_GET['eta_action'] ) {
			$authorized = current_user_can( 'manage_options' );
			if ( ! $authorized ) {
				wp_die( 'Unauthorized maintenance request.', 'Unauthorized', array( 'response' => 403 ) );
			}
			$lock = get_transient( 'eta_db_repair_cooldown' );
			if ( $lock && ! $authorized ) {
				header( 'Content-Type: application/json; charset=utf-8' );
				echo wp_json_encode( array(
					'status'   => 'throttled',
					'message'  => 'Database repair ran recently. Cooldown active to protect database performance.',
					'last_run' => $lock,
				), JSON_PRETTY_PRINT );
				exit;
			}
			set_transient( 'eta_db_repair_cooldown', gmdate( 'Y-m-d H:i:s \U\T\C' ), 900 );
			$report = $this->execute_database_repair_and_optimization();
			header( 'Content-Type: application/json; charset=utf-8' );
			echo wp_json_encode( $report, JSON_PRETTY_PRINT );
			exit;
		}
	}

	public function handle_database_repair_endpoint( $request ) {
		$authorized = current_user_can( 'manage_options' );
		if ( ! $authorized ) {
			return new WP_REST_Response( array( 'error' => 'Unauthorized' ), 403 );
		}
		$lock = get_transient( 'eta_db_repair_cooldown' );
		if ( $lock && ! $authorized ) {
			return new WP_REST_Response( array(
				'status'   => 'throttled',
				'message'  => 'Database repair ran recently. Cooldown active to protect database performance.',
				'last_run' => $lock,
			), 429 );
		}
		set_transient( 'eta_db_repair_cooldown', gmdate( 'Y-m-d H:i:s \U\T\C' ), 900 );
		$report = $this->execute_database_repair_and_optimization();
		return new WP_REST_Response( $report, 200 );
	}

	public function execute_database_repair_and_optimization() {
		global $wpdb;
		@set_time_limit( 300 );
		@ini_set( 'memory_limit', '512M' );

		$start_time = microtime( true );

		$report = array(
			'status'                 => 'running',
			'timestamp'              => gmdate( 'Y-m-d H:i:s \U\T\C' ),
			'diagnostic_logs'        => array(),
			'table_repairs'          => array(),
			'table_optimizes'        => array(),
			'sessions_purged'        => 0,
			'cart_transients_purged' => 0,
			'expired_transients_purged' => 0,
			'actionscheduler'        => array(),
			'cart_benchmark'         => array(),
		);

		// 1. Collect recent diagnostic error logs before repairs (filtering out customer PII)
		$debug_log = WP_CONTENT_DIR . '/debug.log';
		if ( file_exists( $debug_log ) ) {
			$lines = @file( $debug_log );
			if ( is_array( $lines ) ) {
				$report['diagnostic_logs']['debug_log_tail'] = array_slice( $lines, -30 );
			}
		}

		$wc_logs_dir = WP_CONTENT_DIR . '/uploads/wc-logs';
		if ( is_dir( $wc_logs_dir ) ) {
			$files = @scandir( $wc_logs_dir );
			if ( is_array( $files ) ) {
				$log_files = array_filter( $files, function( $f ) { return substr( $f, -4 ) === '.log'; } );
				usort( $log_files, function( $a, $b ) use ( $wc_logs_dir ) {
					return filemtime( $wc_logs_dir . '/' . $b ) - filemtime( $wc_logs_dir . '/' . $a );
				} );

				foreach ( array_slice( $log_files, 0, 5 ) as $lf ) {
					// Omit transactional email and user-sensitive logs from diagnostic dump
					if ( false !== strpos( $lf, 'transactional-emails' ) ) {
						continue;
					}
					$lines = @file( $wc_logs_dir . '/' . $lf );
					if ( is_array( $lines ) ) {
						$err_lines = array_filter( $lines, function( $line ) {
							return ( stripos( $line, 'fatal' ) !== false || stripos( $line, 'error' ) !== false || stripos( $line, 'Commands out of sync' ) !== false || stripos( $line, 'duplicate' ) !== false );
						} );
						if ( ! empty( $err_lines ) ) {
							$report['diagnostic_logs'][ $lf ] = array_slice( array_values( $err_lines ), -15 );
						}
					}
				}
			}
		}

		// 2. Tables list for REPAIR and OPTIMIZE
		$tables = array(
			$wpdb->options,
			$wpdb->prefix . 'woocommerce_sessions',
			$wpdb->prefix . 'woocommerce_api_keys',
			$wpdb->prefix . 'woocommerce_attribute_taxonomies',
			$wpdb->prefix . 'woocommerce_downloadable_product_permissions',
			$wpdb->prefix . 'woocommerce_order_items',
			$wpdb->prefix . 'woocommerce_order_itemmeta',
			$wpdb->prefix . 'woocommerce_tax_rates',
			$wpdb->prefix . 'woocommerce_tax_rate_locations',
			$wpdb->prefix . 'woocommerce_shipping_zones',
			$wpdb->prefix . 'woocommerce_shipping_zone_locations',
			$wpdb->prefix . 'woocommerce_shipping_zone_methods',
			$wpdb->prefix . 'woocommerce_payment_tokens',
			$wpdb->prefix . 'woocommerce_payment_tokenmeta',
			$wpdb->prefix . 'woocommerce_log',
			$wpdb->prefix . 'actionscheduler_actions',
			$wpdb->prefix . 'actionscheduler_claims',
			$wpdb->prefix . 'actionscheduler_groups',
			$wpdb->prefix . 'actionscheduler_logs',
			$wpdb->posts,
			$wpdb->postmeta,
			$wpdb->users,
			$wpdb->usermeta,
		);

		// Ensure WooCommerce table schema exists
		if ( class_exists( 'WC_Install' ) && method_exists( 'WC_Install', 'create_tables' ) ) {
			WC_Install::create_tables();
		}

		// Ensure wp_woocommerce_attribute_taxonomies exists
		$attr_table = $wpdb->prefix . 'woocommerce_attribute_taxonomies';
		$attr_exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $wpdb->esc_like( $attr_table ) ) );
		if ( ! $attr_exists ) {
			$collate = $wpdb->get_charset_collate();
			$sql = "CREATE TABLE `{$attr_table}` (
				attribute_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				attribute_name varchar(200) NOT NULL,
				attribute_label varchar(200) NULL,
				attribute_type varchar(20) NOT NULL,
				attribute_orderby varchar(20) NOT NULL,
				attribute_public int(1) NOT NULL DEFAULT 1,
				PRIMARY KEY  (attribute_id),
				KEY attribute_name (attribute_name(20))
			) {$collate};";
			require_once ABSPATH . 'wp-admin/includes/upgrade.php';
			dbDelta( $sql );
		}

		// Ensure wp_woocommerce_sessions table exists
		$sess_table = $wpdb->prefix . 'woocommerce_sessions';
		$sess_exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $wpdb->esc_like( $sess_table ) ) );
		if ( ! $sess_exists ) {
			$collate = $wpdb->get_charset_collate();
			$sql = "CREATE TABLE `{$sess_table}` (
				session_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
				session_key char(32) NOT NULL,
				session_value longtext NOT NULL,
				session_expiry bigint(20) unsigned NOT NULL,
				PRIMARY KEY  (session_id),
				UNIQUE KEY session_key (session_key)
			) {$collate};";
			require_once ABSPATH . 'wp-admin/includes/upgrade.php';
			dbDelta( $sql );
		}

		// Execute REPAIR and OPTIMIZE on each table
		foreach ( $tables as $tbl ) {
			$exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $wpdb->esc_like( $tbl ) ) );
			if ( ! $exists ) {
				continue;
			}

			$rep = $wpdb->get_results( "REPAIR TABLE `{$tbl}`", ARRAY_A );
			$report['table_repairs'][ $tbl ] = $rep;

			$opt = $wpdb->get_results( "OPTIMIZE TABLE `{$tbl}`", ARRAY_A );
			$report['table_optimizes'][ $tbl ] = $opt;
		}

		// 3. Purge expired customer sessions
		if ( $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $sess_table ) ) ) {
			$now = time();
			$deleted_sessions = $wpdb->query( $wpdb->prepare( "DELETE FROM `{$sess_table}` WHERE session_expiry < %d", $now ) );
			$report['sessions_purged'] = ( false !== $deleted_sessions ) ? $deleted_sessions : 0;
		}

		// 4. Purge cart session transients from wp_options
		$deleted_cart_trans = $wpdb->query( "DELETE FROM `{$wpdb->options}` WHERE option_name LIKE '_transient_wc_session_%' OR option_name LIKE '_transient_timeout_wc_session_%'" );
		$report['cart_transients_purged'] = ( false !== $deleted_cart_trans ) ? $deleted_cart_trans : 0;

		// 5. Purge expired transients from wp_options
		$now = time();
		$expired_keys = $wpdb->get_col( $wpdb->prepare(
			"SELECT option_name FROM `{$wpdb->options}` WHERE option_name LIKE %s AND option_value < %d",
			'_transient_timeout_%',
			$now
		) );
		$purged_count = 0;
		if ( ! empty( $expired_keys ) ) {
			foreach ( $expired_keys as $t_timeout ) {
				$t_data = str_replace( '_transient_timeout_', '_transient_', $t_timeout );
				$wpdb->query( $wpdb->prepare( "DELETE FROM `{$wpdb->options}` WHERE option_name IN (%s, %s)", $t_timeout, $t_data ) );
				$purged_count++;
			}
		}
		$report['expired_transients_purged'] = $purged_count;

		// 6. ActionScheduler maintenance
		$as_actions = $wpdb->prefix . 'actionscheduler_actions';
		$as_logs    = $wpdb->prefix . 'actionscheduler_logs';
		$as_claims  = $wpdb->prefix . 'actionscheduler_claims';
		if ( $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $as_actions ) ) ) {
			$purged_claims = $wpdb->query( $wpdb->prepare( "DELETE FROM `{$as_claims}` WHERE claim_date_gmt < %s", gmdate( 'Y-m-d H:i:s', time() - 3600 ) ) );
			$wpdb->query( $wpdb->prepare( "UPDATE `{$as_actions}` SET claim_id = 0 WHERE claim_id NOT IN (SELECT claim_id FROM `{$as_claims}`)" ) );
			$seven_days_ago = gmdate( 'Y-m-d H:i:s', time() - ( 7 * DAY_IN_SECONDS ) );
			$purged_as = $wpdb->query( $wpdb->prepare( "DELETE FROM `{$as_actions}` WHERE status = 'complete' AND scheduled_date_gmt < %s", $seven_days_ago ) );
			$purged_as_logs = $wpdb->query( "DELETE FROM `{$as_logs}` WHERE action_id NOT IN (SELECT action_id FROM `{$as_actions}`)" );

			$report['actionscheduler'] = array(
				'expired_claims_purged'    => ( false !== $purged_claims ) ? $purged_claims : 0,
				'completed_actions_purged' => ( false !== $purged_as ) ? $purged_as : 0,
				'orphaned_logs_purged'     => ( false !== $purged_as_logs ) ? $purged_as_logs : 0,
			);
		}

		// 7. Reset WooCommerce Transient Versions & Object Caches
		if ( class_exists( 'WC_Cache_Helper' ) ) {
			WC_Cache_Helper::get_transient_version( 'shipping', true );
		}
		if ( function_exists( 'wc_delete_expired_transients' ) ) {
			wc_delete_expired_transients();
		}
		if ( function_exists( 'wp_cache_flush' ) ) {
			wp_cache_flush();
		}
		if ( class_exists( 'LiteSpeed\Purge' ) ) {
			\LiteSpeed\Purge::purge_all();
		}

		// 8. Benchmark WooCommerce Cart
		$b_start = microtime( true );
		$cart_count = 0;
		$cart_total = 0;
		if ( function_exists( 'WC' ) && WC()->cart ) {
			WC()->cart->get_cart();
			$cart_count = WC()->cart->get_cart_contents_count();
			$cart_total = wp_strip_all_tags( WC()->cart->get_cart_total() );
		}
		$report['cart_benchmark'] = array(
			'cart_contents_count' => $cart_count,
			'cart_total'          => $cart_total,
			'execution_ms'        => round( ( microtime( true ) - $b_start ) * 1000, 2 ),
		);

		$report['status'] = 'completed';
		$report['total_duration_seconds'] = round( microtime( true ) - $start_time, 3 );

		return $report;
	}

	/**
	 * Permission callback: logged-in administrators only (cookie + nonce, or
	 * a WordPress Application Password over HTTPS).
	 */
	public function require_admin() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Helper: Resolve current user ID from WordPress session or Bearer token
	 */
	private function get_current_user_id() {
		$user_id = get_current_user_id();
		if ( $user_id > 0 ) {
			return $user_id;
		}

		// Tokens are accepted from headers only (never the URL, where they end up in logs).
		$token       = '';
		$auth_header = isset( $_SERVER['HTTP_AUTHORIZATION'] ) ? $_SERVER['HTTP_AUTHORIZATION'] : ( isset( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] : '' );
		if ( preg_match( '/Bearer\s(\S+)/i', $auth_header, $matches ) ) {
			$token = sanitize_text_field( $matches[1] );
		} elseif ( isset( $_SERVER['HTTP_X_ETA_AUTH_TOKEN'] ) ) {
			$token = sanitize_text_field( $_SERVER['HTTP_X_ETA_AUTH_TOKEN'] );
		}

		if ( empty( $token ) ) {
			return 0;
		}

		global $wpdb;
		$found_id = (int) $wpdb->get_var( $wpdb->prepare(
			"SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key = '_eta_app_auth_token' AND meta_value = %s LIMIT 1",
			$token
		) );
		if ( ! $found_id ) {
			return 0;
		}

		$expires = (int) get_user_meta( $found_id, '_eta_app_auth_token_expires', true );
		if ( ! $expires ) {
			// Token issued before expiry existed: give it a fresh 30-day window.
			update_user_meta( $found_id, '_eta_app_auth_token_expires', time() + self::TOKEN_TTL );
		} elseif ( time() > $expires ) {
			delete_user_meta( $found_id, '_eta_app_auth_token' );
			delete_user_meta( $found_id, '_eta_app_auth_token_expires' );
			return 0;
		}

		return $found_id;
	}

	/**
	 * Helper: issue (or reuse) the user's app token and extend its expiry.
	 * $rotate = true always creates a new token, signing out other devices.
	 */
	private function issue_auth_token( $user_id, $rotate = false ) {
		$token   = get_user_meta( $user_id, '_eta_app_auth_token', true );
		$expires = (int) get_user_meta( $user_id, '_eta_app_auth_token_expires', true );
		if ( $rotate || empty( $token ) || ( $expires && time() > $expires ) ) {
			$token = wp_generate_password( 40, false );
			update_user_meta( $user_id, '_eta_app_auth_token', $token );
		}
		update_user_meta( $user_id, '_eta_app_auth_token_expires', time() + self::TOKEN_TTL );
		return $token;
	}

	/**
	 * GET /wp-json/eta/v1/courses
	 */
	public function get_courses( $request ) {
		$args = array(
			'post_type'      => array( 'mto-course', 'course' ),
			'post_status'    => 'publish',
			'posts_per_page' => 100,
			'orderby'        => 'date',
			'order'          => 'DESC',
		);

		$query = new WP_Query( $args );
		$courses = array();

		// Helper to build default curriculum including Quizzes and Practical Assignments
		$get_default_curriculum = function( $post_id, $title ) {
			return array(
				array(
					'id'              => 'sec_1',
					'title'           => 'Section 1: Foundations & Architecture',
					'lecturesCount'   => 4,
					'durationMinutes' => 45,
					'lessons'         => array(
						array(
							'id'          => 'les_1_1',
							'title'       => 'Introduction & Course Roadmap',
							'duration'    => '10m',
							'type'        => 'video',
							'videoUrl'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
							'isCompleted' => false,
						),
						array(
							'id'          => 'les_1_2',
							'title'       => 'Environment & Systems Setup',
							'duration'    => '15m',
							'type'        => 'video',
							'videoUrl'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
							'isCompleted' => false,
						),
						array(
							'id'          => 'les_1_3',
							'title'       => 'Foundational Knowledge Check',
							'duration'    => '10m',
							'type'        => 'quiz',
							'quizData'    => array(
								'passingScore' => 75,
								'questions'    => array(
									array(
										'q'       => 'What is the primary objective of this module track?',
										'options' => array(
											'To master real-world production engineering practices',
											'To skim theoretical overviews without implementation',
											'To use unverified third-party scripts',
											'None of the above'
										),
										'answer'  => 0,
									),
									array(
										'q'       => 'Which configuration ensures optimal data security and reliable processing?',
										'options' => array(
											'Hardcoding keys in client code',
											'Encrypted environment secrets with strict CORS policies',
											'Disabling authentication headers',
											'Open database ports'
										),
										'answer'  => 1,
									),
								),
							),
							'isCompleted' => false,
						),
						array(
							'id'          => 'les_1_4',
							'title'       => 'Hands-on Lab 1: Initial Workspace Setup',
							'duration'    => '10m',
							'type'        => 'assignment',
							'assignmentData' => array(
								'title'       => 'Initial Workspace & Tooling Verification',
								'description' => 'Initialize your project workspace, configure local dependencies, and document your initial verification checklist.',
								'rubric'      => 'Clean configuration files, zero runtime warnings, and verified API connectivity.',
							),
							'isCompleted' => false,
						),
					),
				),
				array(
					'id'              => 'sec_2',
					'title'           => 'Section 2: Core Practical Execution',
					'lecturesCount'   => 4,
					'durationMinutes' => 60,
					'lessons'         => array(
						array(
							'id'          => 'les_2_1',
							'title'       => 'Deep Dive & Production Architecture',
							'duration'    => '20m',
							'type'        => 'video',
							'videoUrl'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
							'isCompleted' => false,
						),
						array(
							'id'          => 'les_2_2',
							'title'       => 'Advanced Implementation & Best Practices',
							'duration'    => '20m',
							'type'        => 'video',
							'videoUrl'    => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
							'isCompleted' => false,
						),
						array(
							'id'          => 'les_2_3',
							'title'       => 'Mid-Course Practical Quiz',
							'duration'    => '10m',
							'type'        => 'quiz',
							'quizData'    => array(
								'passingScore' => 80,
								'questions'    => array(
									array(
										'q'       => 'How are high-volume operational requests handled cleanly?',
										'options' => array(
											'Blocking thread calls',
											'Asynchronous worker queues and cached responses',
											'Manual database resets',
											'Restarting server daemon constantly'
										),
										'answer'  => 1,
									),
								),
							),
							'isCompleted' => false,
						),
						array(
							'id'          => 'les_2_4',
							'title'       => 'Capstone Practical Assignment: End-to-End Build',
							'duration'    => '10m',
							'type'        => 'assignment',
							'assignmentData' => array(
								'title'       => 'Capstone Project Implementation',
								'description' => 'Build and deliver the complete production module according to the specification outlined in lesson 2.',
								'rubric'      => 'Correct architectural structure, working test coverage, and documentation.',
							),
							'isCompleted' => false,
						),
					),
				),
			);
		};

		// Enrollment flags come only from the login token, never from an email param.
		$user_id = $this->get_current_user_id();

		$enrolled_ids = array();
		if ( $user_id > 0 ) {
			$meta_enrolled = get_user_meta( $user_id, '_eta_enrolled_courses', true );
			if ( is_array( $meta_enrolled ) ) {
				$enrolled_ids = array_map( 'intval', $meta_enrolled );
			}
		}

		header( 'X-ETA-User-ID: ' . $user_id );
		header( 'X-ETA-Enrolled-Count: ' . count( $enrolled_ids ) );

		if ( $query->have_posts() ) {
			foreach ( $query->posts as $post ) {
				$post_id = $post->ID;
				$author  = get_the_author_meta( 'display_name', $post->post_author );

				$is_course_free = ( 'yes' === get_post_meta( $post_id, '_is_free', true ) || 'free' === get_post_meta( $post_id, '_access_mode', true ) );
				$raw_price      = get_post_meta( $post_id, '_price', true );
				$raw_reg_price  = get_post_meta( $post_id, '_regular_price', true );

				if ( $is_course_free || '0' === (string) $raw_price || 0 === $raw_price ) {
					$sale_price    = 0;
					$regular_price = ( '' !== $raw_reg_price && false !== $raw_reg_price && is_numeric( $raw_reg_price ) ) ? (int) $raw_reg_price : 0;
				} else {
					$sale_price    = ( '' !== $raw_price && false !== $raw_price && is_numeric( $raw_price ) ) ? (int) $raw_price : 15000;
					$regular_price = ( '' !== $raw_reg_price && false !== $raw_reg_price && is_numeric( $raw_reg_price ) ) ? (int) $raw_reg_price : max( $sale_price, 20000 );
				}

				$thumbnail = get_the_post_thumbnail_url( $post_id, 'large' );
				if ( ! $thumbnail && function_exists( 'eta_react_course_clean_thumbnail_url' ) ) {
					$thumbnail = eta_react_course_clean_thumbnail_url( $post_id );
				}
				if ( ! $thumbnail ) {
					$post_slug = get_post_field( 'post_name', $post_id );
					$title_low = strtolower( $post->post_title );
					if ( strpos( $post_slug, 'copywriting' ) !== false || strpos( $title_low, 'copywriting' ) !== false ) {
						$thumbnail = 'https://expressteck.tech/wp-content/themes/express-tech-react/assets/images/copywriting-course-thumbnail.jpg';
					} elseif ( strpos( $post_slug, 'content-writing' ) !== false || strpos( $title_low, 'content writing' ) !== false ) {
						$thumbnail = 'https://expressteck.tech/wp-content/themes/express-tech-react/assets/images/content-writing-course-thumbnail.jpg';
					} elseif ( strpos( $post_slug, 'graphic' ) !== false || strpos( $title_low, 'graphic' ) !== false ) {
						$thumbnail = 'https://expressteck.tech/wp-content/themes/express-tech-react/assets/images/graphic-design-course-thumbnail.jpg';
					} else {
						$thumbnail = 'https://expressteck.tech/wp-content/uploads/2026/10/Getting-Started-with-Masteriyo-LMS-1.jpg';
					}
				}

				// Resolve authentic category
				$categories = wp_get_post_terms( $post_id, array( 'mto_category', 'mto-course-category', 'course_category', 'category' ) );
				$cat_name   = ( ! empty( $categories ) && ! is_wp_error( $categories ) ) ? $categories[0]->name : '';

				if ( empty( $cat_name ) || 'Uncategorized' === $cat_name || 'Development' === $cat_name ) {
					$title_lower = strtolower( $post->post_title );
					if ( strpos( $title_lower, 'ai' ) !== false || strpos( $title_lower, 'prompt' ) !== false || strpos( $title_lower, 'n8n' ) !== false ) {
						$cat_name = 'AI & Emerging Tech';
					} elseif ( strpos( $title_lower, 'forex' ) !== false || strpos( $title_lower, 'paypal' ) !== false || strpos( $title_lower, 'trading' ) !== false || strpos( $title_lower, 'survey' ) !== false ) {
						$cat_name = 'Remote Work & Global Finance';
					} elseif ( strpos( $title_lower, 'youtube' ) !== false || strpos( $title_lower, 'smm' ) !== false || strpos( $title_lower, 'creator' ) !== false || strpos( $title_lower, 'social' ) !== false ) {
						$cat_name = 'Digital Media & Growth';
					} elseif ( strpos( $title_lower, 'copywriting' ) !== false || strpos( $title_lower, 'content' ) !== false || strpos( $title_lower, 'writing' ) !== false || strpos( $title_lower, 'graphic' ) !== false || strpos( $title_lower, 'design' ) !== false ) {
						$cat_name = 'Creative & Content Strategy';
					} else {
						$cat_name = 'Build Your First Course';
					}
				}

				$is_enrolled   = in_array( (int) $post_id, $enrolled_ids, true );
				$progress_data = $user_id > 0 ? get_user_meta( $user_id, '_eta_app_course_progress', true ) : array();
				$progress_val  = 0; // Set below, once the curriculum is loaded.

				$resolved_mods = $this->resolve_course_modules( $post_id );
				if ( $is_enrolled && is_array( $progress_data ) ) {
					$progress_val = $this->course_progress_percent( $progress_data[ $post_id ] ?? array(), $resolved_mods );
				}
				$product_id    = get_post_meta( $post_id, '_wc_product_id', true ) ?: ( get_post_type( $post_id ) === 'product' ? $post_id : '' );

				$courses[] = array(
					'id'            => (string) $post_id,
					'product_id'    => $product_id ? (string) $product_id : '',
					'slug'          => $post->post_name,
					'title'         => html_entity_decode( $post->post_title, ENT_QUOTES, 'UTF-8' ),
					'instructor'    => ( $author && strpos( $author, '@' ) === false ) ? $author : 'Express Tech Academy',
					'category'      => $cat_name,
					'originalPrice' => (string) (int) $regular_price,
					'price'         => (string) (int) $sale_price,
					'discount'      => $regular_price > $sale_price ? (int) round( ( ( $regular_price - $sale_price ) / $regular_price ) * 100 ) : 0,
					'studentsCount' => 120,
					'rating'        => round( (float) get_post_meta( $post_id, '_masteriyo_average_rating', true ) ?: 4.9, 1 ),
					'reviewsCount'  => (int) get_post_meta( $post_id, '_masteriyo_review_count', true ) ?: 42,
					'hasCertificate'=> true,
					'daysLeft'      => 5,
					'thumbnail'     => $thumbnail,
					'description'   => wp_strip_all_tags( $post->post_excerpt ?: wp_trim_words( $post->post_content, 30 ) ),
					'isEnrolled'    => $is_enrolled,
					'progress'      => $progress_val,
					'modules'       => ! empty( $resolved_mods ) ? $resolved_mods : $get_default_curriculum( $post_id, $post->post_title ),
					'requirements'  => array(
						'Computer, laptop, or mobile device with internet access',
						'Commitment to practical, hands-on project assignments',
					),
				);
			}
		}

		return new WP_REST_Response( $courses, 200 );
	}

	/**
	 * GET /wp-json/eta/v1/bundles
	 * Flagship Bundles matching the live website
	 */
	public function get_bundles( $request ) {
		$bundles = array();
		$user_id = $this->get_current_user_id();
		$owned   = $user_id ? $this->get_active_course_ids( $user_id ) : array();
		foreach ( $this->get_bundle_product_ids() as $product_id ) {
			$bundle = $this->build_bundle_payload( $product_id );
			if ( $bundle ) {
				$ids                       = array_map( 'intval', (array) $bundle['course_ids'] );
				$have                      = array_values( array_intersect( $ids, $owned ) );
				$bundle['isEnrolled']      = $user_id > 0 && ! empty( $ids ) && count( $have ) === count( $ids );
				$bundle['is_purchased']    = $bundle['isEnrolled'];
				$bundle['owned_course_ids'] = $have;
				$bundle['bundleBadge']      = $bundle['badge'];
				$bundles[]                 = $bundle;
			}
		}

		// A plain list, like /courses, /categories and /instructors.
		return new WP_REST_Response( $bundles, 200 );
	}

	/**
	 * Helper: a post title as plain text for JSON ("&amp;" -> "&").
	 */
	private function plain_title( $post_id ) {
		return html_entity_decode( get_the_title( $post_id ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	}

	/**
	 * Helper: IDs of the published WooCommerce bundle products sold on the website
	 * (products that list their courses in _penithun_bundle_courses / _courses).
	 */
	private function get_bundle_product_ids() {
		$meta_key = defined( 'PENITHUN_BC_META' ) ? PENITHUN_BC_META : '_penithun_bundle_courses';
		$ids      = get_posts( array(
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => 50,
			'orderby'        => 'ID',
			'order'          => 'ASC',
			'fields'         => 'ids',
			'meta_query'     => array(
				'relation' => 'OR',
				array( 'key' => $meta_key, 'compare' => 'EXISTS' ),
				array( 'key' => '_masteriyo_bundle_id', 'compare' => 'EXISTS' ),
			),
		) );
		return array_values( array_filter( array_map( 'intval', (array) $ids ), function( $id ) {
			return ! empty( $this->get_bundle_course_ids( $id ) );
		} ) );
	}

	/**
	 * Helper: the WooCommerce product ID for a bundle, given either the product ID
	 * or the Masteriyo bundle (mto-bundle) ID. Returns 0 when the ID is not a bundle.
	 */
	private function resolve_bundle_product_id( $id ) {
		$id   = (int) $id;
		$type = $id ? get_post_type( $id ) : '';
		if ( 'product' === $type ) {
			return $id;
		}
		if ( in_array( $type, array( 'mto-bundle', 'mto-course-bundle' ), true ) ) {
			return (int) get_post_meta( $id, '_wc_product_id', true );
		}
		return 0;
	}

	/**
	 * Helper: Masteriyo course IDs inside a bundle (product or mto-bundle ID).
	 * Empty array when the ID is not a bundle.
	 */
	private function get_bundle_course_ids( $id ) {
		$product_id = $this->resolve_bundle_product_id( $id );
		if ( ! $product_id ) {
			return array();
		}
		$meta_key = defined( 'PENITHUN_BC_META' ) ? PENITHUN_BC_META : '_penithun_bundle_courses';
		$ids      = (array) get_post_meta( $product_id, $meta_key, true );
		if ( ! array_filter( $ids ) ) {
			$ids = (array) get_post_meta( $product_id, '_courses', true );
		}
		if ( ! array_filter( $ids ) ) {
			$mto_id = (int) get_post_meta( $product_id, '_masteriyo_bundle_id', true );
			$ids    = $mto_id ? (array) get_post_meta( $mto_id, '_courses', true ) : array();
		}
		return array_values( array_unique( array_filter( array_map( 'intval', $ids ), function( $cid ) {
			return $cid > 0 && 'mto-course' === get_post_type( $cid );
		} ) ) );
	}

	/**
	 * Helper: current price of a bundle product (NGN), from WooCommerce.
	 */
	private function get_bundle_prices( $product_id ) {
		$product = function_exists( 'wc_get_product' ) ? wc_get_product( $product_id ) : false;
		if ( $product ) {
			$price   = (float) $product->get_price();
			$regular = (float) $product->get_regular_price();
		} else {
			$price   = (float) get_post_meta( $product_id, '_price', true );
			$regular = (float) get_post_meta( $product_id, '_regular_price', true );
		}
		return array( $price, max( $regular, $price ) );
	}

	/**
	 * Helper: the /bundles payload for one bundle product.
	 */
	/**
	 * Helper: course IDs this user can open right now (active Masteriyo enrollments).
	 */
	private function get_active_course_ids( $user_id ) {
		global $wpdb;
		$table = $wpdb->prefix . 'masteriyo_user_items';
		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) !== $table ) {
			return array();
		}
		return array_map( 'intval', $wpdb->get_col( $wpdb->prepare(
			"SELECT DISTINCT item_id FROM {$table} WHERE user_id = %d AND item_type = 'user_course' AND status IN ('active', 'enrolled', 'progress', 'completed')",
			(int) $user_id
		) ) );
	}

	/**
	 * One-time repair: re-run enrollment for every paid app order, so buyers whose
	 * enrollment was left inactive get access, and attach them to their orders.
	 */
	public function repair_paid_app_orders() {
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return array();
		}
		$report = array();
		$orders = wc_get_orders( array(
			'status'         => array( 'processing', 'completed' ),
			'payment_method' => 'paystack',
			'limit'          => 300,
			'orderby'        => 'date',
			'order'          => 'DESC',
		) );
		foreach ( $orders as $order ) {
			$oid = $order->get_id();
			$ref = get_post_meta( $oid, '_paystack_txn_ref', true );
			$rec = $ref ? $this->get_txn_record( $ref ) : null;
			if ( ! $rec || (int) $rec['order_id'] !== $oid ) {
				continue; // Not an app checkout.
			}
			$uid = (int) ( $rec['user_id'] ?? 0 );
			if ( $uid <= 0 && ! empty( $rec['email'] ) ) {
				$u   = get_user_by( 'email', $rec['email'] );
				$uid = $u ? (int) $u->ID : 0;
			}
			if ( $uid <= 0 ) {
				$report[ $oid ] = 'no user';
				continue;
			}
			if ( (int) $order->get_customer_id() !== $uid ) {
				$order->set_customer_id( $uid );
				$order->save();
			}
			if ( 'processing' === $order->get_status() ) {
				$order->update_status( 'completed', 'Course access unlocked by the app checkout (repair).' );
			}
			$this->enroll_user_in_courses( $uid, (array) $rec['course_ids'] );
			$report[ $oid ] = array( 'user' => $uid, 'courses' => array_map( 'intval', (array) $rec['course_ids'] ) );
		}
		return $report;
	}

	private function build_bundle_payload( $product_id ) {
		$post = get_post( $product_id );
		if ( ! $post ) {
			return null;
		}
		$course_ids = $this->get_bundle_course_ids( $product_id );
		list( $price, $regular ) = $this->get_bundle_prices( $product_id );
		$savings = max( 0, $regular - $price );
		$percent = $regular > 0 ? (int) round( $savings / $regular * 100 ) : 0;

		$courses = array();
		foreach ( $course_ids as $cid ) {
			$c_price   = (float) get_post_meta( $cid, '_price', true );
			$c_regular = (float) get_post_meta( $cid, '_regular_price', true );
			$courses[] = array(
				'id'            => $cid,
				'title'         => $this->plain_title( $cid ),
				'slug'          => get_post_field( 'post_name', $cid ),
				'price'         => $c_price,
				'regular_price' => max( $c_regular, $c_price ),
				'thumbnail'     => get_the_post_thumbnail_url( $cid, 'medium' ) ?: '',
			);
		}

		$mto_id    = (int) get_post_meta( $product_id, '_masteriyo_bundle_id', true );
		$page_url  = $mto_id && 'publish' === get_post_status( $mto_id ) ? get_permalink( $mto_id ) : get_permalink( $product_id );
		$thumbnail = get_the_post_thumbnail_url( $product_id, 'large' ) ?: ( $mto_id ? get_the_post_thumbnail_url( $mto_id, 'large' ) : '' );
		$desc      = $post->post_excerpt ?: wp_strip_all_tags( $post->post_content );
		$badge     = $percent > 0 ? sprintf( 'Save %d%%', $percent ) : 'Bundle';

		return array(
			'id'               => (int) $product_id,
			'bundle_id'        => (int) $product_id,
			'product_id'       => (int) $product_id,
			'masteriyo_bundle_id' => $mto_id ?: null,
			'slug'             => $post->post_name,
			'title'            => $this->plain_title( $product_id ),
			'instructor'       => 'Express Tech Academy / Coach Denis',
			'category'         => 'Course Bundle',
			'original_price'   => $regular,
			'originalPrice'    => $regular,
			'regular_price'    => $regular,
			'price'            => $price,
			'sale_price'       => $price,
			'savings_amount'   => $savings,
			'savings_percent'  => $percent,
			'discount'         => $percent,
			'currency'         => 'NGN',
			'currency_symbol'  => '₦',
			'isBundle'         => true,
			'is_bundle'        => true,
			'bundleBadge'      => $badge,
			'badge'            => $badge,
			'thumbnail'        => $thumbnail,
			'description'      => $desc,
			'course_ids'       => $course_ids,
			'courses_count'    => count( $courses ),
			'packages'         => wp_list_pluck( $courses, 'title' ),
			'courses'          => $courses,
			'checkout_url'     => $page_url,
			'enrollment_url'   => $page_url,
		);
	}


	/**
	 * GET /wp-json/eta/v1/categories
	 */
	public function get_categories( $request ) {
		$categories = array(
			array( 'id' => 'cat_1', 'name' => 'AI & Emerging Tech', 'icon' => 'sparkles' ),
			array( 'id' => 'cat_2', 'name' => 'Remote Work & Global Finance', 'icon' => 'globe' ),
			array( 'id' => 'cat_3', 'name' => 'Digital Media & Growth', 'icon' => 'video' ),
			array( 'id' => 'cat_4', 'name' => 'Build Your First Course', 'icon' => 'book-open' ),
			array( 'id' => 'cat_5', 'name' => 'Customize & Automate Your Platform', 'icon' => 'sliders' ),
			array( 'id' => 'cat_6', 'name' => 'Engage & Retain Your Learners', 'icon' => 'users' ),
		);
		return new WP_REST_Response( $categories, 200 );
	}

	/**
	 * GET /wp-json/eta/v1/site-info
	 */
	public function get_site_info( $request ) {
		$info = array(
			'promoText'          => 'Limited Time Offer — Save up to 70% Across All Academy Tracks!',
			'tagline'            => 'Production-First Tech Education',
			'googleClientId'     => function_exists( 'eta_react_google_client_id' ) ? eta_react_google_client_id() : ( defined( 'ETA_GOOGLE_CLIENT_ID' ) ? ETA_GOOGLE_CLIENT_ID : '1075070762182-vlf41rha8ctjckt9ig2bnv28otd3n10l.apps.googleusercontent.com' ),
			'googleLoginEnabled' => true,
			'contactEmail'       => 'support@expressteck.tech',
			'whatsappNumber'     => '2348000000000',
			'avgResponseTime'    => '< 24 Hours',
			'supportModel'       => '1-on-1 Dedicated Mentorship & Resolution',
			'corePrinciples'     => array(
				array( 'title' => 'Production-First Approach', 'text' => 'Every lesson focuses on patterns, frameworks, and architecture used by modern engineering teams today.' ),
				array( 'title' => 'Total Schedule Agility', 'text' => 'Self-paced modules accommodate busy schedules without sacrificing technical depth or course completeness.' ),
				array( 'title' => 'Curated Clarity', 'text' => 'We strip away unnecessary jargon and cognitive overhead so you can focus entirely on understanding core principles.' ),
				array( 'title' => 'Measurable Growth', 'text' => 'Each track includes milestone assessments and project checkpoints to ensure true mastery of key topics.' ),
			),
			'faqs'               => array(
				array(
					'q' => 'How quickly can I begin after payment?',
					'a' => 'Instantly! Once payment is confirmed by Paystack, your courses are automatically unlocked in your My Courses dashboard with immediate access.',
				),
				array(
					'q' => 'Are certificates issued upon completion?',
					'a' => 'Yes. Upon passing all module quizzes and completing required practical assignments, your official Express Tech Academy Certificate is generated at no extra charge.',
				),
				array(
					'q' => 'Can I download lessons for offline playback on mobile?',
					'a' => 'Yes! The ETA mobile app supports saving lessons and lecture project files for uninterrupted offline learning.',
				),
				array(
					'q' => 'How do Course Bundles work?',
					'a' => 'Course Bundles combine related masterclasses at a huge discount (up to 57% off). Enrolling in a bundle grants automatic enrollment into all included courses.',
				),
			),
		);
		return new WP_REST_Response( $info, 200 );
	}

	/**
	 * GET /wp-json/eta/v1/my-courses
	 * Returns courses enrolled for the current student
	 */
	public function get_my_courses( $request ) {
		$user_id = $this->get_current_user_id();
		if ( ! $user_id ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Authentication required. Please provide a valid Bearer token.',
			), 401 );
		}

		$enrolled_courses = array();

		global $wpdb;
		$db_course_ids = array();

		// 1. Check Masteriyo official user items table (masteriyo_user_items)
		$table_user_items = $wpdb->prefix . 'masteriyo_user_items';
		if ( $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $table_user_items ) ) === $table_user_items ) {
			$rows = $wpdb->get_results( $wpdb->prepare(
				"SELECT DISTINCT item_id FROM {$table_user_items} WHERE user_id = %d AND item_type = 'user_course' AND status IN ('active', 'enrolled', 'progress', 'completed')",
				$user_id
			) );
			if ( ! empty( $rows ) ) {
				foreach ( $rows as $r ) {
					$db_course_ids[] = (int) $r->item_id;
				}
			}
		}

		// 2. Check Masteriyo core helper if active
		if ( function_exists( 'masteriyo_get_all_user_course_ids' ) ) {
			$mto_cids = masteriyo_get_all_user_course_ids( $user_id );
			if ( ! empty( $mto_cids ) && is_array( $mto_cids ) ) {
				foreach ( $mto_cids as $mid ) {
					$db_course_ids[] = (int) $mid;
				}
			}
		}

		// 3. Check WooCommerce completed and processing customer orders
		if ( function_exists( 'wc_get_orders' ) ) {
			$wc_orders = wc_get_orders( array(
				'customer_id' => $user_id,
				'status'      => array( 'completed', 'processing' ),
				'limit'       => -1,
			) );
			if ( ! empty( $wc_orders ) ) {
				foreach ( $wc_orders as $wc_o ) {
					foreach ( $wc_o->get_items() as $item ) {
						$pid = $item->get_product_id();
						$cid = get_post_meta( $pid, '_masteriyo_course_id', true );
						if ( $cid ) {
							$db_course_ids[] = (int) $cid;
						}
					}
					$meta_cids = get_post_meta( $wc_o->get_id(), '_eta_course_ids', true );
					if ( is_array( $meta_cids ) ) {
						foreach ( $meta_cids as $mcid ) {
							$db_course_ids[] = (int) $mcid;
						}
					}
				}
			}
		}

		// 4. Check user meta manual cache
		$manual_ids = get_user_meta( $user_id, '_eta_enrolled_courses', true );
		if ( ! is_array( $manual_ids ) ) {
			$manual_ids = array();
		}
		$all_enrolled_ids = array_values( array_unique( array_filter( array_merge( $db_course_ids, $manual_ids ) ) ) );

		// Auto-sync back to user meta so both mobile app and web stay in lockstep
		if ( ! empty( $all_enrolled_ids ) ) {
			update_user_meta( $user_id, '_eta_enrolled_courses', $all_enrolled_ids );
		}

		$listed_course_ids = array();
		if ( ! empty( $all_enrolled_ids ) ) {
			foreach ( $all_enrolled_ids as $c_id ) {
				$real_mto_cid = (int) $c_id;
				$linked_mto = get_post_meta( $c_id, '_masteriyo_course_id', true ) ?: get_post_meta( $c_id, '_course_id', true );
				if ( ! $linked_mto && get_post_type( $c_id ) === 'product' ) {
					global $wpdb;
					$linked_mto = $wpdb->get_var( $wpdb->prepare(
						"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key IN ('_wc_product_id', '_product_id') AND meta_value = %s LIMIT 1",
						$c_id
					) );
				}
				if ( $linked_mto ) {
					$real_mto_cid = (int) $linked_mto;
				}

				// One entry per published course: product IDs and course IDs resolve to the same course,
				// and bundle records or unpublished (draft) courses are not listed.
				if ( isset( $listed_course_ids[ $real_mto_cid ] ) || 'mto-course' !== get_post_type( $real_mto_cid ) || 'publish' !== get_post_status( $real_mto_cid ) ) {
					continue;
				}
				$listed_course_ids[ $real_mto_cid ] = true;
				$post = get_post( $real_mto_cid );
				if ( $post ) {
					$thumb = get_the_post_thumbnail_url( $real_mto_cid, 'large' ) ?: get_the_post_thumbnail_url( $c_id, 'large' ) ?: 'https://expressteck.tech/wp-content/uploads/2026/10/Getting-Started-with-Masteriyo-LMS-1.jpg';
					$progress_data = get_user_meta( $user_id, '_eta_app_course_progress', true );
					$course_mods = $this->resolve_course_modules( $real_mto_cid );
					$course_prog = $this->course_progress_percent( is_array( $progress_data ) ? ( $progress_data[ $real_mto_cid ] ?? array() ) : array(), $course_mods );
					$prod_id = get_post_meta( $real_mto_cid, '_wc_product_id', true ) ?: ( get_post_type( $c_id ) === 'product' ? $c_id : '' );

					$enrolled_courses[] = array(
						'id'            => (string) $real_mto_cid,
						'product_id'    => $prod_id ? (string) $prod_id : '',
						'slug'          => $post->post_name,
						'title'         => html_entity_decode( $post->post_title, ENT_QUOTES, 'UTF-8' ),
						'instructor'    => 'Express Tech Academy',
						'category'      => 'My Learning',
						'thumbnail'     => $thumb,
						'isEnrolled'    => true,
						'progress'      => min( 100, $course_prog ),
						'price'         => 0,
						'originalPrice' => 0,
						'discount'      => 0,
						'rating'        => 5.0,
						'reviewsCount'  => 12,
						'studentsCount' => 120,
						'daysLeft'      => 0,
						'modules'       => $course_mods,
						'certificate'   => array(
							'is_issued'         => ( $course_prog >= 99 ),
							'verification_code' => "{$real_mto_cid}-1070-{$user_id}",
							'verification_url'  => home_url( "/certificate-verification/?code={$real_mto_cid}-1070-{$user_id}" ),
							'download_url'      => eta_certificate_download_url( $real_mto_cid, $user_id ),
						),
					);
				}
			}
		}

		// Collect earned certificates
		$student_certificates = array();
		foreach ( $enrolled_courses as $ec ) {
			if ( ! empty( $ec['certificate']['is_issued'] ) ) {
				$student_certificates[] = array(
					'id'                => 1070,
					'course_id'         => $ec['id'],
					'course_title'      => $ec['title'],
					'verification_code' => $ec['certificate']['verification_code'],
					'verification_url'  => $ec['certificate']['verification_url'],
					'download_url'      => $ec['certificate']['download_url'],
					'status'            => 'issued',
					'grade'             => '100%',
				);
			}
		}

		return new WP_REST_Response( array(
			'enrolled'     => $enrolled_courses,
			'certificates' => $student_certificates,
		), 200 );
	}

	/**
	 * Helper: Resolve full curriculum modules and lessons for a course
	 */
	/**
	 * Helper: course progress in % = completed lessons / all lessons in the curriculum.
	 */
	private function course_progress_percent( $lesson_progress, $modules ) {
		$total = 0;
		$ids   = array();
		foreach ( (array) $modules as $m ) {
			foreach ( (array) ( $m['lessons'] ?? array() ) as $l ) {
				$total++;
				$ids[] = (string) ( $l['id'] ?? '' );
			}
		}
		if ( ! $total || ! is_array( $lesson_progress ) ) {
			return 0;
		}
		$done = 0;
		foreach ( $lesson_progress as $lesson_id => $row ) {
			if ( in_array( (string) $lesson_id, $ids, true ) && ( is_array( $row ) ? ! empty( $row['completed'] ) : (bool) $row ) ) {
				$done++;
			}
		}
		return (int) min( 100, round( $done / $total * 100 ) );
	}

	public function resolve_course_modules( $course_id ) {
		$course_id = (int) $course_id;

		// 1. If $course_id is a WooCommerce product, map it to the underlying Masteriyo course
		$linked_mto = get_post_meta( $course_id, '_masteriyo_course_id', true ) ?: get_post_meta( $course_id, '_course_id', true );
		if ( ! $linked_mto && get_post_type( $course_id ) === 'product' ) {
			global $wpdb;
			$linked_mto = $wpdb->get_var( $wpdb->prepare(
				"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key IN ('_wc_product_id', '_product_id') AND meta_value = %s LIMIT 1",
				$course_id
			) );
		}
		if ( $linked_mto ) {
			$course_id = (int) $linked_mto;
		}

		// 2. If $course_id is 0, check request params for fallback slug
		if ( ! $course_id && isset( $_REQUEST['id'] ) ) {
			$raw_slug = sanitize_title( $_REQUEST['id'] );
			$found = get_page_by_path( $raw_slug, OBJECT, array( 'mto-course', 'product', 'course' ) );
			if ( $found ) {
				return $this->resolve_course_modules( $found->ID );
			}
		}

		$sections = get_posts( array(
			'post_type'      => 'mto-section',
			'post_parent'    => $course_id,
			'posts_per_page' => -1,
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
			'post_status'    => 'publish',
		) );

		if ( empty( $sections ) ) {
			$sections = get_posts( array(
				'post_type'      => 'mto-section',
				'meta_key'       => '_course_id',
				'meta_value'     => $course_id,
				'posts_per_page' => -1,
				'orderby'        => 'menu_order',
				'order'          => 'ASC',
				'post_status'    => 'publish',
			) );
		}

		$modules = array();
		foreach ( $sections as $s_idx => $sec ) {
			$lessons = get_posts( array(
				'post_type'      => array( 'mto-lesson', 'mto-quiz', 'mto-assignment' ),
				'post_parent'    => $sec->ID,
				'posts_per_page' => -1,
				'orderby'        => 'menu_order',
				'order'          => 'ASC',
				'post_status'    => 'publish',
			) );

			if ( empty( $lessons ) ) {
				$lessons = get_posts( array(
					'post_type'      => array( 'mto-lesson', 'mto-quiz', 'mto-assignment' ),
					'meta_key'       => '_section_id',
					'meta_value'     => $sec->ID,
					'posts_per_page' => -1,
					'orderby'        => 'menu_order',
					'order'          => 'ASC',
					'post_status'    => 'publish',
				) );
			}

			$lesson_items = array();
			foreach ( $lessons as $les ) {
				$vid_url = function_exists( 'eta_get_lesson_secure_video_url' ) ? eta_get_lesson_secure_video_url( $les->ID ) : ( get_post_meta( $les->ID, '_video_source_url', true ) ?: '' );
				$dur     = get_post_meta( $les->ID, '_duration', true ) ?: 15;
				$type    = ( 'mto-quiz' === $les->post_type ) ? 'quiz' : ( ( 'mto-assignment' === $les->post_type ) ? 'assignment' : 'video' );

				$lesson_items[] = array(
					'id'          => (string) $les->ID,
					'title'       => html_entity_decode( $les->post_title, ENT_QUOTES, 'UTF-8' ),
					'duration'    => $dur . 'm',
					'type'        => $type,
					'videoUrl'    => $vid_url,
					'url'         => get_permalink( $les->ID ),
					'summary'     => wp_strip_all_tags( $les->post_excerpt ?: $les->post_content ),
					'isCompleted' => false,
				);
			}

			$modules[] = array(
				'id'      => (string) $sec->ID,
				'title'   => html_entity_decode( $sec->post_title, ENT_QUOTES, 'UTF-8' ),
				'lessons' => $lesson_items,
			);
		}

		return $modules;
	}

	public function get_course_curriculum_endpoint( $request ) {
		$raw_id = $request->get_param( 'id' ) ?: $request->get_param( 'course_id' );
		if ( empty( $raw_id ) ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Course ID is required' ), 400 );
		}

		$cid = is_numeric( $raw_id ) ? (int) $raw_id : 0;
		if ( ! $cid ) {
			$found = get_page_by_path( sanitize_title( $raw_id ), OBJECT, array( 'mto-course', 'product', 'course' ) );
			if ( $found ) {
				$cid = $found->ID;
			}
		}

		$real_course_id = $cid;
		$linked_mto = get_post_meta( $cid, '_masteriyo_course_id', true ) ?: get_post_meta( $cid, '_course_id', true );
		if ( ! $linked_mto && get_post_type( $cid ) === 'product' ) {
			global $wpdb;
			$linked_mto = $wpdb->get_var( $wpdb->prepare(
				"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key IN ('_wc_product_id', '_product_id') AND meta_value = %s LIMIT 1",
				$cid
			) );
		}
		if ( $linked_mto ) {
			$real_course_id = (int) $linked_mto;
		}

		$modules = $this->resolve_course_modules( $real_course_id );
		$post = get_post( $real_course_id );

		// Reviews & ratings
		$reviews_data = array();
		if ( function_exists( 'eta_get_course_display_reviews' ) ) {
			$reviews_data = eta_get_course_display_reviews( $real_course_id );
		}
		$avg_rating = (float) get_post_meta( $real_course_id, '_masteriyo_average_rating', true ) ?: 4.9;
		$rev_count  = (int) get_post_meta( $real_course_id, '_masteriyo_review_count', true ) ?: count( $reviews_data );
		$breakdown  = get_post_meta( $real_course_id, '_masteriyo_rating_counts', true ) ?: array(
			'5' => max( 1, $rev_count ),
			'4' => 0,
			'3' => 0,
			'2' => 0,
			'1' => 0,
		);

		// Q&A
		$qa_data = array();
		if ( function_exists( 'eta_get_course_curated_qa' ) ) {
			$qa_data = eta_get_course_curated_qa( $real_course_id );
		}

		return new WP_REST_Response( array(
			'success'          => true,
			'course_id'        => $real_course_id,
			'product_id'       => get_post_meta( $real_course_id, '_wc_product_id', true ) ?: ( get_post_type( $cid ) === 'product' ? $cid : null ),
			'title'            => $post ? html_entity_decode( $post->post_title, ENT_QUOTES, 'UTF-8' ) : '',
			'modules'          => $modules,
			'average_rating'   => round( $avg_rating, 1 ),
			'reviews_count'    => max( $rev_count, count( $reviews_data ) ),
			'rating_breakdown' => $breakdown,
			'reviews'          => $reviews_data,
			'qa_items'         => $qa_data,
			'has_certificate'  => true,
		), 200 );
	}

	public function get_course_details_endpoint( $request ) {
		return $this->get_course_curriculum_endpoint( $request );
	}

	/**
	 * GET/POST /wp-json/eta/v1/progress
	 */
	public function get_progress( $request ) {
		$user_id = $this->get_current_user_id();
		if ( ! $user_id ) {
			return new WP_REST_Response( array( 'progress' => array() ), 200 );
		}
		$progress = get_user_meta( $user_id, '_eta_app_course_progress', true );
		return new WP_REST_Response( array( 'progress' => is_array( $progress ) ? $progress : array() ), 200 );
	}

	public function save_progress( $request ) {
		$user_id   = $this->get_current_user_id();
		$params    = $request->get_json_params();
		$course_id = isset( $params['course_id'] ) ? sanitize_text_field( $params['course_id'] ) : '';
		$lesson_id = isset( $params['lesson_id'] ) ? sanitize_text_field( $params['lesson_id'] ) : '';
		$completed = isset( $params['completed'] ) ? (bool) $params['completed'] : true;
		$score     = isset( $params['score'] ) ? (int) $params['score'] : null;

		if ( $user_id > 0 && ! empty( $course_id ) ) {
			$existing = get_user_meta( $user_id, '_eta_app_course_progress', true );
			if ( ! is_array( $existing ) ) {
				$existing = array();
			}
			if ( ! isset( $existing[ $course_id ] ) ) {
				$existing[ $course_id ] = array();
			}

			$previous = isset( $existing[ $course_id ][ $lesson_id ] ) && is_array( $existing[ $course_id ][ $lesson_id ] ) ? $existing[ $course_id ][ $lesson_id ] : array();
			$existing[ $course_id ][ $lesson_id ] = array(
				// A lesson stays completed once completed (later position saves send completed: false).
				'completed'        => $completed || ! empty( $previous['completed'] ),
				'score'            => $score,
				'progress_percent' => isset( $params['progress_percent'] ) ? max( 0, min( 100, (float) $params['progress_percent'] ) ) : ( $completed ? 100 : (float) ( $previous['progress_percent'] ?? 0 ) ),
				'position_seconds' => isset( $params['position_seconds'] ) ? max( 0, (int) $params['position_seconds'] ) : (int) ( $previous['position_seconds'] ?? 0 ),
				'time'             => current_time( 'mysql' ),
			);

			update_user_meta( $user_id, '_eta_app_course_progress', $existing );
		}

		return new WP_REST_Response( array( 'success' => true ), 200 );
	}

	/**
	 * Helper: Get Paystack Secret Key from WooCommerce or constant
	 */
	public function get_paystack_secret_key() {
		$paystack_settings = get_option( 'woocommerce_paystack_settings', array() );
		$testmode = isset( $paystack_settings['testmode'] ) && 'yes' === $paystack_settings['testmode'];
		$secret_key = $testmode
			? ( isset( $paystack_settings['test_secret_key'] ) ? $paystack_settings['test_secret_key'] : '' )
			: ( isset( $paystack_settings['secret_key'] ) ? $paystack_settings['secret_key'] : '' );

		if ( empty( $secret_key ) && defined( 'PAYSTACK_SECRET_KEY' ) ) {
			$secret_key = PAYSTACK_SECRET_KEY;
		}
		return $secret_key;
	}

	/**
	 * POST /wp-json/eta/v1/checkout/initialize-paystack
	 * POST /wp-json/eta/v1/payment/initialize
	 * Seamless Paystack transaction initialization backed by real WooCommerce database
	 */
	public function initialize_paystack_checkout( $request ) {
		$params = array_merge( (array) $request->get_params(), (array) $request->get_json_params() );

		$bundle_id = isset( $params['bundle_id'] ) ? (int) $params['bundle_id'] : ( isset( $params['bundle'] ) ? (int) $params['bundle'] : 0 );
		$raw_items = isset( $params['items'] ) ? $params['items'] : ( isset( $params['course_ids'] ) ? $params['course_ids'] : ( isset( $params['course_id'] ) ? array( $params['course_id'] ) : array() ) );
		if ( ! is_array( $raw_items ) ) {
			$raw_items = ! empty( $raw_items ) ? explode( ',', (string) $raw_items ) : array();
		}

		// Numeric IDs only: Masteriyo courses, course products, or bundle products
		// (or Masteriyo bundle IDs). Old app-only aliases such as "bundle_1" are ignored.
		$raw_ids = array();
		foreach ( (array) $raw_items as $raw ) {
			$rid = is_numeric( $raw ) ? (int) $raw : 0;
			if ( $rid > 0 ) {
				$raw_ids[] = $rid;
			}
		}
		if ( $bundle_id > 0 ) {
			$raw_ids[] = $bundle_id;
		}
		$items = array_values( array_unique( $raw_ids ) );

		$email    = isset( $params['email'] ) ? sanitize_email( $params['email'] ) : '';
		$name     = isset( $params['name'] ) ? sanitize_text_field( $params['name'] ) : 'Student';
		$phone    = isset( $params['phone'] ) ? sanitize_text_field( $params['phone'] ) : '';
		$currency = isset( $params['currency'] ) ? sanitize_text_field( $params['currency'] ) : 'NGN';

		if ( empty( $items ) ) {
			return new WP_Error( 'missing_course', 'At least one course_id is required for checkout.', array( 'status' => 400 ) );
		}

		$user_id = $this->get_current_user_id();
		if ( empty( $email ) ) {
			if ( $user_id > 0 ) {
				$u = get_user_by( 'id', $user_id );
				if ( $u ) {
					$email = $u->user_email;
					if ( empty( $name ) || 'Student' === $name ) {
						$name = $u->display_name ?: $u->user_login;
					}
				}
			}
		}

		if ( empty( $email ) ) {
			return new WP_Error( 'missing_email', 'A valid student email address is required for checkout.', array( 'status' => 400 ) );
		}

		// Price every cart line from the database: bundles at their WooCommerce
		// price, single courses at their own price. A course that is also inside a
		// bundle in the same cart is not charged twice.
		$bundle_lines = array();
		$course_line_ids = array();
		foreach ( $items as $rid ) {
			$bundle_courses = $this->get_bundle_course_ids( $rid );
			if ( $bundle_courses ) {
				$pid = $this->resolve_bundle_product_id( $rid );
				if ( ! isset( $bundle_lines[ $pid ] ) ) {
					list( $b_price ) = $this->get_bundle_prices( $pid );
					$bundle_lines[ $pid ] = array(
						'id'         => $pid,
						'title'      => $this->plain_title( $pid ),
						'price'      => $b_price,
						'type'       => 'bundle',
						'course_ids' => $bundle_courses,
					);
				}
			} elseif ( in_array( get_post_type( $rid ), array( 'mto-course', 'product' ), true ) ) {
				$course_line_ids[] = $rid;
			}
		}

		$total_amount_kobo = 0;
		$order_items       = array();
		$enroll_ids        = array();
		foreach ( $bundle_lines as $line ) {
			$order_items[]      = $line;
			$enroll_ids         = array_merge( $enroll_ids, $line['course_ids'] );
			$total_amount_kobo += (int) round( $line['price'] * 100 );
		}
		foreach ( $course_line_ids as $cid ) {
			if ( in_array( $cid, $enroll_ids, true ) ) {
				continue; // Already included in a bundle in this cart.
			}
			$price               = (float) ( get_post_meta( $cid, '_price', true ) ?: 0 );
			$order_items[]       = array(
				'id'    => $cid,
				'title' => $this->plain_title( $cid ),
				'price' => $price,
				'type'  => 'course',
			);
			$enroll_ids[]        = $cid;
			$total_amount_kobo  += (int) round( $price * 100 );
		}

		if ( empty( $order_items ) ) {
			return new WP_Error( 'invalid_course', 'None of the requested courses or bundles exist.', array( 'status' => 400 ) );
		}
		// $charged_ids: what goes on the order (bundle products and courses).
		// $items: the Masteriyo courses this payment unlocks.
		$charged_ids = array_map( 'intval', wp_list_pluck( $order_items, 'id' ) );
		$items       = array_values( array_unique( array_map( 'intval', $enroll_ids ) ) );

		// Free cart (every line costs 0): enroll directly, no Paystack.
		if ( $total_amount_kobo <= 0 ) {
			if ( $user_id <= 0 ) {
				return new WP_Error( 'login_required', 'Please sign in to enroll in free courses.', array( 'status' => 401 ) );
			}
			$enrolled = $this->enroll_user_in_courses( $user_id, $items );
			return new WP_REST_Response( array(
				'success'           => true,
				'status'            => 'success',
				'free_enrollment'   => true,
				'enrolled'          => true,
				'course_ids'        => $enrolled,
				'authorization_url' => '',
				'access_code'       => '',
				'reference'         => '',
				'amount'            => 0,
				'message'           => 'You are now enrolled.',
				'redirect_url'      => 'https://expressteck.tech/my-courses/',
			), 200 );
		}

		$secret_key = $this->get_paystack_secret_key();
		if ( empty( $secret_key ) ) {
			return new WP_Error( 'paystack_not_configured', 'Payments are not configured on the server.', array( 'status' => 503 ) );
		}

		// Create WooCommerce order if active
		$order_id = 0;
		if ( function_exists( 'wc_create_order' ) ) {
			try {
				$order = wc_create_order();
				foreach ( $charged_ids as $item_id ) {
					$product = function_exists( 'wc_get_product' ) ? wc_get_product( $item_id ) : false;
					if ( ! $product ) {
						$wc_pid = get_post_meta( $item_id, '_wc_product_id', true );
						if ( $wc_pid && function_exists( 'wc_get_product' ) ) {
							$product = wc_get_product( $wc_pid );
						}
					}
					if ( $product ) {
						$order->add_product( $product, 1 );
					}
				}
				$order->set_address( array(
					'first_name' => $name,
					'email'      => $email,
					'phone'      => $phone,
				), 'billing' );
				$order->set_payment_method( 'paystack' );
				$order->set_payment_method_title( 'Paystack (Mobile & Web App)' );
				$order->calculate_totals();
				$order->save();
				$order_id = $order->get_id();
			} catch ( \Exception $e ) {
				// non-blocking
			}
		}

		$reference = 'ETA_MOB_' . time() . '_' . wp_generate_password( 10, false );
		$callback_url = home_url( '/payment-complete/?order_id=' . $order_id . '&ref=' . $reference );

		// Call Paystack API
		$paystack_payload = array(
			'email'        => $email,
			'amount'       => $total_amount_kobo,
			'reference'    => $reference,
			'currency'     => 'NGN',
			'callback_url' => $callback_url,
			'metadata'     => array(
				'order_id'    => $order_id,
				'student_name'=> $name,
				'course_ids'  => $items,
				'source'      => 'eta_mobile_app',
			),
		);

		$response = wp_remote_post( 'https://api.paystack.co/transaction/initialize', array(
			'headers' => array(
				'Authorization' => 'Bearer ' . $secret_key,
				'Content-Type'  => 'application/json',
			),
			'body'    => wp_json_encode( $paystack_payload ),
			'timeout' => 20,
		) );

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'paystack_error', $response->get_error_message(), array( 'status' => 500 ) );
		}

		$body = wp_remote_retrieve_body( $response );
		$res_data = json_decode( $body, true );

		if ( isset( $res_data['status'] ) && true === $res_data['status'] && isset( $res_data['data']['authorization_url'] ) ) {
			if ( $order_id > 0 ) {
				update_post_meta( $order_id, '_paystack_txn_ref', $reference );
				update_post_meta( $order_id, '_eta_course_ids', $items );
			}

			// Server-side record of what this reference pays for. Verification
			// trusts only this record and Paystack, never values sent by the client.
			$this->save_txn_record( $reference, array(
				'amount_kobo' => (int) $total_amount_kobo,
				'currency'    => 'NGN',
				'course_ids'  => $items,
				'email'       => $email,
				'user_id'     => (int) $user_id,
				'order_id'    => (int) $order_id,
			) );

			return new WP_REST_Response( array(
				'success'           => true,
				'authorization_url' => $res_data['data']['authorization_url'],
				'access_code'       => $res_data['data']['access_code'],
				'reference'         => $reference,
				'order_id'          => $order_id,
				'items'             => $order_items,
				'amount'            => $total_amount_kobo / 100,
				'currency'          => 'NGN',
			), 200 );
		}

		$paystack_msg = isset( $res_data['message'] ) ? sanitize_text_field( $res_data['message'] ) : 'Unknown error';
		return new WP_Error( 'paystack_init_failed', 'Could not start the Paystack payment: ' . $paystack_msg, array( 'status' => 502 ) );
	}

	/**
	 * Helpers: server-side transaction records keyed by Paystack reference.
	 */
	private function txn_record_key( $reference ) {
		return '_eta_txn_' . md5( (string) $reference );
	}

	private function save_txn_record( $reference, $record ) {
		update_option( $this->txn_record_key( $reference ), $record, false );
	}

	private function get_txn_record( $reference ) {
		$record = get_option( $this->txn_record_key( $reference ), null );
		return is_array( $record ) ? $record : null;
	}

	/**
	 * Helper: enroll a user in courses (Masteriyo user items + the app's enrollment cache).
	 * Accepts course IDs or their WooCommerce product IDs. Returns every ID recorded.
	 */
	private function enroll_user_in_courses( $user_id, $course_ids ) {
		$user_id     = (int) $user_id;
		$course_ids  = array_values( array_unique( array_filter( array_map( 'intval', (array) $course_ids ) ) ) );
		$all_targets = array();
		if ( $user_id <= 0 || empty( $course_ids ) ) {
			return $all_targets;
		}
		foreach ( $course_ids as $vcid ) {
			$all_targets[] = (int) $vcid;
			$mto_id = get_post_meta( $vcid, '_masteriyo_course_id', true ) ?: get_post_meta( $vcid, '_course_id', true );
			if ( ! $mto_id && get_post_type( $vcid ) === 'product' ) {
				global $wpdb;
				$mto_id = $wpdb->get_var( $wpdb->prepare(
					"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key IN ('_wc_product_id', '_product_id') AND meta_value = %s LIMIT 1",
					$vcid
				) );
			}
			if ( $mto_id ) {
				$all_targets[] = (int) $mto_id;
			}
			$prod_id = get_post_meta( $vcid, '_wc_product_id', true );
			if ( $prod_id ) {
				$all_targets[] = (int) $prod_id;
			}
		}
		$all_targets = array_values( array_unique( array_filter( $all_targets ) ) );

		// Usermeta enrollment cache
		$existing = get_user_meta( $user_id, '_eta_enrolled_courses', true );
		if ( ! is_array( $existing ) ) {
			$existing = array();
		}
		$merged = array_values( array_unique( array_filter( array_merge( $existing, $all_targets ) ) ) );
		update_user_meta( $user_id, '_eta_enrolled_courses', $merged );

		// Masteriyo DB table (masteriyo_user_items)
		global $wpdb;
		$table_user_items = $wpdb->prefix . 'masteriyo_user_items';
		if ( $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $table_user_items ) ) === $table_user_items ) {
			foreach ( $all_targets as $c_id ) {
				$existing_row = $wpdb->get_row( $wpdb->prepare(
					"SELECT id, status FROM {$table_user_items} WHERE user_id = %d AND item_id = %d AND item_type = 'user_course' ORDER BY id DESC LIMIT 1",
					$user_id,
					(int) $c_id
				) );
				$existing_record = $existing_row ? (int) $existing_row->id : 0;
				if ( $existing_row && ! in_array( $existing_row->status, array( 'active', 'enrolled', 'progress', 'completed' ), true ) ) {
					// An earlier unpaid or cancelled order left this enrollment inactive; this payment unlocks it.
					$wpdb->update( $table_user_items, array( 'status' => 'active', 'date_modified' => current_time( 'mysql' ) ), array( 'id' => $existing_record ) );
				}
				if ( ! $existing_record ) {
					$wpdb->insert( $table_user_items, array(
						'user_id'       => (string) $user_id,
						'item_id'       => (int) $c_id,
						'item_type'     => 'user_course',
						'status'        => 'active',
						'parent_id'     => 0,
						'date_start'    => current_time( 'mysql' ),
						'date_modified' => current_time( 'mysql' ),
					) );
				}
			}
		}

		// Ensure student role
		$u_obj = get_user_by( 'id', $user_id );
		if ( $u_obj && ! in_array( 'masteriyo_student', (array) $u_obj->roles, true ) ) {
			$u_obj->add_role( 'masteriyo_student' );
		}
		return $all_targets;
	}

	/**
	 * Core Verification & LMS Auto-Enrollment Engine
	 * Shared across:
	 * 1. REST Endpoint: /wp-json/eta/v1/checkout/verify-paystack & /payment/verify
	 * 2. Web Redirect: /payment-complete/
	 * 3. Webhook: /wp-json/eta/v1/payment/webhook
	 */
	public function verify_and_enroll_internal( $reference, $order_id = 0, $user_id = 0, $email = '', $course_ids = array() ) {
		// SECURITY: $order_id, $user_id, $email and $course_ids from callers are
		// ignored. What gets unlocked, and for whom, comes only from Paystack's
		// verify API plus the server-side record saved at checkout.
		unset( $order_id, $user_id, $email, $course_ids );

		$reference  = sanitize_text_field( $reference );
		$secret_key = $this->get_paystack_secret_key();

		$fail = function( $message ) {
			return array(
				'success'  => false,
				'verified' => false,
				'enrolled' => false,
				'message'  => $message,
			);
		};

		if ( empty( $reference ) ) {
			return $fail( 'Payment reference is required.' );
		}
		if ( empty( $secret_key ) ) {
			return $fail( 'Payments are not configured on the server.' );
		}

		// 1. Ask Paystack whether this reference was really paid.
		$verify_res = wp_remote_get( 'https://api.paystack.co/transaction/verify/' . rawurlencode( $reference ), array(
			'headers' => array(
				'Authorization' => 'Bearer ' . $secret_key,
			),
			'timeout' => 20,
		) );
		if ( is_wp_error( $verify_res ) ) {
			return $fail( 'Could not reach Paystack to verify the payment. Please try again.' );
		}
		$v_body = json_decode( wp_remote_retrieve_body( $verify_res ), true );
		if ( empty( $v_body['status'] ) || true !== $v_body['status'] || ( $v_body['data']['status'] ?? '' ) !== 'success' ) {
			return $fail( 'Transaction verification failed with Paystack.' );
		}
		$paid_kobo     = (int) ( $v_body['data']['amount'] ?? 0 );
		$paid_currency = strtoupper( (string) ( $v_body['data']['currency'] ?? '' ) );
		$payer_email   = sanitize_email( $v_body['data']['customer']['email'] ?? '' );

		// 2. Load what this reference was created for (server-side only).
		$record   = $this->get_txn_record( $reference );
		$order_id = 0;
		$order    = null;
		if ( $record ) {
			$order_id = (int) $record['order_id'];
		} else {
			// Payments started before records existed: fall back to the order that holds this exact reference.
			$meta_oid = (int) ( $v_body['data']['metadata']['order_id'] ?? 0 );
			if ( $meta_oid > 0 && get_post_meta( $meta_oid, '_paystack_txn_ref', true ) === $reference ) {
				$order_id = $meta_oid;
			}
		}
		if ( $order_id > 0 && function_exists( 'wc_get_order' ) ) {
			$order = wc_get_order( $order_id );
			if ( $order && get_post_meta( $order_id, '_paystack_txn_ref', true ) !== $reference ) {
				$order = null; // Reference does not belong to this order.
			}
		}

		if ( $record ) {
			$expected_kobo       = (int) $record['amount_kobo'];
			$expected_currency   = strtoupper( (string) ( $record['currency'] ?? 'NGN' ) );
			$verified_course_ids = (array) $record['course_ids'];
			$user_id             = (int) ( $record['user_id'] ?? 0 );
			$email               = sanitize_email( $record['email'] ?? '' );
		} elseif ( $order ) {
			$expected_kobo       = (int) round( (float) $order->get_total() * 100 );
			$expected_currency   = strtoupper( (string) $order->get_currency() );
			$meta_cids           = get_post_meta( $order_id, '_eta_course_ids', true );
			$verified_course_ids = is_array( $meta_cids ) ? $meta_cids : array();
			$user_id             = (int) $order->get_user_id();
			$email               = $order->get_billing_email();
		} else {
			return $fail( 'This payment reference was not created by Express Tech Academy checkout.' );
		}

		// 3. The amount actually paid must cover what was charged.
		if ( $expected_kobo <= 0 || $paid_kobo < $expected_kobo ) {
			return $fail( 'The amount paid does not match the course price.' );
		}
		if ( ! empty( $expected_currency ) && ! empty( $paid_currency ) && $expected_currency !== $paid_currency ) {
			return $fail( 'The payment currency does not match.' );
		}

		if ( empty( $email ) ) {
			$email = $payer_email;
		}

		// 4. Mark the WooCommerce order paid.
		if ( $order ) {
			if ( $order->needs_payment() ) {
				$order->payment_complete( $reference );
				$order->add_order_note( sprintf( 'Paystack payment verified via mobile/web bridge (Ref: %s, amount: %d kobo).', $reference, $paid_kobo ) );
				$order->save();
			}
			if ( $user_id <= 0 ) {
				$user_id = (int) $order->get_user_id();
			}
		}

		$verified_course_ids = array_values( array_unique( array_filter( array_map( 'intval', $verified_course_ids ) ) ) );
		if ( empty( $verified_course_ids ) ) {
			return $fail( 'No courses are linked to this payment. Please contact support with your reference.' );
		}

		// Resolve user by email if user_id <= 0
		if ( $user_id <= 0 && ! empty( $email ) ) {
			$by_email = get_user_by( 'email', sanitize_email( $email ) );
			if ( $by_email ) {
				$user_id = (int) $by_email->ID;
			} else {
				// Auto-create student user account so access is instantly provisioned
				$username = sanitize_user( current( explode( '@', $email ) ) );
				if ( username_exists( $username ) ) {
					$username .= '_' . wp_rand( 100, 999 );
				}
				$pwd = wp_generate_password( 12, false );
				$new_uid = wp_create_user( $username, $pwd, $email );
				if ( ! is_wp_error( $new_uid ) ) {
					$user_id = (int) $new_uid;
					$u_obj = get_user_by( 'id', $user_id );
					if ( $u_obj ) {
						$u_obj->set_role( 'masteriyo_student' );
					}
				}
			}
		}

		// Attach the buyer to the order (so it shows in their account) and complete it:
		// everything sold here is a digital course or bundle.
		if ( $order && $user_id > 0 ) {
			if ( (int) $order->get_customer_id() !== $user_id ) {
				$order->set_customer_id( $user_id );
				$order->save();
			}
			if ( 'processing' === $order->get_status() ) {
				$order->update_status( 'completed', 'Course access unlocked by the app checkout.' );
			}
		}

		// 2. Auto-enroll student into Masteriyo courses in MySQL database
		$all_targets = $this->enroll_user_in_courses( $user_id, $verified_course_ids );

		return array(
			'success'    => true,
			'verified'   => true,
			'enrolled'   => ( $user_id > 0 ),
			'user_id'    => $user_id,
			'course_ids' => ! empty( $all_targets ) ? $all_targets : $verified_course_ids,
			'reference'  => $reference,
			'order_id'   => $order_id,
			'message'    => 'Payment successfully verified! Your courses have been unlocked in your dashboard.',
		);
	}

	/**
	 * GET/POST /wp-json/eta/v1/checkout/verify-paystack
	 * GET/POST /wp-json/eta/v1/payment/verify
	 */
	public function verify_paystack_payment( $request ) {
		$params     = array_merge( (array) $request->get_query_params(), (array) $request->get_json_params() );
		$reference  = isset( $params['reference'] ) ? sanitize_text_field( $params['reference'] ) : ( isset( $params['ref'] ) ? sanitize_text_field( $params['ref'] ) : '' );
		$order_id   = isset( $params['order_id'] ) ? (int) $params['order_id'] : 0;
		$user_id    = $this->get_current_user_id();
		$email      = isset( $params['email'] ) ? sanitize_email( $params['email'] ) : '';
		$course_ids = isset( $params['course_ids'] ) ? (array) $params['course_ids'] : ( isset( $params['items'] ) ? (array) $params['items'] : array() );

		if ( empty( $reference ) ) {
			return new WP_Error( 'missing_ref', 'Payment reference is required.', array( 'status' => 400 ) );
		}

		$res = $this->verify_and_enroll_internal( $reference, $order_id, $user_id, $email, $course_ids );

		if ( ! empty( $res['success'] ) ) {
			return new WP_REST_Response( $res, 200 );
		}

		return new WP_Error( 'verify_failed', $res['message'] ?? 'Could not verify Paystack payment.', array( 'status' => 400 ) );
	}

	/**
	 * POST /wp-json/eta/v1/payment/webhook
	 * POST /wp-json/eta/v1/checkout/paystack-webhook
	 * Handles background server-to-server notifications from Paystack
	 */
	public function handle_paystack_webhook( $request ) {
		$secret_key = $this->get_paystack_secret_key();
		$raw_body   = file_get_contents( 'php://input' );
		$signature  = isset( $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ) ? sanitize_text_field( $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ) : '';

		// Every webhook must carry a valid Paystack signature.
		if ( empty( $secret_key ) || empty( $signature ) ) {
			return new WP_Error( 'invalid_signature', 'Missing Paystack signature.', array( 'status' => 401 ) );
		}
		$computed_sig = hash_hmac( 'sha512', $raw_body, $secret_key );
		if ( ! hash_equals( $computed_sig, $signature ) ) {
			return new WP_Error( 'invalid_signature', 'Paystack signature verification failed.', array( 'status' => 401 ) );
		}

		$event_data = json_decode( $raw_body, true );
		if ( isset( $event_data['event'] ) && 'charge.success' === $event_data['event'] ) {
			$reference = $event_data['data']['reference'] ?? '';
			$metadata  = $event_data['data']['metadata'] ?? array();
			$order_id  = (int) ( $metadata['order_id'] ?? 0 );
			$email     = sanitize_email( $event_data['data']['customer']['email'] ?? '' );
			$courses   = (array) ( $metadata['course_ids'] ?? array() );

			$res = $this->verify_and_enroll_internal( $reference, $order_id, 0, $email, $courses );
			return new WP_REST_Response( array( 'status' => 'success', 'result' => $res ), 200 );
		}

		return new WP_REST_Response( array( 'status' => 'ignored' ), 200 );
	}

	/**
	 * GET /wp-json/eta/v1/payment/status
	 * Query payment & enrollment status
	 */
	public function get_payment_status( $request ) {
		$params    = $request->get_query_params();
		$reference = isset( $params['reference'] ) ? sanitize_text_field( $params['reference'] ) : ( isset( $params['ref'] ) ? sanitize_text_field( $params['ref'] ) : '' );
		$order_id  = isset( $params['order_id'] ) ? (int) $params['order_id'] : 0;

		if ( empty( $reference ) && empty( $order_id ) ) {
			return new WP_Error( 'missing_param', 'Reference or order_id is required.', array( 'status' => 400 ) );
		}

		$verified = false;
		$order_status = 'unknown';

		if ( $order_id > 0 && function_exists( 'wc_get_order' ) ) {
			$order = wc_get_order( $order_id );
			if ( $order ) {
				$order_status = $order->get_status();
				if ( in_array( $order_status, array( 'processing', 'completed' ), true ) ) {
					$verified = true;
				}
			}
		}

		return new WP_REST_Response( array(
			'reference'    => $reference,
			'order_id'     => $order_id,
			'verified'     => $verified,
			'order_status' => $order_status,
		), 200 );
	}

	/**
	 * Intercept Website Payment Pages:
	 * 1. /payment-complete/ -> Handles Paystack redirect, auto-verifies & enrolls, transmits postMessage to WebView.
	 * 2. /mobile-checkout/ or /pay/ -> Web checkout bridge for mobile app / browser.
	 */
	public function handle_web_payment_endpoints() {
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';
		$parsed_path = trim( (string) parse_url( $request_uri, PHP_URL_PATH ), '/' );

		// Route 1: /payment-complete or /payment-success
		if ( 'payment-complete' === $parsed_path || 'payment-success' === $parsed_path || false !== strpos( $parsed_path, 'payment-complete' ) ) {
			status_header( 200 );

			$reference = sanitize_text_field( $_GET['ref'] ?? $_GET['reference'] ?? $_GET['trxref'] ?? '' );
			$order_id  = (int) ( $_GET['order_id'] ?? 0 );

			$verification = array(
				'success'  => false,
				'verified' => false,
				'enrolled' => false,
				'message'  => 'No payment reference provided.',
			);

			if ( ! empty( $reference ) ) {
				$verification = $this->verify_and_enroll_internal( $reference, $order_id );
			}

			if ( empty( $verification['verified'] ) ) {
				$this->render_payment_error_page( $verification['message'] ?? 'Payment could not be verified.' );
				exit;
			}

			$this->render_payment_complete_page( $reference, $order_id, $verification );
			exit;
		}

		// Route 2: /mobile-checkout or /pay or /app-checkout
		if ( 'mobile-checkout' === $parsed_path || 'app-checkout' === $parsed_path || 'pay' === $parsed_path ) {
			status_header( 200 );

			$course_id = (int) ( $_REQUEST['course_id'] ?? $_REQUEST['id'] ?? 0 );
			$email     = sanitize_email( $_REQUEST['email'] ?? '' );
			$name      = sanitize_text_field( $_REQUEST['name'] ?? 'Student' );
			$phone     = sanitize_text_field( $_REQUEST['phone'] ?? '' );
			$format    = sanitize_text_field( $_REQUEST['format'] ?? 'html' );

			if ( empty( $email ) ) {
				$current_user = wp_get_current_user();
				$email = ( $current_user && $current_user->ID > 0 ) ? $current_user->user_email : '';
			}

			if ( $course_id <= 0 || empty( $email ) ) {
				$missing = $course_id <= 0 ? 'course_id' : 'email';
				if ( 'json' === $format ) {
					wp_send_json_error( array( 'message' => 'Missing required parameter: ' . $missing ), 400 );
				}
				status_header( 400 );
				$this->render_payment_error_page( 'Missing required parameter: ' . $missing . '. Please start checkout again from the app.' );
				exit;
			}

			$init_request = new WP_REST_Request( 'POST', '/eta/v1/checkout/initialize-paystack' );
			$init_request->set_body_params( array(
				'items' => array( $course_id ),
				'email' => $email,
				'name'  => $name,
				'phone' => $phone,
			) );

			$init_res = $this->initialize_paystack_checkout( $init_request );

			if ( is_wp_error( $init_res ) ) {
				if ( 'json' === $format ) {
					wp_send_json_error( array( 'message' => $init_res->get_error_message() ), 400 );
				}
				$this->render_payment_error_page( $init_res->get_error_message() );
				exit;
			}

			$data = $init_res->get_data();
			if ( 'json' === $format ) {
				wp_send_json_success( $data );
				exit;
			}

			if ( ! empty( $data['authorization_url'] ) ) {
				wp_redirect( $data['authorization_url'] );
				exit;
			}

			$this->render_payment_error_page( 'Unable to generate Paystack authorization URL.' );
			exit;
		}
	}

	/**
	 * Render Gorgeous Payment Complete Screen
	 */
	private function render_payment_complete_page( $reference, $order_id, $verification ) {
		$course_title = 'Paid Online Survey & International Testing';
		if ( ! empty( $verification['course_ids'] ) ) {
			$first_id = $verification['course_ids'][0];
			$p = get_post( $first_id );
			if ( $p ) {
				$course_title = $p->post_title;
			}
		}
		?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<meta name="robots" content="noindex, nofollow">
	<meta name="theme-color" content="#0a0f1d">
	<title>Payment Successful - Express Tech Academy</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
			background: linear-gradient(135deg, #0a0f1d 0%, #0d1527 50%, #070a14 100%);
			color: #f8fafc;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.card {
			background: rgba(17, 24, 39, 0.95);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 24px;
			padding: 36px 28px;
			max-width: 480px;
			width: 100%;
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.12);
			text-align: center;
			backdrop-filter: blur(16px);
		}
		.badge-icon-wrap {
			width: 80px;
			height: 80px;
			background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.08) 100%);
			border: 2px solid #10b981;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			margin: 0 auto 20px;
			box-shadow: 0 0 24px rgba(16, 185, 129, 0.4);
			animation: pulse-glow 2.5s infinite;
		}
		@keyframes pulse-glow {
			0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
			70% { box-shadow: 0 0 0 16px rgba(16, 185, 129, 0); }
			100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
		}
		.badge-icon-wrap svg {
			width: 42px;
			height: 42px;
			stroke: #10b981;
			stroke-width: 3;
			fill: none;
		}
		h1 {
			font-size: 24px;
			font-weight: 800;
			color: #ffffff;
			margin-bottom: 8px;
			letter-spacing: -0.02em;
		}
		.subtitle {
			font-size: 14px;
			color: #94a3b8;
			line-height: 1.5;
			margin-bottom: 24px;
		}
		.details-card {
			background: rgba(30, 41, 59, 0.6);
			border: 1px solid rgba(255, 255, 255, 0.05);
			border-radius: 16px;
			padding: 18px;
			margin-bottom: 24px;
			text-align: left;
		}
		.row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 0;
			font-size: 13px;
			border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		}
		.row:last-child { border-bottom: none; }
		.row-label { color: #94a3b8; }
		.row-val { font-weight: 600; color: #f1f5f9; word-break: break-all; }
		.tag-active {
			background: rgba(16, 185, 129, 0.15);
			color: #34d399;
			border: 1px solid rgba(16, 185, 129, 0.3);
			border-radius: 6px;
			padding: 2px 8px;
			font-size: 11px;
			font-weight: 700;
		}
		.btn-primary {
			display: block;
			width: 100%;
			background: linear-gradient(135deg, #10b981 0%, #059669 100%);
			color: #ffffff;
			font-size: 15px;
			font-weight: 700;
			padding: 14px 20px;
			border-radius: 14px;
			text-decoration: none;
			margin-bottom: 12px;
			box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
			transition: transform 0.15s ease;
		}
		.btn-primary:active { transform: scale(0.98); }
		.btn-secondary {
			display: block;
			width: 100%;
			background: rgba(255, 255, 255, 0.06);
			color: #94a3b8;
			font-size: 13px;
			font-weight: 600;
			padding: 12px 20px;
			border-radius: 12px;
			text-decoration: none;
		}
		.btn-secondary:hover { color: #f1f5f9; background: rgba(255, 255, 255, 0.09); }
		.brand-note {
			font-size: 11px;
			color: #64748b;
			margin-top: 20px;
		}
	</style>
</head>
<body>
	<div class="card">
		<div class="badge-icon-wrap">
			<svg viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		</div>

		<h1>Payment Successful!</h1>
		<p class="subtitle">Your course access has been activated. You are ready to start learning.</p>

		<div class="details-card">
			<div class="row">
				<span class="row-label">Status</span>
				<span class="tag-active">Enrolled & Active</span>
			</div>
			<div class="row">
				<span class="row-label">Course</span>
				<span class="row-val"><?php echo esc_html( $course_title ); ?></span>
			</div>
			<?php if ( ! empty( $reference ) ) : ?>
			<div class="row">
				<span class="row-label">Reference</span>
				<span class="row-val" style="font-family: monospace; font-size: 12px;"><?php echo esc_html( $reference ); ?></span>
			</div>
			<?php endif; ?>
			<?php if ( $order_id > 0 ) : ?>
			<div class="row">
				<span class="row-label">Order #</span>
				<span class="row-val"><?php echo (int) $order_id; ?></span>
			</div>
			<?php endif; ?>
		</div>

		<a href="expressteck://payment-success?ref=<?php echo urlencode( $reference ); ?>&order_id=<?php echo (int) $order_id; ?>" class="btn-primary" id="btn-return-app">
			Return to Mobile App
		</a>

		<a href="<?php echo esc_url( home_url( '/learn/' ) ); ?>" class="btn-secondary">
			Go to Web Study Dashboard
		</a>

		<p class="brand-note">Express Tech Academy &bull; Instant Access Guaranteed</p>
	</div>

	<script>
	(function() {
		var payload = {
			status: 'success',
			event: 'successful',
			reference: '<?php echo esc_js( $reference ); ?>',
			order_id: <?php echo (int) $order_id; ?>,
			verified: <?php echo ! empty( $verification['verified'] ) ? 'true' : 'false'; ?>,
			enrolled: <?php echo ! empty( $verification['enrolled'] ) ? 'true' : 'false'; ?>
		};
		var payloadStr = JSON.stringify(payload);

		// 1. Post to React Native WebView immediately
		if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
			window.ReactNativeWebView.postMessage(payloadStr);
		}

		// 2. Click button handler
		var btn = document.getElementById('btn-return-app');
		if (btn) {
			btn.addEventListener('click', function(e) {
				if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
					e.preventDefault();
					window.ReactNativeWebView.postMessage(payloadStr);
				}
			});
		}

		// 3. Fallback for external mobile browser: trigger deep link after 1.5s
		if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.ReactNativeWebView) {
			setTimeout(function() {
				window.location.href = 'expressteck://payment-success?ref=' + encodeURIComponent('<?php echo esc_js( $reference ); ?>') + '&order_id=<?php echo (int) $order_id; ?>';
			}, 1500);
		}
	})();
	</script>
</body>
</html>
		<?php
	}

	/**
	 * Render Payment Error Screen
	 */
	private function render_payment_error_page( $message ) {
		?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Payment Interrupted - Express Tech Academy</title>
	<style>
		body { font-family: sans-serif; background: #0a0f1d; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
		.card { background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px 24px; max-width: 440px; text-align: center; }
		h1 { color: #f87171; font-size: 20px; margin-bottom: 12px; }
		p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
		a { display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; }
	</style>
</head>
<body>
	<div class="card">
		<h1>Payment Interrupted</h1>
		<p><?php echo esc_html( $message ); ?></p>
		<a href="<?php echo esc_url( home_url() ); ?>">Return Home</a>
	</div>
</body>
</html>
		<?php
	}

	/**
	 * POST /wp-json/eta/v1/register
	 */
	public function register_user( $request ) {
		$params   = $request->get_json_params() ?: $request->get_params();
		$name     = sanitize_text_field( $params['name'] ?? $params['fullName'] ?? '' );
		$email    = sanitize_email( $params['email'] ?? '' );
		$password = $params['password'] ?? '';
		$meta     = $params['meta'] ?? array();

		if ( empty( $email ) || ! is_email( $email ) ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'A valid email address is required.' ), 400 );
		}

		if ( empty( $password ) || strlen( $password ) < 6 ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Password must be at least 6 characters.' ), 400 );
		}

		if ( email_exists( $email ) ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'An account with this email already exists.' ), 400 );
		}

		$username = sanitize_user( current( explode( '@', $email ) ), true );
		if ( empty( $username ) || username_exists( $username ) ) {
			$username = $username . '_' . wp_rand( 100, 999 );
		}

		$user_id = wp_create_user( $username, $password, $email );
		if ( is_wp_error( $user_id ) ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => $user_id->get_error_message() ), 500 );
		}

		wp_update_user( array(
			'ID'           => $user_id,
			'display_name' => $name ?: $username,
			'first_name'   => $name,
			'role'         => 'subscriber',
		) );

		$u_obj = get_user_by( 'id', $user_id );
		if ( $u_obj && ! in_array( 'masteriyo_student', (array) $u_obj->roles, true ) ) {
			$u_obj->add_role( 'masteriyo_student' );
		}

		if ( ! empty( $meta['phone'] ) ) {
			update_user_meta( $user_id, 'billing_phone', sanitize_text_field( $meta['phone'] ) );
		}
		if ( ! empty( $meta['country'] ) ) {
			update_user_meta( $user_id, 'billing_country', sanitize_text_field( $meta['country'] ) );
		}

		$token = $this->issue_auth_token( $user_id, true );

		$user_data = $this->format_user_profile_data( $user_id );

		return new WP_REST_Response( array(
			'success' => true,
			'token'   => $token,
			'user'    => $user_data,
		), 200 );
	}

	/**
	 * POST /wp-json/eta/v1/login
	 */
	public function login_user( $request ) {
		$params   = $request->get_json_params() ?: $request->get_params();
		$username = sanitize_text_field( $params['username'] ?? $params['email'] ?? '' );
		$password = $params['password'] ?? '';

		if ( empty( $username ) || empty( $password ) ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Username and password are required.' ), 400 );
		}

		$user = wp_authenticate( $username, $password );
		if ( is_wp_error( $user ) ) {
			if ( is_email( $username ) ) {
				$user_obj = get_user_by( 'email', $username );
				if ( $user_obj ) {
					$user = wp_authenticate( $user_obj->user_login, $password );
				}
			}
		}

		if ( is_wp_error( $user ) ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Invalid email or password.' ), 401 );
		}

		if ( ! in_array( 'masteriyo_student', (array) $user->roles, true ) ) {
			$user->add_role( 'masteriyo_student' );
		}

		$token = $this->issue_auth_token( $user->ID );

		$user_data = $this->format_user_profile_data( $user->ID );

		return new WP_REST_Response( array(
			'success' => true,
			'token'   => $token,
			'user'    => $user_data,
		), 200 );
	}

	/**
	 * POST /wp-json/eta/v1/auth/google
	 * POST /wp-json/eta/v1/google-login
	 */
	public function google_auth_user( $request ) {
		$params     = $request->get_json_params() ?: $request->get_params();
		$credential = trim( (string) ( $params['credential'] ?? $params['id_token'] ?? $params['token'] ?? '' ) );
		$client_id  = function_exists( 'eta_react_google_client_id' ) ? eta_react_google_client_id() : ( defined( 'ETA_GOOGLE_CLIENT_ID' ) ? ETA_GOOGLE_CLIENT_ID : '1075070762182-vlf41rha8ctjckt9ig2bnv28otd3n10l.apps.googleusercontent.com' );

		if ( empty( $credential ) ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Google credential/ID token is required.', 'message' => 'Google credential/ID token is required.' ), 400 );
		}

		$response = wp_remote_get( 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode( $credential ), array( 'timeout' => 10 ) );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Unable to verify Google credential with Google servers.', 'message' => 'Unable to verify Google credential with Google servers.' ), 401 );
		}

		$payload = json_decode( wp_remote_retrieve_body( $response ), true );
		$email   = isset( $payload['email'] ) ? sanitize_email( $payload['email'] ) : '';

		$valid = is_array( $payload )
			&& isset( $payload['aud'], $payload['iss'], $payload['exp'] )
			&& ( empty( $client_id ) || hash_equals( $client_id, (string) $payload['aud'] ) )
			&& in_array( $payload['iss'], array( 'https://accounts.google.com', 'accounts.google.com' ), true )
			&& time() < (int) $payload['exp']
			&& is_email( $email )
			&& isset( $payload['email_verified'] ) && in_array( $payload['email_verified'], array( 'true', true ), true );

		if ( ! $valid ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Invalid or expired Google token.', 'message' => 'Invalid or expired Google token.' ), 401 );
		}

		$user = get_user_by( 'email', $email );
		if ( ! $user ) {
			$base     = sanitize_user( current( explode( '@', $email ) ), true ) ?: 'learner';
			$username = $base;
			$counter  = 1;
			while ( username_exists( $username ) ) {
				$username = $base . $counter++;
			}
			$user_id = wp_create_user( $username, wp_generate_password( 24 ), $email );
			if ( is_wp_error( $user_id ) ) {
				return new WP_REST_Response( array( 'success' => false, 'error' => $user_id->get_error_message() ), 500 );
			}
			$name = isset( $payload['name'] ) ? sanitize_text_field( $payload['name'] ) : '';
			wp_update_user( array(
				'ID'           => $user_id,
				'display_name' => $name ?: $username,
				'first_name'   => isset( $payload['given_name'] ) ? sanitize_text_field( $payload['given_name'] ) : $name,
			) );
			$user = get_user_by( 'id', $user_id );
		}

		if ( ! empty( $payload['picture'] ) && $user ) {
			$pic_url = esc_url_raw( $payload['picture'] );
			update_user_meta( $user->ID, '_eta_app_custom_avatar_url', $pic_url );
			update_user_meta( $user->ID, 'masteriyo_profile_avatar_url', $pic_url );
		}

		if ( $user && ! in_array( 'masteriyo_student', (array) $user->roles, true ) ) {
			$user->add_role( 'masteriyo_student' );
		}

		$token = $this->issue_auth_token( $user->ID );

		$user_data = $this->format_user_profile_data( $user->ID );

		return new WP_REST_Response( array(
			'success' => true,
			'token'   => $token,
			'user'    => $user_data,
		), 200 );
	}

	/**
	 * GET /wp-json/eta/v1/instructors
	 * Returns real WordPress and Masteriyo instructors on the website.
	 */
	public function get_instructors( $request ) {
		// Query users who are instructors or administrators
		$users = get_users( array(
			'role__in' => array( 'masteriyo_instructor', 'instructor', 'administrator' ),
			'number'   => 50,
		) );

		// Also check authors of published courses
		$course_authors = get_posts( array(
			'post_type'      => array( 'mto-course', 'course' ),
			'post_status'    => 'publish',
			'posts_per_page' => 100,
			'fields'         => 'post_author',
		) );
		$author_ids = array_unique( wp_list_pluck( (array) $course_authors, 'post_author' ) );

		$user_ids = array();
		foreach ( $users as $u ) {
			$user_ids[] = $u->ID;
		}
		foreach ( $author_ids as $aid ) {
			if ( $aid > 0 && ! in_array( $aid, $user_ids ) ) {
				$user_ids[] = (int) $aid;
			}
		}

		$instructors = array();
		foreach ( $user_ids as $uid ) {
			$u = get_userdata( $uid );
			if ( ! $u ) {
				continue;
			}

			// Get their published courses
			$courses_query = get_posts( array(
				'post_type'      => array( 'mto-course', 'course' ),
				'post_status'    => 'publish',
				'author'         => $uid,
				'posts_per_page' => 20,
			) );

			$assigned_courses = array();
			foreach ( $courses_query as $c_post ) {
				$price = (int) ( get_post_meta( $c_post->ID, '_price', true ) ?: get_post_meta( $c_post->ID, 'price', true ) ?: 15000 );
				$thumb = get_the_post_thumbnail_url( $c_post->ID, 'medium' ) ?: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
				$assigned_courses[] = array(
					'id'        => (string) $c_post->ID,
					'title'     => $c_post->post_title,
					'thumbnail' => $thumb,
					'price'     => $price,
				);
			}

			$bio = function_exists( 'eta_react_get_user_bio' ) ? eta_react_get_user_bio( $uid ) : ( get_user_meta( $uid, 'description', true ) ?: '' );
			if ( empty( $bio ) ) {
				$bio = ( 1 === (int) $uid ) ? 'Founder & Lead Instructor at Express Tech Academy. Dedicated to practical, job-ready engineering education across Africa.' : 'Experienced technical instructor at Express Tech Academy.';
			}

			$name = $u->display_name ?: $u->user_login;
			if ( 'admin' === strtolower( $name ) ) {
				$name = 'Coach Denis (Express Tech Academy)';
			}

			$role = get_user_meta( $uid, '_masteriyo_instructor_title', true ) ?: ( ( 1 === (int) $uid ) ? 'Lead Instructor & Founder' : 'Senior Instructor' );

			$instructors[] = array(
				'id'         => (string) $uid,
				'name'       => $name,
				'avatar'     => get_avatar_url( $uid, array( 'size' => 256 ) ),
				'role'       => $role,
				'joinedYear' => date( 'Y', strtotime( $u->user_registered ) ),
				'bio'        => $bio,
				'courses'    => $assigned_courses,
			);
		}

		// Ensure Coach Denis is first
		usort( $instructors, function( $a, $b ) {
			if ( '1' === $a['id'] ) return -1;
			if ( '1' === $b['id'] ) return 1;
			return 0;
		} );

		return new WP_REST_Response( $instructors, 200 );
	}

	/**
	 * Core Filter: Pre-fetch custom student avatar for all WordPress and Masteriyo calls
	 */
	public function filter_custom_avatar_data( $args, $id_or_email ) {
		$user_id = 0;
		if ( is_numeric( $id_or_email ) ) {
			$user_id = (int) $id_or_email;
		} elseif ( is_string( $id_or_email ) && is_email( $id_or_email ) ) {
			$user = get_user_by( 'email', $id_or_email );
			if ( $user ) {
				$user_id = (int) $user->ID;
			}
		} elseif ( is_object( $id_or_email ) ) {
			if ( ! empty( $id_or_email->user_id ) ) {
				$user_id = (int) $id_or_email->user_id;
			} elseif ( ! empty( $id_or_email->ID ) ) {
				$user_id = (int) $id_or_email->ID;
			}
		}

		if ( $user_id > 0 ) {
			$custom_avatar = get_user_meta( $user_id, '_eta_app_custom_avatar', true );
			if ( ! empty( $custom_avatar ) ) {
				$args['url']          = $custom_avatar;
				$args['found_avatar'] = true;
				return $args;
			}

			$profile_img_id = get_user_meta( $user_id, '_profile_image_id', true );
			if ( ! empty( $profile_img_id ) ) {
				$img_url = wp_get_attachment_image_url( $profile_img_id, 'full' );
				if ( ! empty( $img_url ) ) {
					$args['url']          = $img_url;
					$args['found_avatar'] = true;
					return $args;
				}
			}
		}

		return $args;
	}

	/**
	 * Helper: Format user profile array
	 */
	public function format_user_profile_data( $user_id ) {
		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return null;
		}

		$custom_avatar = get_user_meta( $user_id, '_eta_app_custom_avatar', true );
		if ( empty( $custom_avatar ) ) {
			$profile_img_id = get_user_meta( $user_id, '_profile_image_id', true );
			if ( ! empty( $profile_img_id ) ) {
				$img_url = wp_get_attachment_image_url( $profile_img_id, 'full' );
				if ( ! empty( $img_url ) ) {
					$custom_avatar = $img_url;
				}
			}
		}

		$avatar = ! empty( $custom_avatar ) ? $custom_avatar : get_avatar_url( $user_id, array( 'size' => 256 ) );
		$phone = get_user_meta( $user_id, 'billing_phone', true ) ?: ( get_user_meta( $user_id, 'phone', true ) ?: '' );
		$country = get_user_meta( $user_id, 'billing_country', true ) ?: 'Nigeria';
		$first_name = get_user_meta( $user_id, 'first_name', true ) ?: $user->display_name;
		$last_name = get_user_meta( $user_id, 'last_name', true ) ?: '';

		return array(
			'id'         => $user->ID,
			'name'       => $user->display_name ?: $user->user_login,
			'firstName'  => $first_name,
			'lastName'   => $last_name,
			'email'      => $user->user_email,
			'phone'      => $phone,
			'country'    => $country,
			'greeting'   => 'What would you like to learn today?',
			'avatar'     => $avatar,
			'joinedYear' => date( 'Y', strtotime( $user->user_registered ) ),
			'roles'      => (array) $user->roles,
		);
	}

	/**
	 * GET /wp-json/eta/v1/profile
	 */
	public function get_user_profile( $request ) {
		$user_id = $this->get_current_user_id();
		if ( ! $user_id ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Authentication required. Please provide a valid Bearer token.',
			), 401 );
		}

		$profile = $this->format_user_profile_data( $user_id );
		if ( ! $profile ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'User account not found.',
			), 404 );
		}

		return new WP_REST_Response( array(
			'success' => true,
			'data'    => $profile,
			'user'    => $profile,
		), 200 );
	}

	/**
	 * POST / PUT /wp-json/eta/v1/profile
	 */
	public function update_user_profile( $request ) {
		$user_id = $this->get_current_user_id();
		if ( ! $user_id ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Authentication required. Please provide a valid Bearer token.',
			), 401 );
		}

		$params = $request->get_json_params() ?: $request->get_params();
		$user_updates = array( 'ID' => $user_id );

		// 1. Update Name
		if ( isset( $params['name'] ) || isset( $params['fullName'] ) ) {
			$name = sanitize_text_field( $params['name'] ?? $params['fullName'] ?? '' );
			if ( ! empty( $name ) ) {
				$user_updates['display_name'] = $name;
				$parts = explode( ' ', $name, 2 );
				$user_updates['first_name'] = $parts[0];
				if ( isset( $parts[1] ) ) {
					$user_updates['last_name'] = $parts[1];
				}
			}
		}

		// 2. Update Email
		if ( ! empty( $params['email'] ) ) {
			$new_email = sanitize_email( $params['email'] );
			if ( ! is_email( $new_email ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'error'   => 'Invalid email format provided.',
				), 400 );
			}
			$existing_user_id = email_exists( $new_email );
			if ( $existing_user_id && (int) $existing_user_id !== (int) $user_id ) {
				return new WP_REST_Response( array(
					'success' => false,
					'error'   => 'Email is already registered by another user.',
				), 400 );
			}
			$user_updates['user_email'] = $new_email;
		}

		if ( count( $user_updates ) > 1 ) {
			$res = wp_update_user( $user_updates );
			if ( is_wp_error( $res ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'error'   => $res->get_error_message(),
				), 400 );
			}
		}

		// 3. Update Phone
		if ( isset( $params['phone'] ) ) {
			$phone = sanitize_text_field( $params['phone'] );
			update_user_meta( $user_id, 'billing_phone', $phone );
			update_user_meta( $user_id, 'phone', $phone );
		}

		// 4. Update Country
		if ( isset( $params['country'] ) ) {
			$country = sanitize_text_field( $params['country'] );
			update_user_meta( $user_id, 'billing_country', $country );
			update_user_meta( $user_id, 'country', $country );
		}

		// 5. Update Password
		$password = $params['password'] ?? $params['new_password'] ?? '';
		if ( ! empty( $password ) ) {
			if ( strlen( $password ) < 6 ) {
				return new WP_REST_Response( array(
					'success' => false,
					'error'   => 'Password must be at least 6 characters.',
				), 400 );
			}
			wp_set_password( $password, $user_id );
			$this->issue_auth_token( $user_id );
		}

		// 6. Update Avatar (Multipart Upload, Base64 payload, or direct URL)
		$avatar_uploaded_url = '';
		$attachment_id       = 0;

		// 6a. Multipart File Upload ($_FILES or $request->get_file_params())
		$files     = $request->get_file_params();
		$file_item = null;
		if ( ! empty( $files['avatar'] ) ) {
			$file_item = $files['avatar'];
		} elseif ( ! empty( $files['file'] ) ) {
			$file_item = $files['file'];
		} elseif ( ! empty( $_FILES['avatar'] ) ) {
			$file_item = $_FILES['avatar'];
		} elseif ( ! empty( $_FILES['file'] ) ) {
			$file_item = $_FILES['file'];
		}

		if ( $file_item && ! empty( $file_item['tmp_name'] ) && empty( $file_item['error'] ) ) {
			require_once ABSPATH . 'wp-admin/includes/image.php';
			require_once ABSPATH . 'wp-admin/includes/file.php';
			require_once ABSPATH . 'wp-admin/includes/media.php';

			$attach_id = media_handle_sideload( $file_item, 0, sprintf( 'Avatar for user %d', $user_id ) );
			if ( ! is_wp_error( $attach_id ) && $attach_id > 0 ) {
				$attachment_id       = (int) $attach_id;
				$avatar_uploaded_url = wp_get_attachment_image_url( $attach_id, 'full' );
			}
		}

		// 6b. Base64 payload
		if ( empty( $avatar_uploaded_url ) && ! empty( $params['avatar_base64'] ) ) {
			require_once ABSPATH . 'wp-admin/includes/image.php';
			require_once ABSPATH . 'wp-admin/includes/file.php';
			require_once ABSPATH . 'wp-admin/includes/media.php';

			$base64_str = $params['avatar_base64'];
			if ( preg_match( '/^data:image\/(\w+);base64,/', $base64_str, $type_matches ) ) {
				$base64_str = substr( $base64_str, strpos( $base64_str, ',' ) + 1 );
				$ext = strtolower( $type_matches[1] );
				if ( $ext === 'jpeg' ) $ext = 'jpg';
			} else {
				$ext = 'jpg';
			}

			$image_data = base64_decode( $base64_str );
			if ( $image_data ) {
				$filename = 'avatar_' . $user_id . '_' . time() . '.' . $ext;
				$upload   = wp_upload_bits( $filename, null, $image_data );
				if ( empty( $upload['error'] ) && ! empty( $upload['file'] ) ) {
					$avatar_uploaded_url = esc_url_raw( $upload['url'] );

					// Register in WordPress Media Library
					$wp_filetype = wp_check_filetype( $filename, null );
					$attachment  = array(
						'post_mime_type' => $wp_filetype['type'] ?: 'image/jpeg',
						'post_title'     => sanitize_file_name( $filename ),
						'post_content'   => '',
						'post_status'    => 'inherit',
					);
					$attach_id = wp_insert_attachment( $attachment, $upload['file'] );
					if ( ! is_wp_error( $attach_id ) && $attach_id > 0 ) {
						$attachment_id = (int) $attach_id;
						$attach_data   = wp_generate_attachment_metadata( $attach_id, $upload['file'] );
						wp_update_attachment_metadata( $attach_id, $attach_data );
					}
				}
			}
		}

		// 6c. Direct URL fallback
		if ( empty( $avatar_uploaded_url ) && ( ! empty( $params['avatar'] ) || ! empty( $params['avatar_url'] ) ) ) {
			$raw_url = esc_url_raw( $params['avatar'] ?? $params['avatar_url'] );
			if ( filter_var( $raw_url, FILTER_VALIDATE_URL ) ) {
				$avatar_uploaded_url = $raw_url;
			}
		}

		// Save to both ETA custom avatar meta and Masteriyo _profile_image_id
		if ( ! empty( $avatar_uploaded_url ) ) {
			update_user_meta( $user_id, '_eta_app_custom_avatar', $avatar_uploaded_url );
			if ( $attachment_id > 0 ) {
				update_user_meta( $user_id, '_profile_image_id', $attachment_id );
			}
		}

		$updated_profile = $this->format_user_profile_data( $user_id );

		return new WP_REST_Response( array(
			'success' => true,
			'message' => 'Profile updated successfully.',
			'data'    => $updated_profile,
			'user'    => $updated_profile,
		), 200 );
	}

	/**
	 * GET /wp-json/eta/v1/cart
	 */
	public function get_user_cart( $request ) {
		$user_id = $this->get_current_user_id();
		if ( ! $user_id ) {
			return new WP_REST_Response( array( 'success' => true, 'cart_ids' => array(), 'data' => array( 'cart_ids' => array() ) ), 200 );
		}

		$cart_ids = get_user_meta( $user_id, '_eta_app_cart_ids', true );
		if ( ! is_array( $cart_ids ) ) {
			$cart_ids = array();
		}

		return new WP_REST_Response( array(
			'success'  => true,
			'cart_ids' => array_values( array_map( 'strval', $cart_ids ) ),
			'data'     => array(
				'cart_ids' => array_values( array_map( 'strval', $cart_ids ) ),
			),
		), 200 );
	}

	/**
	 * POST /wp-json/eta/v1/cart
	 */
	public function save_user_cart( $request ) {
		$user_id = $this->get_current_user_id();
		$params  = $request->get_json_params() ?: $request->get_params();
		$raw_ids = $params['cart_ids'] ?? array();

		$cart_ids = is_array( $raw_ids ) ? array_values( array_unique( array_map( 'sanitize_text_field', $raw_ids ) ) ) : array();

		if ( $user_id > 0 ) {
			update_user_meta( $user_id, '_eta_app_cart_ids', $cart_ids );
		}

		return new WP_REST_Response( array(
			'success'  => true,
			'cart_ids' => $cart_ids,
			'data'     => array(
				'cart_ids' => $cart_ids,
			),
		), 200 );
	}

	/**
	 * GET /wp-json/eta/v1/wishlist
	 */
	public function get_user_wishlist( $request ) {
		$user_id = $this->get_current_user_id();
		if ( ! $user_id ) {
			return new WP_REST_Response( array( 'success' => true, 'wishlist_ids' => array(), 'data' => array( 'wishlist_ids' => array() ) ), 200 );
		}

		$wishlist_ids = get_user_meta( $user_id, '_eta_app_wishlist_ids', true );
		if ( ! is_array( $wishlist_ids ) ) {
			$wishlist_ids = array();
		}

		return new WP_REST_Response( array(
			'success'      => true,
			'wishlist_ids' => array_values( array_map( 'strval', $wishlist_ids ) ),
			'data'         => array(
				'wishlist_ids' => array_values( array_map( 'strval', $wishlist_ids ) ),
			),
		), 200 );
	}

	/**
	 * POST /wp-json/eta/v1/wishlist
	 */
	public function save_user_wishlist( $request ) {
		$user_id = $this->get_current_user_id();
		$params  = $request->get_json_params() ?: $request->get_params();
		$raw_ids = $params['wishlist_ids'] ?? array();

		$wishlist_ids = is_array( $raw_ids ) ? array_values( array_unique( array_map( 'sanitize_text_field', $raw_ids ) ) ) : array();

		if ( $user_id > 0 ) {
			update_user_meta( $user_id, '_eta_app_wishlist_ids', $wishlist_ids );
		}

		return new WP_REST_Response( array(
			'success'      => true,
			'wishlist_ids' => $wishlist_ids,
			'data'         => array(
				'wishlist_ids' => $wishlist_ids,
			),
		), 200 );
	}

	/**
	 * GET /wp-json/eta/v1/notifications
	 */
	public function get_user_notifications( $request ) {
		$user_id = $this->get_current_user_id();
		$user = $user_id > 0 ? get_userdata( $user_id ) : null;
		$user_name = $user ? ( $user->display_name ?: $user->user_login ) : 'Student';

		$notifications = array();

		// 1. Fetch global announcements from option store
		$global_broadcasts = get_option( '_eta_global_broadcasts', array() );
		$read_ids = ( $user_id > 0 ) ? (array) get_user_meta( $user_id, '_eta_read_broadcast_ids', true ) : array();

		if ( is_array( $global_broadcasts ) ) {
			foreach ( $global_broadcasts as $gb ) {
				$channels = isset( $gb['channels'] ) && is_array( $gb['channels'] ) ? $gb['channels'] : array( 'web', 'mobile' );
				if ( in_array( 'mobile', $channels, true ) ) {
					$gb_id = isset( $gb['id'] ) ? $gb['id'] : '';
					$is_read = ( ! empty( $gb_id ) && in_array( $gb_id, $read_ids, true ) );
					$notifications[] = array(
						'id'         => $gb_id,
						'title'      => ! empty( $gb['title'] ) ? $gb['title'] : 'Platform Announcement',
						'message'    => ! empty( $gb['message'] ) ? $gb['message'] : '',
						'time'       => ! empty( $gb['time'] ) ? $gb['time'] : 'Recent',
						'read'       => $is_read,
						'type'       => ! empty( $gb['type'] ) ? $gb['type'] : 'announcement',
						'actionUrl'  => ! empty( $gb['actionUrl'] ) ? $gb['actionUrl'] : ( ! empty( $gb['url'] ) ? $gb['url'] : '/(tabs)/explore' ),
						'created_at' => ! empty( $gb['created_at'] ) ? $gb['created_at'] : time(),
					);
				}
			}
		}

		// 2. Fetch user-specific targeted notifications from user meta
		if ( $user_id > 0 ) {
			$user_notifs = get_user_meta( $user_id, '_eta_user_notifications', true );
			if ( is_array( $user_notifs ) ) {
				foreach ( $user_notifs as $un ) {
					$channels = isset( $un['channels'] ) && is_array( $un['channels'] ) ? $un['channels'] : array( 'web', 'mobile' );
					if ( in_array( 'mobile', $channels, true ) ) {
						$notifications[] = array(
							'id'         => isset( $un['id'] ) ? $un['id'] : ( 'notif_' . wp_rand( 1000, 9999 ) ),
							'title'      => isset( $un['title'] ) ? $un['title'] : 'Update',
							'message'    => isset( $un['message'] ) ? $un['message'] : '',
							'time'       => isset( $un['time'] ) ? $un['time'] : 'Recent',
							'read'       => ! empty( $un['read'] ),
							'type'       => isset( $un['type'] ) ? $un['type'] : 'system',
							'actionUrl'  => isset( $un['actionUrl'] ) ? $un['actionUrl'] : ( isset( $un['url'] ) ? $un['url'] : '/(tabs)/explore' ),
							'created_at' => isset( $un['created_at'] ) ? $un['created_at'] : time(),
						);
					}
				}
			}
		}

		// If notifications list is still empty, provide friendly initial onboarding notifications
		if ( empty( $notifications ) ) {
			$notifications[] = array(
				'id'         => 'notif_welcome',
				'title'      => 'Welcome to Express Tech Academy!',
				'message'    => 'Hi ' . $user_name . ', explore our industry-certified engineering & tech courses.',
				'time'       => 'Just now',
				'read'       => false,
				'type'       => 'system',
				'actionUrl'  => '/(tabs)/explore',
				'created_at' => time(),
			);
		}

		// Sort by created_at descending
		usort( $notifications, function( $a, $b ) {
			$time_a = isset( $a['created_at'] ) ? (int) $a['created_at'] : 0;
			$time_b = isset( $b['created_at'] ) ? (int) $b['created_at'] : 0;
			return $time_b - $time_a;
		} );

		return new WP_REST_Response( array_values( $notifications ), 200 );
	}

	/**
	 * POST /wp-json/eta/v1/notifications/mark-read
	 */
	public function mark_notifications_read( $request ) {
		$user_id  = $this->get_current_user_id();
		$params   = array_merge( (array) $request->get_query_params(), (array) $request->get_json_params() );
		$notif_id = isset( $params['id'] ) ? sanitize_text_field( $params['id'] ) : '';
		$mark_all = ! empty( $params['all'] ) || empty( $notif_id );

		if ( $user_id > 0 ) {
			// Mark in user meta
			$user_notifs = get_user_meta( $user_id, '_eta_user_notifications', true );
			if ( is_array( $user_notifs ) ) {
				foreach ( $user_notifs as &$item ) {
					if ( $mark_all || ( isset( $item['id'] ) && $item['id'] === $notif_id ) ) {
						$item['read'] = true;
					}
				}
				unset( $item );
				update_user_meta( $user_id, '_eta_user_notifications', $user_notifs );
			}

			// Mark in global broadcasts
			$global_broadcasts = get_option( '_eta_global_broadcasts', array() );
			$read_ids = (array) get_user_meta( $user_id, '_eta_read_broadcast_ids', true );
			if ( is_array( $global_broadcasts ) ) {
				foreach ( $global_broadcasts as $gb ) {
					if ( ! empty( $gb['id'] ) ) {
						if ( $mark_all || $gb['id'] === $notif_id ) {
							$read_ids[] = $gb['id'];
						}
					}
				}
			}
			$merged = array_values( array_unique( $read_ids ) );
			update_user_meta( $user_id, '_eta_read_broadcast_ids', $merged );
		}

		return new WP_REST_Response( array(
			'success' => true,
			'message' => 'Notifications marked as read.',
		), 200 );
	}

	/**
	 * POST /wp-json/eta/v1/auth/forgot-password
	 * Generates a 6-digit OTP reset code and emails it to the user.
	 */
	public function handle_forgot_password( $request ) {
		$params = $request->get_json_params() ?: $request->get_params();
		$login_or_email = sanitize_text_field( $params['email'] ?? $params['username'] ?? '' );

		if ( empty( $login_or_email ) ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Please provide your account email address.',
			), 400 );
		}

		$user = is_email( $login_or_email ) ? get_user_by( 'email', $login_or_email ) : get_user_by( 'login', $login_or_email );
		if ( ! $user ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'No account found with this email address.',
			), 404 );
		}

		// Generate 6-digit numeric OTP
		$otp_code = sprintf( '%06d', wp_rand( 100000, 999999 ) );
		$expiry   = time() + ( 15 * MINUTE_IN_SECONDS ); // 15 mins

		update_user_meta( $user->ID, '_eta_pwd_reset_code', $otp_code );
		update_user_meta( $user->ID, '_eta_pwd_reset_expires', $expiry );
		update_user_meta( $user->ID, '_eta_pwd_reset_attempts', 0 );

		// Send branded HTML email
		$site_name = get_bloginfo( 'name' ) ?: 'Express Tech Academy';
		$subject   = sprintf( 'Your %s Verification Code: %s', $site_name, $otp_code );
		$user_name = $user->first_name ?: ( $user->display_name ?: 'Student' );

				$html_message = '
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Password Reset Code</title>
			<style type="text/css">
				body { margin: 0; padding: 0; min-width: 100%; width: 100% !important; background-color: #F8FAFC; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; }
				table { border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
				table td { border-collapse: collapse; }
				@media screen and (max-width: 600px) {
					.eta-container { width: 100% !important; border-radius: 0 !important; }
				}
			</style>
		</head>
		<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; padding: 32px 0; margin: 0; width: 100%;">
				<tr>
					td align="center" style="padding: 0 12px;">
						<table class="eta-container" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08); border: 1px solid #E2E8F0;">
							<!-- Header -->
							<tr>
								td style="background-color: #0B0F19; padding: 24px 36px; text-align: left; border-bottom: 2px solid #4F46E5;">
									<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
										<tr>
											td align="left" style="vertical-align: middle;">
												<span style="display: inline-block; width: 34px; height: 34px; line-height: 34px; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #FFFFFF; font-weight: 900; font-size: 15px; text-align: center; border-radius: 8px; margin-right: 12px;">ETA</span>
												<span style="font-size: 19px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">EXPRESS<span style="color: #818CF8;">TECH</span> ACADEMY</span>
											</td>
											td align="right" style="vertical-align: middle;">
												<span style="display: inline-block; padding: 5px 12px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(129, 140, 248, 0.3); border-radius: 20px; font-size: 11px; font-weight: 600; color: #A5B4FC; text-transform: uppercase;">Security</span>
											</td>
										</tr>
									</table>
								</td>
							</tr>
							<!-- Body -->
							<tr>
								td style="padding: 36px 36px 32px 36px; background-color: #FFFFFF; color: #1E293B;">
									<h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0F172A;">Password Reset Code 🔑</h1>
									<p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">Hello <strong>\' . esc_html( $user_name ) . \'</strong>,</p>
									<p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.6;">We received a request to reset the password for your account (\' . esc_html( $user->user_email ) . \'). Use the 6-digit verification code below to complete your reset in the mobile application:</p>
									
									<div style="background-color: #F8FAFC; border: 2px dashed #4F46E5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
										<div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #4F46E5; font-weight: 700; margin-bottom: 8px;">Your 6-Digit Verification Code</div>
										<div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0F172A; font-family: monospace;">\' . esc_html( $otp_code ) . \'</div>
										<div style="font-size: 12px; color: #64748B; margin-top: 8px;">Expires in 15 minutes</div>
									</div>

									<div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 14px; color: #92400E;">
										<strong>Security Note:</strong> If you did not request this password reset, please ignore this email. Your account credentials remain fully secure.
									</div>
								</td>
							</tr>
							<!-- Footer -->
							<tr>
								td style="padding: 24px 36px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 13px; color: #64748B;">
									<p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">\' . esc_html( $site_name ) . \' &bull; Excellence in Practical Tech Education</p>
									<p style="margin: 0 0 8px 0;">Need help? Reach out at <a href="mailto:support@expressteck.tech" style="color: #4F46E5; text-decoration: none; font-weight: 600;">support@expressteck.tech</a></p>
									<p style="margin: 0; font-size: 11px; color: #94A3B8;">&copy; \' . gmdate( \'Y\' ) . \' \' . esc_html( $site_name ) . \'. All rights reserved.</p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
		</html>';

		$headers = array(
			'Content-Type: text/html; charset=UTF-8',
			'From: ' . $site_name . ' <hello@expressteck.tech>',
		);

		wp_mail( $user->user_email, $subject, $html_message, $headers );

		return new WP_REST_Response( array(
			'success' => true,
			'message' => 'A 6-digit verification code has been sent to your email address.',
			'email'   => $user->user_email,
		), 200 );
	}

	/**
	 * POST /wp-json/eta/v1/auth/verify-reset-code
	 * Pre-validates the 6-digit OTP code before asking for the new password.
	 */
	public function handle_verify_reset_code( $request ) {
		$params = $request->get_json_params() ?: $request->get_params();
		$login_or_email = sanitize_text_field( $params['email'] ?? $params['username'] ?? '' );
		$code           = sanitize_text_field( $params['code'] ?? $params['otp'] ?? '' );

		if ( empty( $login_or_email ) || empty( $code ) ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Email and 6-digit verification code are required.',
			), 400 );
		}

		$user = is_email( $login_or_email ) ? get_user_by( 'email', $login_or_email ) : get_user_by( 'login', $login_or_email );
		if ( ! $user ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'No account found with this email address.',
			), 404 );
		}

		$saved_code = get_user_meta( $user->ID, '_eta_pwd_reset_code', true );
		$expires    = (int) get_user_meta( $user->ID, '_eta_pwd_reset_expires', true );
		$attempts   = (int) get_user_meta( $user->ID, '_eta_pwd_reset_attempts', true );

		if ( empty( $saved_code ) ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'No active reset request found. Please request a new code.',
			), 400 );
		}

		if ( time() > $expires ) {
			delete_user_meta( $user->ID, '_eta_pwd_reset_code' );
			delete_user_meta( $user->ID, '_eta_pwd_reset_expires' );
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Verification code has expired. Please request a new one.',
			), 400 );
		}

		if ( $attempts >= 5 ) {
			delete_user_meta( $user->ID, '_eta_pwd_reset_code' );
			delete_user_meta( $user->ID, '_eta_pwd_reset_expires' );
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Too many incorrect attempts. Please request a new verification code.',
			), 429 );
		}

		if ( trim( (string) $saved_code ) !== trim( (string) $code ) ) {
			update_user_meta( $user->ID, '_eta_pwd_reset_attempts', $attempts + 1 );
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Invalid verification code. Please check your email and try again.',
			), 400 );
		}

		return new WP_REST_Response( array(
			'success' => true,
			'message' => 'Verification code is valid.',
		), 200 );
	}

	/**
	 * POST /wp-json/eta/v1/auth/reset-password
	 * Verifies OTP code, updates password in database, and returns auto-login token + profile.
	 */
	public function handle_reset_password( $request ) {
		$params = $request->get_json_params() ?: $request->get_params();
		$login_or_email = sanitize_text_field( $params['email'] ?? $params['username'] ?? '' );
		$code           = sanitize_text_field( $params['code'] ?? $params['otp'] ?? '' );
		$new_password   = $params['password'] ?? $params['new_password'] ?? '';

		if ( empty( $login_or_email ) || empty( $code ) || empty( $new_password ) ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Email, verification code, and new password are required.',
			), 400 );
		}

		if ( strlen( $new_password ) < 6 ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'New password must be at least 6 characters long.',
			), 400 );
		}

		$user = is_email( $login_or_email ) ? get_user_by( 'email', $login_or_email ) : get_user_by( 'login', $login_or_email );
		if ( ! $user ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'No account found with this email address.',
			), 404 );
		}

		$saved_code = get_user_meta( $user->ID, '_eta_pwd_reset_code', true );
		$expires    = (int) get_user_meta( $user->ID, '_eta_pwd_reset_expires', true );
		$attempts   = (int) get_user_meta( $user->ID, '_eta_pwd_reset_attempts', true );

		if ( empty( $saved_code ) || time() > $expires ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Verification code has expired or is invalid. Please request a new code.',
			), 400 );
		}

		if ( $attempts >= 5 ) {
			delete_user_meta( $user->ID, '_eta_pwd_reset_code' );
			delete_user_meta( $user->ID, '_eta_pwd_reset_expires' );
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Too many incorrect attempts. Please request a new verification code.',
			), 429 );
		}

		if ( trim( (string) $saved_code ) !== trim( (string) $code ) ) {
			update_user_meta( $user->ID, '_eta_pwd_reset_attempts', $attempts + 1 );
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => 'Invalid verification code. Please check your email and try again.',
			), 400 );
		}

		// Update password in WordPress database
		wp_set_password( $new_password, $user->ID );

		// Clear reset metadata
		delete_user_meta( $user->ID, '_eta_pwd_reset_code' );
		delete_user_meta( $user->ID, '_eta_pwd_reset_expires' );
		delete_user_meta( $user->ID, '_eta_pwd_reset_attempts' );

		// Generate fresh auth token for instant auto-login
		$token = $this->issue_auth_token( $user->ID, true );

		// Format updated user profile
		$user_profile = $this->format_user_profile_data( $user->ID );

		return new WP_REST_Response( array(
			'success' => true,
			'message' => 'Password has been reset successfully.',
			'token'   => $token,
			'user'    => $user_profile,
		), 200 );
	}


	/**
	 * Helper: Resolve a course ID or slug to canonical Masteriyo course post
	 */
	private function resolve_canonical_course_id( $raw_id ) {
		if ( empty( $raw_id ) ) {
			return 0;
		}
		$cid = is_numeric( $raw_id ) ? (int) $raw_id : 0;
		if ( ! $cid ) {
			$found = get_page_by_path( sanitize_title( $raw_id ), OBJECT, array( 'mto-course', 'product', 'course' ) );
			if ( $found ) {
				$cid = $found->ID;
			}
		}
		if ( $cid ) {
			$linked_mto = get_post_meta( $cid, '_masteriyo_course_id', true ) ?: get_post_meta( $cid, '_course_id', true );
			if ( ! $linked_mto && get_post_type( $cid ) === 'product' ) {
				global $wpdb;
				$linked_mto = $wpdb->get_var( $wpdb->prepare(
					"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key IN ('_wc_product_id', '_product_id') AND meta_value = %s LIMIT 1",
					$cid
				) );
			}
			if ( $linked_mto ) {
				return (int) $linked_mto;
			}
			return $cid;
		}
		return 0;
	}

	/**
	 * GET /wp-json/eta/v1/reviews
	 * Retrieve course reviews, overall score, and star breakdown
	 */
	public function get_course_reviews( $request ) {
		$raw_id    = $request->get_param( 'course_id' ) ?: $request->get_param( 'id' );
		$course_id = $this->resolve_canonical_course_id( $raw_id );

		if ( $course_id ) {
			if ( function_exists( 'eta_get_course_display_reviews' ) ) {
				$reviews = eta_get_course_display_reviews( $course_id );
			} else {
				$reviews  = array();
				$comments = get_comments( array(
					'post_id' => $course_id,
					'type'    => 'mto_course_review',
					'status'  => 'approve',
					'number'  => 30,
				) );
				foreach ( $comments as $c ) {
					$reviews[] = array(
						'id'          => $c->comment_ID,
						'name'        => $c->comment_author,
						'title'       => (string) get_comment_meta( $c->comment_ID, 'title', true ),
						'content'     => $c->comment_content,
						'rating'      => (int) get_comment_meta( $c->comment_ID, 'rating', true ) ?: 5,
						'date'        => human_time_diff( strtotime( $c->comment_date ) ) . ' ago',
						'avatar'      => '',
						'is_verified' => true,
					);
				}
			}

			$avg_rating = (float) get_post_meta( $course_id, '_masteriyo_average_rating', true ) ?: 4.9;
			$rev_count  = (int) get_post_meta( $course_id, '_masteriyo_review_count', true ) ?: count( $reviews );
			$breakdown  = get_post_meta( $course_id, '_masteriyo_rating_counts', true );
			if ( empty( $breakdown ) || ! is_array( $breakdown ) ) {
				$breakdown = array(
					'5' => max( 1, $rev_count ),
					'4' => 0,
					'3' => 0,
					'2' => 0,
					'1' => 0,
				);
			}

			return new WP_REST_Response( array(
				'success'          => true,
				'course_id'        => $course_id,
				'course_title'     => get_the_title( $course_id ),
				'average_rating'   => round( $avg_rating, 1 ),
				'reviews_count'    => max( $rev_count, count( $reviews ) ),
				'satisfaction_pct' => 99,
				'rating_breakdown' => $breakdown,
				'reviews'          => $reviews,
				// Lets the app show the review form only to buyers/watchers of this course.
				'can_review'       => $this->user_can_review_course( $course_id, $this->get_current_user_id() ),
			), 200 );
		}

		// If no course_id provided, return all latest verified student reviews
		$all_comments = get_comments( array(
			'type'    => 'mto_course_review',
			'status'  => 'approve',
			'number'  => 50,
			'orderby' => 'comment_date',
			'order'   => 'DESC',
		) );
		$all_reviews = array();
		foreach ( $all_comments as $c ) {
			$all_reviews[] = array(
				'id'          => $c->comment_ID,
				'course_id'   => $c->comment_post_ID,
				'course_title'=> get_the_title( $c->comment_post_ID ),
				'name'        => $c->comment_author,
				'title'       => (string) get_comment_meta( $c->comment_ID, 'title', true ),
				'content'     => $c->comment_content,
				'rating'      => (int) get_comment_meta( $c->comment_ID, 'rating', true ) ?: 5,
				'date'        => human_time_diff( strtotime( $c->comment_date ) ) . ' ago',
				'avatar'      => '',
				'is_verified' => true,
			);
		}

		return new WP_REST_Response( array(
			'success' => true,
			'reviews' => $all_reviews,
		), 200 );
	}

	/**
	 * Helper: may this user review this course? Uses the theme's shared
	 * bought-or-watched check (inc/review-eligibility.php) so the website and
	 * the app apply the same rule. Without the theme helper, falls back to a
	 * real Masteriyo enrollment in this course; otherwise denies.
	 */
	private function user_can_review_course( $course_id, $user_id ) {
		if ( ! $course_id || ! $user_id ) {
			return false;
		}
		if ( function_exists( 'eta_user_can_review_course' ) ) {
			return eta_user_can_review_course( $course_id, $user_id );
		}
		if ( function_exists( 'masteriyo_is_user_enrolled_in_course' ) ) {
			return (bool) masteriyo_is_user_enrolled_in_course( $course_id, $user_id );
		}
		return false;
	}

	/**
	 * POST /wp-json/eta/v1/reviews
	 * Submit a student review from mobile (buyers/watchers of this course only)
	 */
	public function submit_course_review( $request ) {
		$params    = $request->get_json_params() ?: $request->get_params();
		$raw_id    = $params['course_id'] ?? $params['id'] ?? 0;
		$course_id = $this->resolve_canonical_course_id( $raw_id );
		if ( ! $course_id ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Valid course_id is required.' ), 400 );
		}

		// Only learners who bought or watched THIS course (website or app) may review it.
		$user_id = $this->get_current_user_id();
		if ( ! $user_id ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Please sign in to review this course.' ), 401 );
		}
		if ( ! $this->user_can_review_course( $course_id, $user_id ) ) {
			return new WP_REST_Response( array(
				'success' => false,
				'error'   => function_exists( 'eta_review_ineligible_message' )
					? eta_review_ineligible_message()
					: 'Only learners who have bought or started watching this course can review it.',
			), 403 );
		}

		$already = get_comments( array(
			'post_id' => $course_id,
			'user_id' => $user_id,
			'type'    => 'mto_course_review',
			'parent'  => 0,
			'status'  => array( 'approve', 'hold' ),
			'count'   => true,
		) );
		if ( $already ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'You have already reviewed this course.' ), 409 );
		}

		$rating  = isset( $params['rating'] ) ? min( 5, max( 1, (int) $params['rating'] ) ) : 5;
		$title   = sanitize_text_field( $params['title'] ?? '' );
		$content = sanitize_textarea_field( $params['content'] ?? $params['review'] ?? '' );

		if ( empty( $content ) ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Review content cannot be empty.' ), 400 );
		}

		// Reviews are attributed to the signed-in account, never to client-supplied names.
		$u            = get_userdata( $user_id );
		$author_name  = $u ? ( $u->display_name ?: $u->user_login ) : 'Verified Student';
		$author_email = $u ? $u->user_email : '';

		$comment_id = wp_insert_comment( array(
			'comment_post_ID'      => $course_id,
			'comment_author'       => $author_name,
			'comment_author_email' => $author_email,
			'comment_content'      => $content,
			'comment_type'         => 'mto_course_review',
			'user_id'              => $user_id,
			'comment_approved'     => 1,
			'comment_date'         => current_time( 'mysql' ),
		) );

		if ( ! $comment_id ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Could not save review.' ), 500 );
		}

		update_comment_meta( $comment_id, 'rating', $rating );
		if ( ! empty( $title ) ) {
			update_comment_meta( $comment_id, 'title', $title );
		}
		update_comment_meta( $comment_id, 'is_verified', 1 );

		// Update post rating aggregates
		$existing_cnt = (int) get_post_meta( $course_id, '_masteriyo_review_count', true ) ?: 1;
		update_post_meta( $course_id, '_masteriyo_review_count', $existing_cnt + 1 );

		return new WP_REST_Response( array(
			'success' => true,
			'message' => 'Thank you! Your review has been published.',
			'review'  => array(
				'id'          => $comment_id,
				'name'        => $author_name,
				'title'       => $title,
				'content'     => $content,
				'rating'      => $rating,
				'date'        => 'Just now',
				'is_verified' => true,
			),
		), 201 );
	}

	/**
	 * GET /wp-json/eta/v1/course-qa
	 * Retrieve course Q&A items (curated + submitted)
	 */
	public function get_course_qa( $request ) {
		$raw_id    = $request->get_param( 'course_id' ) ?: $request->get_param( 'id' );
		$course_id = $this->resolve_canonical_course_id( $raw_id );

		$qa_items = array();

		// 1. Curated FAQs from the theme. The theme helper also appends student
		//    questions; those are skipped here and built below with IDs and replies.
		if ( $course_id && function_exists( 'eta_get_course_curated_qa' ) ) {
			$curated = eta_get_course_curated_qa( $course_id );
			if ( is_array( $curated ) ) {
				foreach ( $curated as $item ) {
					if ( isset( $item['badge'] ) && 'Student Question' === $item['badge'] ) {
						continue;
					}
					$qa_items[] = array_merge( $item, array(
						'id'          => null,
						'type'        => 'faq',
						'answered'    => true,
						'can_reply'   => false,
						'reply_count' => 0,
						'replies'     => array(),
					) );
				}
			}
		}

		// 2. Student questions, each with its replies (oldest first).
		if ( $course_id ) {
			$submitted = get_comments( array(
				'post_id' => $course_id,
				'type'    => 'eta_course_question',
				'parent'  => 0,
				'status'  => 'approve',
				'number'  => 50,
				'orderby' => 'comment_date',
				'order'   => 'DESC',
			) );

			foreach ( $submitted as $c ) {
				$replies = array();
				$answer  = '';
				foreach ( $this->get_qa_reply_comments( $c->comment_ID ) as $r ) {
					$formatted = $this->format_qa_reply( $r );
					$replies[] = $formatted;
					if ( '' === $answer && $formatted['is_instructor'] ) {
						$answer = $formatted['content'];
					}
				}
				$qa_items[] = array(
					'id'          => (int) $c->comment_ID,
					'type'        => 'question',
					'question'    => $c->comment_content,
					// Back-compat: `answer` always holds text. `answered` says whether it is a real instructor answer.
					'answer'      => '' !== $answer ? $answer : 'Thank you for asking! Our instructors have received your question and will answer it shortly.',
					'answered'    => '' !== $answer,
					'badge'       => 'Student Question',
					'author'      => $c->comment_author,
					'date'        => human_time_diff( strtotime( $c->comment_date_gmt . ' UTC' ) ) . ' ago',
					'date_iso'    => mysql2date( 'c', $c->comment_date_gmt . ' +0000' ),
					'can_reply'   => true,
					'reply_count' => count( $replies ),
					'replies'     => $replies,
				);
			}
		}

		return new WP_REST_Response( array(
			'success'   => true,
			'course_id' => $course_id,
			'count'     => count( $qa_items ),
			'qa_items'  => $qa_items,
		), 200 );
	}

	/**
	 * Helper: approved replies under a Q&A question, oldest first.
	 */
	private function get_qa_reply_comments( $question_id ) {
		return get_comments( array(
			'parent'  => (int) $question_id,
			'status'  => 'approve',
			'orderby' => 'comment_date_gmt',
			'order'   => 'ASC',
			'number'  => 100,
		) );
	}

	/**
	 * Helper: is this user an instructor or admin (their replies count as the answer)?
	 */
	private function is_qa_staff( $user_id, $course_id = 0 ) {
		$user_id = (int) $user_id;
		if ( $user_id <= 0 ) {
			return false;
		}
		if ( user_can( $user_id, 'moderate_comments' ) || user_can( $user_id, 'edit_others_posts' ) ) {
			return true;
		}
		$u = get_userdata( $user_id );
		if ( $u && array_intersect( (array) $u->roles, array( 'administrator', 'masteriyo_instructor', 'masteriyo_manager' ) ) ) {
			return true;
		}
		return $course_id && (int) get_post_field( 'post_author', $course_id ) === $user_id;
	}

	private function format_qa_reply( $r ) {
		$is_staff = $this->is_qa_staff( $r->user_id, $r->comment_post_ID );
		return array(
			'id'            => (int) $r->comment_ID,
			'question_id'   => (int) $r->comment_parent,
			'author'        => $r->comment_author,
			'content'       => $r->comment_content,
			'is_instructor' => $is_staff,
			'badge'         => $is_staff ? 'Instructor' : 'Student',
			'date'          => human_time_diff( strtotime( $r->comment_date_gmt . ' UTC' ) ) . ' ago',
			'date_iso'      => mysql2date( 'c', $r->comment_date_gmt . ' +0000' ),
		);
	}

	/**
	 * POST /wp-json/eta/v1/course-qa
	 * Submit a question from the mobile app
	 */
	public function submit_course_qa( $request ) {
		$params    = $request->get_json_params() ?: $request->get_params();
		$raw_id    = $params['course_id'] ?? $params['id'] ?? 0;
		$course_id = $this->resolve_canonical_course_id( $raw_id );
		if ( ! $course_id ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Valid course_id is required.' ), 400 );
		}

		// Only signed-in accounts may ask. Guests used to be able to post (and trigger an email) anonymously.
		$user_id = $this->get_current_user_id();
		if ( ! $user_id ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Please sign in to ask a question.' ), 401 );
		}
		$u = get_userdata( $user_id );
		if ( ! $u ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Please sign in to ask a question.' ), 401 );
		}

		$question_text = trim( sanitize_textarea_field( $params['question'] ?? $params['question_text'] ?? '' ) );
		if ( '' === $question_text ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Question cannot be empty.' ), 400 );
		}
		if ( mb_strlen( $question_text ) < 5 ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Please write a little more so the instructor can help.' ), 400 );
		}
		if ( mb_strlen( $question_text ) > 1000 ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Questions can be at most 1000 characters.' ), 400 );
		}

		// Rate limit: at most 5 questions per user per hour, across all courses.
		$recent = get_comments( array(
			'user_id'    => $user_id,
			'type'       => 'eta_course_question',
			'status'     => 'all',
			'count'      => true,
			'date_query' => array( array( 'column' => 'comment_date_gmt', 'after' => '1 hour ago', 'inclusive' => true ) ),
		) );
		if ( (int) $recent >= 5 ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'You have asked several questions recently. Please wait a while before asking another.' ), 429 );
		}

		// Reject an exact repeat of a question this user already asked on this course.
		$existing = get_comments( array(
			'post_id' => $course_id,
			'user_id' => $user_id,
			'type'    => 'eta_course_question',
			'status'  => 'all',
			'number'  => 50,
		) );
		foreach ( $existing as $c ) {
			if ( 0 === strcasecmp( trim( $c->comment_content ), $question_text ) ) {
				return new WP_REST_Response( array( 'success' => false, 'error' => 'You have already asked this question.' ), 409 );
			}
		}

		// Questions are credited to the signed-in account. author_name / author_email in the body are ignored.
		$author_name  = $u->display_name ?: $u->user_login;
		$author_email = $u->user_email;

		$comment_id = wp_insert_comment( array(
			'comment_post_ID'      => $course_id,
			'comment_author'       => $author_name,
			'comment_author_email' => $author_email,
			'comment_content'      => $question_text,
			'comment_type'         => 'eta_course_question',
			'user_id'              => $user_id,
			'comment_approved'     => 1,
			'comment_date'         => current_time( 'mysql' ),
		) );

		if ( ! $comment_id ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Could not save your question. Please try again.' ), 500 );
		}

		// Notify instructor team via email
		$course_title = get_the_title( $course_id );
		$to           = 'Expresstechacademy@gmail.com';
		$subject      = sprintf( '❓ New Mobile Course Question: %s [%s]', $course_title, $author_name );
		$headers      = array( 'Content-Type: text/html; charset=UTF-8' );
		$email_body   = sprintf(
			'<p><strong>Student (Mobile App):</strong> %s &lt;%s&gt;</p><p><strong>Course:</strong> %s</p><p><strong>Question:</strong></p><blockquote>%s</blockquote>',
			esc_html( $author_name ),
			esc_html( $author_email ),
			esc_html( $course_title ),
			nl2br( esc_html( $question_text ) )
		);
		wp_mail( $to, $subject, $email_body, $headers );

		return new WP_REST_Response( array(
			'success' => true,
			'message' => 'Thank you! Your question has been submitted successfully. Our instructor team will review and respond promptly.',
			'qa_item' => array(
				'id'          => (int) $comment_id,
				'type'        => 'question',
				'question'    => $question_text,
				'answer'      => 'Thank you for asking! Our instructors have received your question and will answer it shortly.',
				'answered'    => false,
				'badge'       => 'Just Asked',
				'author'      => $author_name,
				'date'        => 'Just now',
				'date_iso'    => gmdate( 'c' ),
				'can_reply'   => true,
				'reply_count' => 0,
				'replies'     => array(),
			),
		), 201 );
	}

	/**
	 * POST /wp-json/eta/v1/course-qa/reply  (alias /qa/reply)
	 * Reply to a student question. Any signed-in user may reply; replies from
	 * instructors/admins become the question's answer (website and app).
	 * Body: question_id (or parent_id), reply (or content / message).
	 */
	public function submit_course_qa_reply( $request ) {
		// Body (JSON or form) plus any question ID in the URL.
		$params = array_merge( (array) $request->get_params(), (array) $request->get_json_params() );
		$url    = $request->get_url_params();
		if ( isset( $url['question_id'] ) && '' !== $url['question_id'] && ! ctype_digit( (string) ( $params['question_id'] ?? '' ) ) ) {
			$params['question_id'] = $url['question_id'];
		}

		$user_id = $this->get_current_user_id();
		$u       = $user_id ? get_userdata( $user_id ) : false;
		if ( ! $u ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Please sign in to reply.' ), 401 );
		}

		$question_id = 0;
		foreach ( array( 'question_id', 'questionId', 'qa_id', 'qaId', 'parent_id', 'parentId', 'parent', 'comment_id', 'commentId', 'id' ) as $key ) {
			if ( isset( $params[ $key ] ) && is_scalar( $params[ $key ] ) && ctype_digit( (string) $params[ $key ] ) && (int) $params[ $key ] > 0 ) {
				$question_id = (int) $params[ $key ];
				break;
			}
		}
		if ( ! $question_id ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Replies are only for student questions. Built-in FAQ answers cannot be replied to.' ), 400 );
		}
		$question    = $question_id ? get_comment( $question_id ) : null;
		if ( ! $question || 'eta_course_question' !== $question->comment_type || '1' !== (string) $question->comment_approved || (int) $question->comment_parent !== 0 ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'That question was not found.' ), 404 );
		}
		$course_id = (int) $question->comment_post_ID;

		$text = '';
		foreach ( array( 'reply', 'content', 'message', 'answer', 'text', 'body', 'comment' ) as $key ) {
			if ( isset( $params[ $key ] ) && is_string( $params[ $key ] ) && '' !== trim( $params[ $key ] ) ) {
				$text = trim( sanitize_textarea_field( $params[ $key ] ) );
				break;
			}
		}
		if ( '' === $text ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Reply cannot be empty.' ), 400 );
		}
		if ( mb_strlen( $text ) < 2 ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Please write a little more.' ), 400 );
		}
		if ( mb_strlen( $text ) > 1000 ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Replies can be at most 1000 characters.' ), 400 );
		}

		$is_staff = $this->is_qa_staff( $user_id, $course_id );

		// Rate limit for students: at most 10 replies per hour across all courses.
		if ( ! $is_staff ) {
			$recent = get_comments( array(
				'user_id'    => $user_id,
				'type'       => 'eta_qa_reply',
				'status'     => 'all',
				'count'      => true,
				'date_query' => array( array( 'column' => 'comment_date_gmt', 'after' => '1 hour ago', 'inclusive' => true ) ),
			) );
			if ( (int) $recent >= 10 ) {
				return new WP_REST_Response( array( 'success' => false, 'error' => 'You have replied several times recently. Please wait a while before replying again.' ), 429 );
			}
		}

		foreach ( $this->get_qa_reply_comments( $question_id ) as $r ) {
			if ( (int) $r->user_id === $user_id && 0 === strcasecmp( trim( $r->comment_content ), $text ) ) {
				return new WP_REST_Response( array( 'success' => false, 'error' => 'You have already posted this reply.' ), 409 );
			}
		}

		$author_name = $u->display_name ?: $u->user_login;
		$reply_id    = wp_insert_comment( array(
			'comment_post_ID'      => $course_id,
			'comment_parent'       => $question_id,
			'comment_author'       => $author_name,
			'comment_author_email' => $u->user_email,
			'comment_content'      => $text,
			'comment_type'         => 'eta_qa_reply',
			'user_id'              => $user_id,
			'comment_approved'     => 1,
			'comment_date'         => current_time( 'mysql' ),
			'comment_date_gmt'     => current_time( 'mysql', true ),
		) );
		if ( ! $reply_id ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Could not save your reply. Please try again.' ), 500 );
		}

		// Email: the asker when someone else replies; the instructor team when a student replies.
		$course_title = get_the_title( $course_id );
		$headers      = array( 'Content-Type: text/html; charset=UTF-8' );
		$body         = sprintf(
			'<p><strong>Course:</strong> %s</p><p><strong>Question:</strong></p><blockquote>%s</blockquote><p><strong>%s replied:</strong></p><blockquote>%s</blockquote>',
			esc_html( $course_title ),
			nl2br( esc_html( $question->comment_content ) ),
			esc_html( $author_name ),
			nl2br( esc_html( $text ) )
		);
		$asker_email = sanitize_email( $question->comment_author_email );
		if ( $asker_email && (int) $question->user_id !== $user_id ) {
			wp_mail( $asker_email, sprintf( 'New reply to your question on %s', $course_title ), $body, $headers );
		}
		if ( ! $is_staff ) {
			wp_mail( 'Expresstechacademy@gmail.com', sprintf( 'New Q&A reply: %s [%s]', $course_title, $author_name ), $body, $headers );
		}

		return new WP_REST_Response( array(
			'success'  => true,
			'message'  => 'Your reply has been posted.',
			'answered' => $is_staff,
			'reply'    => $this->format_qa_reply( get_comment( $reply_id ) ),
		), 201 );
	}

	/**
	 * GET /wp-json/eta/v1/certificates
	 * Retrieve all earned certificates for a student
	 */
	public function get_student_certificates( $request ) {
		$user_id = $this->get_current_user_id();

		if ( ! $user_id ) {
			return new WP_REST_Response( array(
				'success'      => false,
				'error'        => 'Authentication required. Please provide a valid Bearer token.',
				'certificates' => array(),
			), 401 );
		}

		$u = get_userdata( $user_id );
		$student_name = $u ? ( trim( $u->first_name . ' ' . $u->last_name ) ?: $u->display_name ) : 'Student';

		$certificates         = array();
		$completed_course_ids = $this->get_completed_course_ids( $user_id );

		foreach ( $completed_course_ids as $cid ) {
			$verification_code = "{$cid}-1070-{$user_id}";
			$certificates[] = array(
				'id'                => 1070,
				'course_id'         => $cid,
				'course_title'      => html_entity_decode( get_the_title( $cid ), ENT_QUOTES, 'UTF-8' ),
				'student_name'      => $student_name,
				'verification_code' => $verification_code,
				'verification_url'  => home_url( "/certificate-verification/?code={$verification_code}" ),
				'download_url'      => eta_certificate_download_url( $cid, $user_id ),
				'status'            => 'issued',
				'issued_date'       => get_user_meta( $user_id, "_course_{$cid}_cert_email_sent", true ) ?: current_time( 'Y-m-d' ),
				'grade'             => '100%',
			);
		}

		return new WP_REST_Response( array(
			'success'      => true,
			'student_name' => $student_name,
			'count'        => count( $certificates ),
			'certificates' => $certificates,
		), 200 );
	}

	/**
	 * Helper: course IDs this user has completed (Masteriyo progress, plus stored certificates).
	 */
	private function get_completed_course_ids( $user_id ) {
		global $wpdb;
		$user_id              = (int) $user_id;
		$completed_course_ids = array();
		$table_progress       = $wpdb->prefix . 'masteriyo_course_progress';
		if ( $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $table_progress ) ) === $table_progress ) {
			$progress_rows = $wpdb->get_results( $wpdb->prepare(
				"SELECT course_id FROM {$table_progress} WHERE user_id = %d AND status = 'completed'",
				$user_id
			) );
			foreach ( $progress_rows as $pr ) {
				$completed_course_ids[] = (int) $pr->course_id;
			}
		}
		$meta_certs = get_user_meta( $user_id, '_eta_certificates', true );
		if ( is_array( $meta_certs ) ) {
			foreach ( $meta_certs as $mc ) {
				if ( isset( $mc['course_id'] ) ) {
					$completed_course_ids[] = (int) $mc['course_id'];
				}
			}
		}
		return array_values( array_unique( array_filter( $completed_course_ids ) ) );
	}

	/**
	 * GET /wp-json/eta/v1/certificates/download?c=&u=&e=&s=
	 * Streams the certificate PDF, generated on the server by Masteriyo (mPDF).
	 * The link is signed for one user and course (eta_certificate_download_url), so it
	 * works in a browser opened from the app, where the student is not logged in.
	 */
	public function download_certificate( $request ) {
		$course_id = (int) $request->get_param( 'c' );
		$user_id   = (int) $request->get_param( 'u' );
		$expires   = (int) $request->get_param( 'e' );
		$sig       = (string) $request->get_param( 's' );

		// Students open this link in a browser, so errors are a small readable page, not JSON.
		$fail = function( $message, $status = 403 ) {
			status_header( $status );
			header( 'Content-Type: text/html; charset=utf-8' );
			echo '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificate</title>'
				. '<div style="font-family:Arial,sans-serif;max-width:480px;margin:15vh auto;padding:24px;text-align:center;color:#0F172A">'
				. '<h2 style="margin:0 0 12px">Certificate</h2><p>' . esc_html( $message ) . '</p>'
				. '<p><a href="' . esc_url( home_url( '/' ) ) . '">Express Tech Academy</a></p></div>';
			exit;
		};

		if ( ! $course_id || ! $user_id || ! $expires || '' === $sig || ! hash_equals( eta_certificate_link_signature( $course_id, $user_id, $expires ), $sig ) ) {
			$fail( 'This certificate link is not valid.' );
		}
		if ( $expires < time() ) {
			$fail( 'This certificate link has expired. Open your certificates again to get a new link.' );
		}
		if ( ! get_userdata( $user_id ) || 'mto-course' !== get_post_type( $course_id ) ) {
			$fail( 'This certificate could not be found.', 404 );
		}

		$completed = in_array( $course_id, $this->get_completed_course_ids( $user_id ), true );
		if ( ! $completed && function_exists( 'masteriyo_user_has_completed_course' ) && function_exists( 'masteriyo_get_course' ) ) {
			$course    = masteriyo_get_course( $course_id );
			$completed = $course && masteriyo_user_has_completed_course( $course, $user_id );
		}
		if ( ! $completed ) {
			$fail( 'Please complete the course to download the certificate.' );
		}

		$cert_id = function_exists( 'masteriyo_get_course_certificate_id' ) ? (int) masteriyo_get_course_certificate_id( $course_id ) : 0;
		if ( ! $cert_id ) {
			$cert_id = (int) get_post_meta( $course_id, '_certificate_id', true );
		}
		if ( ! $cert_id && function_exists( 'eta_ensure_certificate_template' ) ) {
			$cert_id = (int) eta_ensure_certificate_template();
		}
		$pdf_class = '\Masteriyo\Addons\Certificate\PDF\CertificatePDF';
		if ( ! $cert_id || ! class_exists( $pdf_class ) ) {
			$fail( 'Certificates are not available right now. Please try again later.', 503 );
		}

		while ( ob_get_level() > 0 ) {
			ob_end_clean();
		}
		$pdf = new $pdf_class( $course_id, $user_id, '', $cert_id );
		$pdf->serve_download(); // Sends the PDF and exits.
		exit;
	}

	/**
	 * GET /wp-json/eta/v1/certificates/verify
	 * Verify an official certificate code from mobile
	 */
	public function verify_certificate_endpoint( $request ) {
		$code = sanitize_text_field( $request->get_param( 'code' ) );
		if ( empty( $code ) ) {
			return new WP_REST_Response( array( 'success' => false, 'error' => 'Verification code is required.' ), 400 );
		}

		$parts = explode( '-', $code );
		if ( count( $parts ) < 3 ) {
			return new WP_REST_Response( array(
				'success' => true,
				'valid'   => false,
				'error'   => 'Invalid certificate verification code format.',
			), 200 );
		}

		$course_id  = (int) $parts[0];
		$cert_id    = (int) $parts[1];
		$student_id = (int) $parts[2];

		$course  = get_post( $course_id );
		$student = get_userdata( $student_id );

		if ( ! $course || ! $student ) {
			return new WP_REST_Response( array(
				'success' => true,
				'valid'   => false,
				'error'   => 'Certificate record could not be found.',
			), 200 );
		}

		$student_name = trim( $student->first_name . ' ' . $student->last_name ) ?: $student->display_name;

		return new WP_REST_Response( array(
			'success'           => true,
			'valid'             => true,
			'verification_code' => $code,
			'student_name'      => $student_name,
			'course_title'      => html_entity_decode( $course->post_title, ENT_QUOTES, 'UTF-8' ),
			'issuer'            => 'Express Tech Academy',
			'status'            => 'Officially Issued & Verified',
			'verification_url'  => home_url( "/certificate-verification/?code={$code}" ),
		), 200 );
	}

}

/**
 * Course price list, applied once per ETA_COURSE_PRICES_VERSION.
 *
 * Each entry is course ID => array( regular price, sale price ). A sale price of '' means no
 * slash price. Every other published course is set to free.
 * Saving through Masteriyo also updates the linked WooCommerce product (its
 * masteriyo_update_course hook), which is what the website checkout charges.
 *
 * To change prices later: edit this list, bump the version, deploy.
 */
define( 'ETA_COURSE_PRICES_VERSION', '2026-11-12' );

function eta_course_price_list() {
	return array(
		1079 => array( '20000', '6000' ), // Digital Marketing: launch promo, remove the sale price one month after launch.
		680  => array( '10000', '' ),     // Paid Online Survey
		955  => array( '5000', '' ),      // Content Writing
		954  => array( '5000', '' ),      // Copywriting
		979  => array( '2500', '' ),      // Graphic Design
		470  => array( '3000', '' ),      // PayPal Mastery
	);
}

function eta_apply_course_prices() {
	if ( ETA_COURSE_PRICES_VERSION === get_option( 'eta_course_prices_version' ) ) {
		return;
	}
	if ( ! function_exists( 'masteriyo_get_course' ) ) {
		return;
	}

	// Free courses copy the access setup of a course that is already free and working (CPA Marketing).
	$free_reference = masteriyo_get_course( 978 );
	$free_access    = $free_reference ? $free_reference->get_access_mode() : '';
	// Masteriyo only treats "open" and "need_registration" as free.
	if ( ! in_array( $free_access, array( 'open', 'need_registration' ), true ) ) {
		$free_access = 'need_registration';
	}

	$paid   = eta_course_price_list();
	$report = array();
	$ids    = get_posts( array(
		'post_type'      => 'mto-course',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	) );

	foreach ( $ids as $id ) {
		$course = masteriyo_get_course( $id );
		if ( ! $course ) {
			continue;
		}
		$before = array( $course->get_access_mode(), $course->get_regular_price(), $course->get_sale_price() );

		if ( isset( $paid[ $id ] ) ) {
			list( $regular, $sale ) = $paid[ $id ];
			if ( ! in_array( $course->get_access_mode(), array( 'one_time', 'recurring' ), true ) ) {
				$course->set_access_mode( 'one_time' );
			}
		} else {
			$regular = '0';
			$sale    = '';
			if ( $free_access ) {
				$course->set_access_mode( $free_access );
			}
		}
		$course->set_regular_price( $regular );
		$course->set_sale_price( $sale );
		$course->save();

		// Belt and braces: set the linked WooCommerce product directly as well.
		$product_id = (int) get_post_meta( $id, '_wc_product_id', true );
		if ( $product_id && function_exists( 'wc_get_product' ) ) {
			$product = wc_get_product( $product_id );
			if ( $product ) {
				$product->set_regular_price( $regular );
				$product->set_sale_price( $sale );
				$product->save();
			}
		}

		$report[ $id ] = array(
			'before'  => $before,
			'after'   => array( $course->get_access_mode(), $regular, $sale ),
			'product' => $product_id,
		);
	}

	update_option( 'eta_course_prices_report', $report, false );
	update_option( 'eta_course_prices_version', ETA_COURSE_PRICES_VERSION );

	if ( function_exists( 'wc_delete_product_transients' ) ) {
		wc_delete_product_transients();
	}
	do_action( 'litespeed_purge_all' );
}
add_action( 'init', 'eta_apply_course_prices', 99 );

/**
 * Certificate download links: signed for one user + course, valid for $ttl seconds
 * (7 days by default). Used by the app API, Masteriyo's download buttons and the
 * completion email.
 */
function eta_certificate_link_signature( $course_id, $user_id, $expires ) {
	return hash_hmac( 'sha256', 'eta-cert|' . (int) $course_id . '|' . (int) $user_id . '|' . (int) $expires, wp_salt( 'auth' ) );
}

function eta_certificate_download_url( $course_id, $user_id, $ttl = 0 ) {
	$ttl     = $ttl > 0 ? (int) $ttl : 7 * DAY_IN_SECONDS;
	$expires = time() + $ttl;
	return add_query_arg( array(
		'c' => (int) $course_id,
		'u' => (int) $user_id,
		'e' => $expires,
		's' => eta_certificate_link_signature( $course_id, $user_id, $expires ),
	), rest_url( 'eta/v1/certificates/download' ) );
}

// Masteriyo's "Download certificate" buttons build the PDF in the browser for pdfdraft
// templates, which fails for our template. Point them at the server-generated PDF instead.
add_filter( 'masteriyo_certificate_download_url', function( $url, $course ) {
	$user_id = get_current_user_id();
	if ( $user_id && is_object( $course ) && is_callable( array( $course, 'get_id' ) ) ) {
		return eta_certificate_download_url( $course->get_id(), $user_id );
	}
	return $url;
}, 20, 2 );

/**
 * Catalogue changes, applied once per ETA_CATALOG_CHANGES_VERSION:
 * - new thumbnails for CPA Marketing (978) and Digital Marketing (1079), from images
 *   uploaded to wp-content/uploads/2026/11/;
 * - CPA Marketing (978) and Graphic Design (979) moved to draft until their videos are
 *   complete (course and its WooCommerce product). Publish them again in the admin.
 * The result is stored in the eta_catalog_changes_report option.
 */
define( 'ETA_CATALOG_CHANGES_VERSION', '2026-11-13' );

function eta_apply_catalog_changes() {
	if ( ETA_CATALOG_CHANGES_VERSION === get_option( 'eta_catalog_changes_version' ) ) {
		return;
	}
	if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}

	$report = array( 'thumbnails' => array(), 'drafts' => array() );
	$uploads = wp_upload_dir();

	$thumbnails = array(
		978  => array( '2026/11/cpa-marketing-course-thumbnail.jpg', 'CPA Marketing Course' ),
		1079 => array( '2026/11/digital-marketing-course-thumbnail.jpg', 'Digital Marketing Complete Course' ),
	);
	foreach ( $thumbnails as $course_id => $info ) {
		list( $rel, $title ) = $info;
		$file = trailingslashit( $uploads['basedir'] ) . $rel;
		if ( ! file_exists( $file ) ) {
			$report['thumbnails'][ $course_id ] = 'image file missing';
			continue;
		}
		$existing = get_posts( array(
			'post_type'      => 'attachment',
			'post_status'    => 'any',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_key'       => '_wp_attached_file',
			'meta_value'     => $rel,
		) );
		$att_id = $existing ? (int) $existing[0] : 0;
		if ( ! $att_id ) {
			$att_id = wp_insert_attachment( array(
				'post_mime_type' => 'image/jpeg',
				'post_title'     => $title,
				'post_status'    => 'inherit',
			), $file, $course_id );
			if ( is_wp_error( $att_id ) || ! $att_id ) {
				$report['thumbnails'][ $course_id ] = 'attachment failed';
				continue;
			}
			wp_update_attachment_metadata( $att_id, wp_generate_attachment_metadata( $att_id, $file ) );
		}
		set_post_thumbnail( $course_id, $att_id );
		$product_id = (int) get_post_meta( $course_id, '_wc_product_id', true );
		if ( $product_id ) {
			set_post_thumbnail( $product_id, $att_id );
		}
		$report['thumbnails'][ $course_id ] = array( 'attachment' => $att_id, 'product' => $product_id );
	}

	foreach ( array( 978, 979 ) as $course_id ) {
		if ( 'mto-course' !== get_post_type( $course_id ) ) {
			$report['drafts'][ $course_id ] = 'not a course';
			continue;
		}
		wp_update_post( array( 'ID' => $course_id, 'post_status' => 'draft' ) );
		$product_id = (int) get_post_meta( $course_id, '_wc_product_id', true );
		if ( $product_id && 'product' === get_post_type( $product_id ) ) {
			wp_update_post( array( 'ID' => $product_id, 'post_status' => 'draft' ) );
		}
		$report['drafts'][ $course_id ] = array(
			'course'  => get_post_status( $course_id ),
			'product' => $product_id ? get_post_status( $product_id ) : null,
		);
	}

	update_option( 'eta_catalog_changes_report', $report, false );
	update_option( 'eta_catalog_changes_version', ETA_CATALOG_CHANGES_VERSION );
	if ( function_exists( 'wc_delete_product_transients' ) ) {
		wc_delete_product_transients();
	}
	do_action( 'litespeed_purge_all' );
}
add_action( 'init', 'eta_apply_catalog_changes', 100 );

// Diagnostics: remember the last 30 eta/v1 calls that matched no route (method, path,
// and body field names only, never values) in the eta_rest_no_route_log option.
add_filter( 'rest_post_dispatch', function( $response, $server, $request ) {
	if ( $response instanceof WP_REST_Response && 404 === $response->get_status() ) {
		$data = $response->get_data();
		if ( is_array( $data ) && isset( $data['code'] ) && 'rest_no_route' === $data['code'] && 0 === strpos( $request->get_route(), '/eta/' ) ) {
			$log   = get_option( 'eta_rest_no_route_log', array() );
			$log   = is_array( $log ) ? $log : array();
			$log[] = array(
				'time'   => gmdate( 'c' ),
				'method' => $request->get_method(),
				'route'  => substr( $request->get_route(), 0, 200 ),
				'query'  => array_keys( (array) $request->get_query_params() ),
				'body'   => array_keys( (array) ( $request->get_json_params() ?: $request->get_body_params() ) ),
			);
			update_option( 'eta_rest_no_route_log', array_slice( $log, -30 ), false );
		}
	}
	return $response;
}, 10, 3 );

// Bootstrap mobile bridge
$GLOBALS['eta_mobile_api_bridge'] = new ETA_Mobile_API_Bridge();

// One-time repair of paid app orders (see repair_paid_app_orders).
add_action( 'init', function () {
	if ( '2026-11-13b' === get_option( 'eta_app_order_repair_version' ) || ! function_exists( 'wc_get_orders' ) ) {
		return;
	}
	update_option( 'eta_app_order_repair_version', '2026-11-13b' );
	update_option( 'eta_app_order_repair_report', $GLOBALS['eta_mobile_api_bridge']->repair_paid_app_orders(), false );
}, 110 );

} // End if ! class_exists
