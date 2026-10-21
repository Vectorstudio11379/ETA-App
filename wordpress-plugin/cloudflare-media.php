<?php
/**
 * Express Tech Academy - Cloudflare R2 Secure Media Gateway Integration
 *
 * Automatically generates time-limited, HMAC-SHA256 signed streaming URLs
 * for course video lectures stored in Cloudflare R2.
 * Prevents video scraping, hotlinking, and unauthorized link sharing.
 *
 * @package ExpressTechReact
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'ETA_MEDIA_GATEWAY_URL' ) ) {
	define( 'ETA_MEDIA_GATEWAY_URL', 'https://media.expressteck.workers.dev' );
}

if ( ! defined( 'ETA_MEDIA_SIGNING_SECRET' ) ) {
	define( 'ETA_MEDIA_SIGNING_SECRET', '2ce930fd6580d25d465b8dda13d55903c97db4d275354033862617994ef2fbc1' );
}

if ( ! defined( 'ETA_MEDIA_DEFAULT_EXPIRY' ) ) {
	define( 'ETA_MEDIA_DEFAULT_EXPIRY', 14400 ); // 4 hours
}

/**
 * Generate an HMAC-SHA256 signed streaming URL for a specific Cloudflare R2 key.
 *
 * @param string   $r2_key     Relative path in R2 bucket (e.g. 'courses/ai-automation/01_intro.mp4')
 * @param int|null $user_id    User ID to bind token to (defaults to current user)
 * @param int      $ttl        Validity window in seconds (default 4 hours)
 * @return string              Complete signed URL with signature, expiration, and user binding
 */
function eta_generate_secure_video_url( $r2_key, $user_id = null, $ttl = ETA_MEDIA_DEFAULT_EXPIRY ) {
	if ( empty( $r2_key ) ) {
		return '';
	}

	// Normalize key
	$clean_key = ltrim( trim( $r2_key ), '/' );

	// Strip gateway prefix if already present
	if ( false !== strpos( $clean_key, 'media.expressteck.workers.dev/' ) ) {
		$parts = explode( 'media.expressteck.workers.dev/', $clean_key );
		$clean_key = end( $parts );
		// Strip any existing query params
		$q_pos = strpos( $clean_key, '?' );
		if ( false !== $q_pos ) {
			$clean_key = substr( $clean_key, 0, $q_pos );
		}
	}

	if ( null === $user_id ) {
		$user_id = get_current_user_id();
	}
	$uid = ( $user_id && $user_id > 0 ) ? (string) $user_id : 'student_web';

	$expires = time() + (int) $ttl;
	$data_to_sign = "{$clean_key}|{$expires}|{$uid}";

	$token = hash_hmac( 'sha256', $data_to_sign, ETA_MEDIA_SIGNING_SECRET );

	return ETA_MEDIA_GATEWAY_URL . '/' . $clean_key . '?token=' . $token . '&expires=' . $expires . '&uid=' . rawurlencode( $uid );
}

/**
 * Retrieve the secured streaming URL for a given Masteriyo lesson post.
 *
 * @param int      $lesson_id
 * @param int|null $user_id
 * @return string
 */
function eta_get_lesson_secure_video_url( $lesson_id, $user_id = null ) {
	$lesson_id = (int) $lesson_id;
	if ( ! $lesson_id ) {
		return '';
	}

	static $in_lookup = array();
	if ( isset( $in_lookup[ $lesson_id ] ) ) {
		return '';
	}
	$in_lookup[ $lesson_id ] = true;

	// 1. Check direct R2 key meta in database
	$r2_key = get_post_meta( $lesson_id, '_r2_video_key', true );

	// 2. Fallback to bundled cloudflare_video_map.json
	if ( empty( $r2_key ) ) {
		static $video_map = null;
		if ( null === $video_map ) {
			$video_map = array();
			$map_file = dirname( __FILE__ ) . '/cloudflare_video_map.json';
			if ( file_exists( $map_file ) ) {
				$raw = json_decode( file_get_contents( $map_file ), true );
				if ( is_array( $raw ) ) {
					foreach ( $raw as $c ) {
						if ( isset( $c['videos'] ) && is_array( $c['videos'] ) ) {
							foreach ( $c['videos'] as $v ) {
								if ( isset( $v['lesson_id'] ) && isset( $v['r2_key'] ) ) {
									$video_map[ (int) $v['lesson_id'] ] = $v['r2_key'];
								}
							}
						}
					}
				}
			}
		}
		if ( isset( $video_map[ $lesson_id ] ) ) {
			$r2_key = $video_map[ $lesson_id ];
		}
	}

	if ( ! empty( $r2_key ) ) {
		unset( $in_lookup[ $lesson_id ] );
		return eta_generate_secure_video_url( $r2_key, $user_id );
	}

	// 3. Fallback to existing _video_source_url
	$vid_url = get_post_meta( $lesson_id, '_video_source_url', true );
	unset( $in_lookup[ $lesson_id ] );
	if ( empty( $vid_url ) ) {
		return '';
	}

	// If it points to our gateway or starts with 'courses/', sign it
	if ( false !== strpos( $vid_url, 'media.expressteck.workers.dev' ) || 0 === strpos( $vid_url, 'courses/' ) ) {
		return eta_generate_secure_video_url( $vid_url, $user_id );
	}

	return $vid_url;
}

/**
 * Filter Masteriyo LMS lesson video source URL dynamically so that whenever
 * Masteriyo loads a lesson in the interactive course player, it receives
 * a fresh signed Cloudflare streaming URL for the logged-in student.
 */
add_filter( 'get_post_metadata', function( $value, $object_id, $meta_key, $single ) {
	if ( '_video_source_url' !== $meta_key || ! $single ) {
		return $value;
	}

	static $guard = false;
	if ( $guard ) {
		return $value;
	}

	$guard = true;
	$sec_url = eta_get_lesson_secure_video_url( $object_id );
	$guard = false;

	if ( ! empty( $sec_url ) ) {
		return $sec_url;
	}

	return $value;
}, 10, 4 );

/**
 * Also ensure Masteriyo treats these lessons as self-hosted / external video source
 * so it renders the HTML5 player rather than the YouTube embed.
 */
add_filter( 'get_post_metadata', function( $value, $object_id, $meta_key, $single ) {
	if ( '_video_source' !== $meta_key || ! $single ) {
		return $value;
	}

	static $guard_src = false;
	if ( $guard_src ) {
		return $value;
	}

	$guard_src = true;
	$sec_url = eta_get_lesson_secure_video_url( $object_id );
	$guard_src = false;

	if ( ! empty( $sec_url ) && false !== strpos( $sec_url, 'media.expressteck.workers.dev' ) ) {
		return 'external';
	}

	return $value;
}, 10, 4 );

/**
 * Synchronize all course lessons in Masteriyo database to persist Cloudflare R2 keys
 */
function eta_run_cloudflare_video_db_sync() {
	$map_file = dirname( __FILE__ ) . '/cloudflare_video_map.json';
	if ( ! file_exists( $map_file ) ) {
		return array( 'success' => false, 'error' => 'Map file not found' );
	}

	$raw = json_decode( file_get_contents( $map_file ), true );
	if ( ! is_array( $raw ) ) {
		return array( 'success' => false, 'error' => 'Invalid map JSON' );
	}

	$updated = 0;
	foreach ( $raw as $c ) {
		if ( isset( $c['videos'] ) && is_array( $c['videos'] ) ) {
			foreach ( $c['videos'] as $v ) {
				$les_id = (int) $v['lesson_id'];
				$r2_key = $v['r2_key'];
				if ( $les_id && get_post( $les_id ) ) {
					$preview_url = eta_generate_secure_video_url( $r2_key, 0, 31536000 ); // Long-lived URL for admin previews
					update_post_meta( $les_id, '_r2_video_key', $r2_key );
					update_post_meta( $les_id, '_video_source', 'external' );
					update_post_meta( $les_id, '_video_source_url', $preview_url );
					clean_post_cache( $les_id );
					$updated++;
				}
			}
		}
	}

	if ( class_exists( 'LiteSpeed\Purge' ) ) {
		\LiteSpeed\Purge::purge_all();
	}
	if ( function_exists( 'wp_cache_flush' ) ) {
		wp_cache_flush();
	}

	return array( 'success' => true, 'updated_lessons' => $updated );
}

/**
 * REST Endpoint for triggering Cloudflare database sync:
 * POST/GET /wp-json/eta/v1/sync-cloudflare-videos?key=eta_cf_secure_sync_2026
 */
add_action( 'rest_api_init', function() {
	register_rest_route( 'eta/v1', '/sync-cloudflare-videos', array(
		'methods'             => array( 'GET', 'POST' ),
		'callback'            => function( $request ) {
			$key = $request->get_param( 'key' );
			if ( $key !== 'eta_cf_secure_sync_2026' ) {
				return new WP_REST_Response( array( 'error' => 'Unauthorized' ), 403 );
			}
			$res = eta_run_cloudflare_video_db_sync();
			return new WP_REST_Response( $res, 200 );
		},
		'permission_callback' => '__return_true',
	) );

	register_rest_route( 'eta/v1', '/audit-cloudflare-videos', array(
		'methods'             => array( 'GET' ),
		'callback'            => function( $request ) {
			$key = $request->get_param( 'key' );
			if ( $key !== 'eta_cf_secure_sync_2026' ) {
				return new WP_REST_Response( array( 'error' => 'Unauthorized' ), 403 );
			}
			$map_file = dirname( __FILE__ ) . '/cloudflare_video_map.json';
			if ( ! file_exists( $map_file ) ) {
				return new WP_REST_Response( array( 'error' => 'Map file not found' ), 404 );
			}
			$raw = json_decode( file_get_contents( $map_file ), true );
			$report = array();
			$non_external_count = 0;
			$total = 0;
			foreach ( $raw as $c ) {
				$course_title = isset( $c['title'] ) ? $c['title'] : ( isset( $c['course_title'] ) ? $c['course_title'] : '' );
				$course_id = isset( $c['course_id'] ) ? $c['course_id'] : 0;
				if ( isset( $c['videos'] ) && is_array( $c['videos'] ) ) {
					foreach ( $c['videos'] as $v ) {
						$les_id = (int) $v['lesson_id'];
						$total++;
						$src = get_post_meta( $les_id, '_video_source', true );
						$url = get_post_meta( $les_id, '_video_source_url', true );
						$r2_key = get_post_meta( $les_id, '_r2_video_key', true );
						$is_external = ( 'external' === $src );
						$is_cf = ( false !== strpos( $url, 'media.expressteck.workers.dev' ) );
						if ( ! $is_external || ! $is_cf ) {
							$non_external_count++;
						}
						$report[] = array(
							'course_id'    => $course_id,
							'course_title' => $course_title,
							'lesson_id'    => $les_id,
							'lesson_title' => $v['lesson_title'],
							'video_source' => $src,
							'is_external'  => $is_external,
							'is_cf_url'    => $is_cf,
							'r2_key'       => $r2_key,
						);
					}
				}
			}
			return new WP_REST_Response( array(
				'total_video_lessons' => $total,
				'all_external'        => ( 0 === $non_external_count ),
				'non_external_count'  => $non_external_count,
				'lessons'             => $report,
			), 200 );
		},
		'permission_callback' => '__return_true',
	) );
} );

