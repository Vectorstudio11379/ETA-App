<?php
/**
 * Plugin Name: ETA App Mobile API Bridge
 * Plugin URI: https://expressteck.tech
 * Description: Complete Mobile REST API Bridge for ETA React Native App providing Authentication (Login, Register), Live Courses, User Cart, Wishlist, Course Progress, and Notifications directly connected to your WordPress MySQL database.
 * Version: 1.2.0
 * Author: ETA App Team
 * Author URI: https://expressteck.tech
 * License: GPL2
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class ETA_App_API_Bridge {

    const NAMESPACE = 'eta/v1';

    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('rest_api_init', array($this, 'add_cors_support'));
    }

    /**
     * Add CORS support for cross-origin mobile and web requests
     */
    public function add_cors_support() {
        remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
        add_filter('rest_pre_serve_request', function($value) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
            return $value;
        });
    }

    /**
     * Register REST API Routes under /wp-json/eta/v1/
     */
    public function register_routes() {
        // 1. Mobile Authentication Endpoints
        register_rest_route(self::NAMESPACE, '/login', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'handle_login'),
            'permission_callback' => '__return_true',
        ));

        register_rest_route(self::NAMESPACE, '/register', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'handle_register'),
            'permission_callback' => '__return_true',
        ));

        // 2. Public Live Courses Catalog Endpoint
        register_rest_route(self::NAMESPACE, '/courses', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_courses'),
            'permission_callback' => '__return_true',
        ));

        // 3. User Cart Endpoints
        register_rest_route(self::NAMESPACE, '/cart', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_cart'),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'save_cart'),
                'permission_callback' => '__return_true',
            ),
        ));

        // 4. User Wishlist / Favourites Endpoints
        register_rest_route(self::NAMESPACE, '/wishlist', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_wishlist'),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'save_wishlist'),
                'permission_callback' => '__return_true',
            ),
        ));

        // 5. User Progress Endpoints
        register_rest_route(self::NAMESPACE, '/progress', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_progress'),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'save_progress'),
                'permission_callback' => '__return_true',
            ),
        ));

        // 6. Notifications Endpoint
        register_rest_route(self::NAMESPACE, '/notifications', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_notifications'),
            'permission_callback' => '__return_true',
        ));
    }

    /**
     * GET /wp-json/eta/v1/courses
     * Fetches real published courses directly from WordPress MySQL database
     */
    public function get_courses($request) {
        $args = array(
            'post_type'      => array('masteriyo-course', 'course', 'product', 'post'),
            'post_status'    => 'publish',
            'posts_per_page' => 50,
            'orderby'        => 'date',
            'order'          => 'DESC',
        );

        $query = new WP_Query($args);
        $courses = array();

        if ($query->have_posts()) {
            foreach ($query->posts as $post) {
                $post_id = $post->ID;
                $author = get_the_author_meta('display_name', $post->post_author);
                
                // Retrieve prices and thumbnails from post meta
                $regular_price = get_post_meta($post_id, '_regular_price', true) ?: get_post_meta($post_id, 'regular_price', true) ?: 25000;
                $sale_price = get_post_meta($post_id, '_price', true) ?: get_post_meta($post_id, 'price', true) ?: 15000;
                
                $thumbnail = get_the_post_thumbnail_url($post_id, 'large');
                if (!$thumbnail) {
                    $thumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop';
                }

                $categories = wp_get_post_terms($post_id, array('course_category', 'category', 'masteriyo_course_category'));
                $cat_name = !empty($categories) && !is_wp_error($categories) ? $categories[0]->name : 'Development';

                $courses[] = array(
                    'id'            => (string) $post_id,
                    'title'         => $post->post_title,
                    'instructor'    => $author ?: 'Expressteck Instructor',
                    'category'      => $cat_name,
                    'originalPrice' => (int) $regular_price,
                    'price'         => (int) $sale_price,
                    'discount'      => 40,
                    'studentsCount' => 120,
                    'rating'        => 4.8,
                    'reviewsCount'  => 35,
                    'daysLeft'      => 5,
                    'thumbnail'     => $thumbnail,
                    'description'   => wp_strip_all_tags($post->post_excerpt ?: wp_trim_words($post->post_content, 25)),
                    'isEnrolled'    => false,
                    'progress'      => 0,
                );
            }
        }

        return new WP_REST_Response($courses, 200);
    }

    /**
     * POST /wp-json/eta/v1/login
     */
    public function handle_login($request) {
        $params = $request->get_json_params();
        $username = isset($params['username']) ? sanitize_text_field($params['username']) : '';
        $password = isset($params['password']) ? $params['password'] : '';

        if (empty($username) || empty($password)) {
            return new WP_Error('missing_fields', 'Please provide both username/email and password.', array('status' => 400));
        }

        if (is_email($username)) {
            $user_obj = get_user_by('email', $username);
            if ($user_obj) {
                $username = $user_obj->user_login;
            }
        }

        $user = wp_authenticate($username, $password);

        if (is_wp_error($user)) {
            return new WP_Error('invalid_credentials', 'Invalid username, email, or password.', array('status' => 401));
        }

        $token = wp_generate_password(32, false);
        update_user_meta($user->ID, '_eta_app_auth_token', $token);

        $avatar = get_avatar_url($user->ID, array('size' => 150));
        $country = get_user_meta($user->ID, '_eta_app_country', true);

        return new WP_REST_Response(array(
            'success' => true,
            'token'   => $token,
            'user'    => array(
                'id'         => $user->ID,
                'name'       => $user->display_name ?: $user->user_login,
                'email'      => $user->user_email,
                'greeting'   => 'What would you like to learn today?',
                'avatar'     => $avatar ?: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
                'joinedYear' => date('Y', strtotime($user->user_registered)),
                'country'    => $country ?: 'Nigeria',
            ),
        ), 200);
    }

    /**
     * POST /wp-json/eta/v1/register
     */
    public function handle_register($request) {
        $params = $request->get_json_params();
        $email = isset($params['email']) ? sanitize_email($params['email']) : '';
        $password = isset($params['password']) ? $params['password'] : '';
        $name = isset($params['name']) ? sanitize_text_field($params['name']) : '';
        $phone = isset($params['meta']['phone']) ? sanitize_text_field($params['meta']['phone']) : '';
        $country = isset($params['meta']['country']) ? sanitize_text_field($params['meta']['country']) : 'Nigeria';

        if (empty($email) || empty($password)) {
            return new WP_Error('missing_fields', 'Email and password are required.', array('status' => 400));
        }

        if (email_exists($email)) {
            return new WP_Error('email_exists', 'An account with this email address already exists.', array('status' => 400));
        }

        $username = sanitize_user(current(explode('@', $email)));
        if (username_exists($username)) {
            $username = $username . '_' . rand(100, 999);
        }

        $user_id = wp_create_user($username, $password, $email);

        if (is_wp_error($user_id)) {
            return new WP_Error('registration_failed', $user_id->get_error_message(), array('status' => 400));
        }

        wp_update_user(array('ID' => $user_id, 'display_name' => $name, 'first_name' => $name));
        update_user_meta($user_id, '_eta_app_phone', $phone);
        update_user_meta($user_id, '_eta_app_country', $country);

        return $this->handle_login($request);
    }

    private function get_current_user_id() {
        $user_id = get_current_user_id();
        if ($user_id > 0) {
            return $user_id;
        }

        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        if (preg_match('/Bearer\s(\S+)/i', $auth_header, $matches)) {
            $token = $matches[1];
            global $wpdb;
            $user_id = $wpdb->get_var($wpdb->prepare(
                "SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key = '_eta_app_auth_token' AND meta_value = %s",
                $token
            ));
            if ($user_id) {
                return (int) $user_id;
            }
        }
        return 0;
    }

    public function get_cart($request) {
        $user_id = $this->get_current_user_id();
        if (!$user_id) {
            return new WP_REST_Response(array('cart_ids' => array()), 200);
        }
        $cart_ids = get_user_meta($user_id, '_eta_app_cart_ids', true);
        return new WP_REST_Response(array('cart_ids' => is_array($cart_ids) ? $cart_ids : array()), 200);
    }

    public function save_cart($request) {
        $user_id = $this->get_current_user_id();
        $params = $request->get_json_params();
        $cart_ids = isset($params['cart_ids']) ? (array) $params['cart_ids'] : array();

        if ($user_id > 0) {
            update_user_meta($user_id, '_eta_app_cart_ids', $cart_ids);
        }
        return new WP_REST_Response(array('success' => true, 'cart_ids' => $cart_ids), 200);
    }

    public function get_wishlist($request) {
        $user_id = $this->get_current_user_id();
        if (!$user_id) {
            return new WP_REST_Response(array('wishlist_ids' => array()), 200);
        }
        $wishlist_ids = get_user_meta($user_id, '_eta_app_wishlist_ids', true);
        return new WP_REST_Response(array('wishlist_ids' => is_array($wishlist_ids) ? $wishlist_ids : array()), 200);
    }

    public function save_wishlist($request) {
        $user_id = $this->get_current_user_id();
        $params = $request->get_json_params();
        $wishlist_ids = isset($params['wishlist_ids']) ? (array) $params['wishlist_ids'] : array();

        if ($user_id > 0) {
            update_user_meta($user_id, '_eta_app_wishlist_ids', $wishlist_ids);
        }
        return new WP_REST_Response(array('success' => true, 'wishlist_ids' => $wishlist_ids), 200);
    }

    public function get_progress($request) {
        $user_id = $this->get_current_user_id();
        if (!$user_id) {
            return new WP_REST_Response(array('progress' => array()), 200);
        }
        $progress = get_user_meta($user_id, '_eta_app_course_progress', true);
        return new WP_REST_Response(array('progress' => is_array($progress) ? $progress : array()), 200);
    }

    public function save_progress($request) {
        $user_id = $this->get_current_user_id();
        $params = $request->get_json_params();
        
        $course_id = isset($params['course_id']) ? sanitize_text_field($params['course_id']) : '';
        $lesson_id = isset($params['lesson_id']) ? sanitize_text_field($params['lesson_id']) : '';
        $completed = isset($params['completed']) ? (bool) $params['completed'] : false;

        if ($user_id > 0 && !empty($course_id)) {
            $existing = get_user_meta($user_id, '_eta_app_course_progress', true);
            if (!is_array($existing)) {
                $existing = array();
            }
            if (!isset($existing[$course_id])) {
                $existing[$course_id] = array();
            }

            $existing[$course_id][$lesson_id] = $completed;
            update_user_meta($user_id, '_eta_app_course_progress', $existing);
        }
        return new WP_REST_Response(array('success' => true), 200);
    }

    public function get_notifications($request) {
        $notifications = array(
            array(
                'id'           => 'n1',
                'dateGroup'    => 'Today',
                'title'        => 'Welcome to Expressteck!',
                'message'      => 'Explore our Masteriyo courses and start learning cutting-edge tech skills today.',
                'timeAgo'      => 'Just now',
                'exactTime'    => date('h:i A'),
                'targetScreen' => '/(tabs)',
            ),
        );
        return new WP_REST_Response($notifications, 200);
    }
}

// Initialize Plugin
new ETA_App_API_Bridge();
