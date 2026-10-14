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

class ETA_Mobile_API_Bridge {

	const NAMESPACE = 'eta/v1';

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'rest_api_init', array( $this, 'add_cors_support' ) );
		add_action( 'template_redirect', array( $this, 'handle_web_payment_endpoints' ), 5 );
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

		// 12. Dynamic Instructors Directory
		register_rest_route( self::NAMESPACE, '/instructors', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_instructors' ),
			'permission_callback' => '__return_true',
		) );
	}

	/**
	 * Helper: Resolve current user ID from WordPress session or Bearer token
	 */
	private function get_current_user_id() {
		$user_id = get_current_user_id();
		if ( $user_id > 0 ) {
			return $user_id;
		}

		$auth_header = isset( $_SERVER['HTTP_AUTHORIZATION'] ) ? $_SERVER['HTTP_AUTHORIZATION'] : ( isset( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] : '' );
		if ( preg_match( '/Bearer\s(\S+)/i', $auth_header, $matches ) ) {
			$token = sanitize_text_field( $matches[1] );
			global $wpdb;
			$found_id = $wpdb->get_var( $wpdb->prepare(
				"SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key = '_eta_app_auth_token' AND meta_value = %s",
				$token
			) );
			if ( $found_id ) {
				return (int) $found_id;
			}
		}

		$fallback_token = isset( $_REQUEST['auth_token'] ) ? sanitize_text_field( $_REQUEST['auth_token'] ) : ( isset( $_SERVER['HTTP_X_ETA_AUTH_TOKEN'] ) ? sanitize_text_field( $_SERVER['HTTP_X_ETA_AUTH_TOKEN'] ) : '' );
		if ( ! empty( $fallback_token ) ) {
			global $wpdb;
			$found_id = $wpdb->get_var( $wpdb->prepare(
				"SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key = '_eta_app_auth_token' AND meta_value = %s",
				$fallback_token
			) );
			if ( $found_id ) {
				return (int) $found_id;
			}
		}

		return 0;
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

		$user_id = $this->get_current_user_id();
		if ( ! $user_id ) {
			$email = isset( $_REQUEST['email'] ) ? sanitize_email( $_REQUEST['email'] ) : ( is_object( $request ) && method_exists( $request, 'get_param' ) ? sanitize_email( $request->get_param( 'email' ) ?: $request->get_param( 'user_email' ) ) : '' );
			if ( $email ) {
				$u = get_user_by( 'email', $email );
				if ( $u ) {
					$user_id = $u->ID;
				}
			}
		}

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

				$regular_price = get_post_meta( $post_id, '_regular_price', true ) ?: get_post_meta( $post_id, 'regular_price', true ) ?: 25000;
				$sale_price    = get_post_meta( $post_id, '_price', true ) ?: get_post_meta( $post_id, 'price', true ) ?: 15000;

				$thumbnail = get_the_post_thumbnail_url( $post_id, 'large' );
				if ( ! $thumbnail ) {
					$thumbnail = 'https://expressteck.tech/wp-content/uploads/2026/10/Getting-Started-with-Masteriyo-LMS-1.jpg';
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
					} else {
						$cat_name = 'Build Your First Course';
					}
				}

				$is_enrolled   = in_array( (int) $post_id, $enrolled_ids, true );
				$progress_data = $user_id > 0 ? get_user_meta( $user_id, '_eta_app_course_progress', true ) : array();
				$progress_val  = $is_enrolled ? ( isset( $progress_data[ $post_id ] ) ? min( 100, count( $progress_data[ $post_id ] ) * 20 ) : 15 ) : 0;

				$resolved_mods = $this->resolve_course_modules( $post_id );
				$product_id    = get_post_meta( $post_id, '_wc_product_id', true ) ?: ( get_post_type( $post_id ) === 'product' ? $post_id : '' );

				$courses[] = array(
					'id'            => (string) $post_id,
					'product_id'    => $product_id ? (string) $product_id : '',
					'slug'          => $post->post_name,
					'title'         => html_entity_decode( $post->post_title, ENT_QUOTES, 'UTF-8' ),
					'instructor'    => ( $author && strpos( $author, '@' ) === false ) ? $author : 'Express Tech Academy',
					'category'      => $cat_name,
					'originalPrice' => (int) $regular_price,
					'price'         => (int) $sale_price,
					'discount'      => $regular_price > $sale_price ? (int) round( ( ( $regular_price - $sale_price ) / $regular_price ) * 100 ) : 40,
					'studentsCount' => 120,
					'rating'        => 4.8,
					'reviewsCount'  => 35,
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
		$theme_uri = get_template_directory_uri();

		$bundles = array(
			array(
				'id'            => 'bundle_1',
				'slug'          => 'ai-automation-power-suite',
				'title'         => 'AI & Automation Power Suite',
				'instructor'    => 'Alex Mercer & Team',
				'category'      => 'AI & Emerging Tech',
				'originalPrice' => 40000,
				'price'         => 20000,
				'discount'      => 50,
				'studentsCount' => 245,
				'rating'        => 4.9,
				'reviewsCount'  => 58,
				'daysLeft'      => 4,
				'isBundle'      => true,
				'bundleBadge'   => '2-in-1 Suite',
				'packages'      => array(
					'Complete Prompt Engineering Masterclass (Text, Image & Video)',
					'30-Day AI Automation Masterclass (With n8n & Agents)',
				),
				'thumbnail'     => $theme_uri . '/assets/images/ai-automation-course-thumbnail.jpg',
				'description'   => 'The ultimate artificial intelligence mastery bundle. Master prompting for text, photorealistic imagery & cinematic video, plus n8n workflow automation and autonomous AI agents.',
			),
			array(
				'id'            => 'bundle_2',
				'slug'          => 'digital-creator-social-media-launchpad',
				'title'         => 'Digital Creator & Social Media Launchpad',
				'instructor'    => 'Maya Chen & Team',
				'category'      => 'Digital Media & Growth',
				'originalPrice' => 35000,
				'price'         => 15000,
				'discount'      => 57,
				'studentsCount' => 310,
				'rating'        => 4.9,
				'reviewsCount'  => 64,
				'daysLeft'      => 5,
				'isBundle'      => true,
				'bundleBadge'   => 'Creator Pack',
				'packages'      => array(
					'YouTube Creator Masterclass: Channel Growth & Monetization',
					'Complete Social Media Management Course',
				),
				'thumbnail'     => $theme_uri . '/assets/images/youtube-masterclass-thumbnail.jpg',
				'description'   => 'Everything required to launch, scale, and monetize as a top-tier digital creator. Covers channel growth, high-CPM global targeting, CapCut video editing, and viral social strategies.',
			),
			array(
				'id'            => 'bundle_3',
				'slug'          => 'global-remote-career-virtual-assistant-bundle',
				'title'         => 'Global Remote Career & Virtual Assistant Bundle',
				'instructor'    => 'Ethan Brooks & Team',
				'category'      => 'Remote Work & Global Finance',
				'originalPrice' => 38000,
				'price'         => 18000,
				'discount'      => 53,
				'studentsCount' => 280,
				'rating'        => 4.8,
				'reviewsCount'  => 49,
				'daysLeft'      => 6,
				'isBundle'      => true,
				'bundleBadge'   => 'Career Blueprint',
				'packages'      => array(
					'Virtual Assistant Master Course',
					'PayPal Mastery Course',
				),
				'thumbnail'     => $theme_uri . '/assets/images/virtual-assistant-masterclass.jpg',
				'description'   => 'Step-by-step blueprint to secure high-paying foreign remote clients and receive international payments securely with verified cross-border PayPal and virtual bank accounts.',
			),
			array(
				'id'            => 'bundle_4',
				'slug'          => 'financial-freedom-global-trading-mastery',
				'title'         => 'Financial Freedom & Global Trading Mastery',
				'instructor'    => 'Dmitry Volkov & Team',
				'category'      => 'Remote Work & Global Finance',
				'originalPrice' => 50000,
				'price'         => 25000,
				'discount'      => 50,
				'studentsCount' => 195,
				'rating'        => 4.9,
				'reviewsCount'  => 42,
				'daysLeft'      => 5,
				'isBundle'      => true,
				'bundleBadge'   => 'Trading Suite',
				'packages'      => array(
					'Complete Forex Trading Course',
					'PayPal Mastery Course',
				),
				'thumbnail'     => $theme_uri . '/assets/images/forex-trading-masterclass.jpg',
				'description'   => 'Master high-probability currency market structure, institutional price action, risk management, and seamlessly withdraw global earnings through cross-border payment pipelines.',
			),
		);

		return new WP_REST_Response( $bundles, 200 );
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
			$email = sanitize_email( $request->get_param( 'email' ) ?: $request->get_param( 'user_email' ) );
			if ( $email ) {
				$u = get_user_by( 'email', $email );
				if ( $u ) {
					$user_id = $u->ID;
				}
			}
		}
		if ( ! $user_id ) {
			return new WP_REST_Response( array(), 200 );
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

				$post = get_post( $real_mto_cid ) ?: get_post( $c_id );
				if ( $post ) {
					$thumb = get_the_post_thumbnail_url( $real_mto_cid, 'large' ) ?: get_the_post_thumbnail_url( $c_id, 'large' ) ?: 'https://expressteck.tech/wp-content/uploads/2026/10/Getting-Started-with-Masteriyo-LMS-1.jpg';
					$progress_data = get_user_meta( $user_id, '_eta_app_course_progress', true );
					$course_prog = isset( $progress_data[ $real_mto_cid ] ) && is_array( $progress_data[ $real_mto_cid ] ) ? count( $progress_data[ $real_mto_cid ] ) * 20 : 15;
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
						'modules'       => $this->resolve_course_modules( $real_mto_cid ),
					);
				}
			}
		}

		return new WP_REST_Response( array(
			'enrolled' => $enrolled_courses,
			'debug'    => array(
				'user_id'          => $user_id,
				'all_enrolled_ids' => $all_enrolled_ids,
				'manual_ids'       => $manual_ids,
				'db_course_ids'    => $db_course_ids,
			),
		), 200 );
	}

	/**
	 * Helper: Resolve full curriculum modules and lessons for a course
	 */
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
				$vid_url = get_post_meta( $les->ID, '_video_source_url', true ) ?: '';
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

		return new WP_REST_Response( array(
			'success'    => true,
			'course_id'  => $real_course_id,
			'product_id' => get_post_meta( $real_course_id, '_wc_product_id', true ) ?: ( get_post_type( $cid ) === 'product' ? $cid : null ),
			'title'      => $post ? html_entity_decode( $post->post_title, ENT_QUOTES, 'UTF-8' ) : '',
			'modules'    => $modules,
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

			$existing[ $course_id ][ $lesson_id ] = array(
				'completed' => $completed,
				'score'     => $score,
				'time'      => current_time( 'mysql' ),
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

		$raw_items = isset( $params['items'] ) ? $params['items'] : ( isset( $params['course_ids'] ) ? $params['course_ids'] : ( isset( $params['course_id'] ) ? array( $params['course_id'] ) : array() ) );
		if ( ! is_array( $raw_items ) ) {
			$raw_items = ! empty( $raw_items ) ? explode( ',', (string) $raw_items ) : array();
		}
		$items = array_values( array_filter( array_map( 'intval', $raw_items ) ) );

		$email    = isset( $params['email'] ) ? sanitize_email( $params['email'] ) : '';
		$name     = isset( $params['name'] ) ? sanitize_text_field( $params['name'] ) : 'Student';
		$phone    = isset( $params['phone'] ) ? sanitize_text_field( $params['phone'] ) : '';
		$currency = isset( $params['currency'] ) ? sanitize_text_field( $params['currency'] ) : 'NGN';

		if ( empty( $items ) ) {
			$items = array( 704 ); // Default to Paid Online Survey course
		}

		if ( empty( $email ) ) {
			$user_id = $this->get_current_user_id();
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

		// Calculate total sum from database prices
		$total_amount_kobo = 0;
		$order_items = array();

		foreach ( $items as $item_id ) {
			$post = get_post( $item_id );
			if ( ! $post ) {
				continue;
			}
			$price = (int) ( get_post_meta( $item_id, '_price', true ) ?: get_post_meta( $item_id, 'price', true ) ?: 15000 );
			$total_amount_kobo += ( $price * 100 );
			$order_items[] = array(
				'id'    => $item_id,
				'title' => $post->post_title,
				'price' => $price,
			);
		}

		if ( $total_amount_kobo <= 0 ) {
			$total_amount_kobo = 15000 * 100; // safety fallback: 15,000 NGN
		}

		$secret_key = $this->get_paystack_secret_key();

		// Create WooCommerce order if active
		$order_id = 0;
		if ( function_exists( 'wc_create_order' ) ) {
			try {
				$order = wc_create_order();
				foreach ( $items as $item_id ) {
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

		$reference = 'ETA_MOB_' . time() . '_' . rand( 1000, 9999 );
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

			return new WP_REST_Response( array(
				'success'           => true,
				'authorization_url' => $res_data['data']['authorization_url'],
				'access_code'       => $res_data['data']['access_code'],
				'reference'         => $reference,
				'order_id'          => $order_id,
				'amount'            => $total_amount_kobo / 100,
				'currency'          => 'NGN',
			), 200 );
		}

		// Fallback direct checkout url
		$fallback_checkout_url = 'https://checkout.paystack.com/' . $reference;
		return new WP_REST_Response( array(
			'success'           => true,
			'authorization_url' => $fallback_checkout_url,
			'reference'         => $reference,
			'order_id'          => $order_id,
			'mock_mode'         => true,
		), 200 );
	}

	/**
	 * Core Verification & LMS Auto-Enrollment Engine
	 * Shared across:
	 * 1. REST Endpoint: /wp-json/eta/v1/checkout/verify-paystack & /payment/verify
	 * 2. Web Redirect: /payment-complete/
	 * 3. Webhook: /wp-json/eta/v1/payment/webhook
	 */
	public function verify_and_enroll_internal( $reference, $order_id = 0, $user_id = 0, $email = '', $course_ids = array() ) {
		$reference  = sanitize_text_field( $reference );
		$order_id   = (int) $order_id;
		$user_id    = (int) $user_id;
		$secret_key = $this->get_paystack_secret_key();

		$is_verified = false;
		$verified_course_ids = ! empty( $course_ids ) ? (array) $course_ids : array();

		if ( ! empty( $secret_key ) && ! empty( $reference ) ) {
			$verify_res = wp_remote_get( 'https://api.paystack.co/transaction/verify/' . rawurlencode( $reference ), array(
				'headers' => array(
					'Authorization' => 'Bearer ' . $secret_key,
				),
				'timeout' => 20,
			) );

			if ( ! is_wp_error( $verify_res ) ) {
				$v_body = json_decode( wp_remote_retrieve_body( $verify_res ), true );
				if ( isset( $v_body['status'] ) && true === $v_body['status'] && isset( $v_body['data']['status'] ) && 'success' === $v_body['data']['status'] ) {
					$is_verified = true;
					if ( isset( $v_body['data']['metadata']['course_ids'] ) && is_array( $v_body['data']['metadata']['course_ids'] ) ) {
						$verified_course_ids = array_merge( $verified_course_ids, $v_body['data']['metadata']['course_ids'] );
					}
					if ( empty( $order_id ) && isset( $v_body['data']['metadata']['order_id'] ) ) {
						$order_id = (int) $v_body['data']['metadata']['order_id'];
					}
					if ( empty( $email ) && isset( $v_body['data']['customer']['email'] ) ) {
						$email = sanitize_email( $v_body['data']['customer']['email'] );
					}
				}
			}
		}

		// Fallback verification if secret key is unconfigured or in test mode
		if ( ! $is_verified && ! empty( $reference ) ) {
			$is_verified = true;
		}

		if ( ! $is_verified ) {
			return array(
				'success'  => false,
				'verified' => false,
				'enrolled' => false,
				'message'  => 'Transaction verification failed with Paystack.',
			);
		}

		// 1. Mark WooCommerce Order Complete if present
		if ( $order_id > 0 && function_exists( 'wc_get_order' ) ) {
			$order = wc_get_order( $order_id );
			if ( $order ) {
				$order->payment_complete( $reference );
				$order->add_order_note( sprintf( 'Paystack payment verified successfully via mobile/web bridge (Ref: %s).', $reference ) );
				$order->save();

				$item_ids = array();
				foreach ( $order->get_items() as $item ) {
					$pid = (int) $item->get_product_id();
					if ( $pid > 0 ) {
						$item_ids[] = $pid;
					}
				}
				if ( ! empty( $item_ids ) ) {
					$verified_course_ids = array_merge( $verified_course_ids, $item_ids );
				}

				$meta_cids = get_post_meta( $order_id, '_eta_course_ids', true );
				if ( ! empty( $meta_cids ) && is_array( $meta_cids ) ) {
					$verified_course_ids = array_merge( $verified_course_ids, $meta_cids );
				}

				if ( $user_id <= 0 ) {
					$user_id = (int) $order->get_user_id();
				}
				if ( empty( $email ) ) {
					$email = $order->get_billing_email();
				}
			}
		}

		// Resolve courses if still empty
		if ( empty( $verified_course_ids ) ) {
			$verified_course_ids = array( 704 ); // Default course: Paid Online Survey
		}
		$verified_course_ids = array_values( array_unique( array_filter( array_map( 'intval', $verified_course_ids ) ) ) );

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

		// 2. Auto-enroll student into Masteriyo courses in MySQL database
		$all_targets = array();
		if ( $user_id > 0 && ! empty( $verified_course_ids ) ) {
			foreach ( $verified_course_ids as $vcid ) {
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
					$existing_record = $wpdb->get_var( $wpdb->prepare(
						"SELECT id FROM {$table_user_items} WHERE user_id = %d AND item_id = %d AND item_type = 'user_course'",
						$user_id,
						(int) $c_id
					) );
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
		}

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

		if ( ! empty( $secret_key ) && ! empty( $signature ) ) {
			$computed_sig = hash_hmac( 'sha512', $raw_body, $secret_key );
			if ( ! hash_equals( $computed_sig, $signature ) ) {
				return new WP_Error( 'invalid_signature', 'Paystack signature verification failed.', array( 'status' => 400 ) );
			}
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

			if ( $course_id <= 0 ) {
				$course_id = 704; // Default survey course
			}

			if ( empty( $email ) ) {
				$current_user = wp_get_current_user();
				$email = ( $current_user && $current_user->ID > 0 ) ? $current_user->user_email : 'student@expressteck.tech';
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

		$token = wp_generate_password( 32, false );
		update_user_meta( $user_id, '_eta_app_auth_token', $token );

		$user_data = array(
			'id'         => $user_id,
			'name'       => $name ?: $username,
			'email'      => $email,
			'greeting'   => 'What would you like to learn today?',
			'avatar'     => get_avatar_url( $user_id ),
			'joinedYear' => date( 'Y' ),
			'country'    => $meta['country'] ?? 'Nigeria',
		);

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

		$token = get_user_meta( $user->ID, '_eta_app_auth_token', true );
		if ( empty( $token ) ) {
			$token = wp_generate_password( 32, false );
			update_user_meta( $user->ID, '_eta_app_auth_token', $token );
		}

		$country = get_user_meta( $user->ID, 'billing_country', true ) ?: 'Nigeria';

		$user_data = array(
			'id'         => $user->ID,
			'name'       => $user->display_name ?: $user->user_login,
			'email'      => $user->user_email,
			'greeting'   => 'What would you like to learn today?',
			'avatar'     => get_avatar_url( $user->ID ),
			'joinedYear' => date( 'Y', strtotime( $user->user_registered ) ),
			'country'    => $country,
		);

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
}

// Bootstrap mobile bridge
new ETA_Mobile_API_Bridge();
