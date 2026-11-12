<?php
/**
 * Plugin Name: ETA Course Content API Compatibility
 * Description: Completes mobile course API lesson media and assessment data.
 * Version: 1.0.0
 * Author: Express Tech Academy
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'eta_course_content_api_video_map' ) ) {
	function eta_course_content_api_video_map() {
		static $video_map = null;
		if ( null !== $video_map ) {
			return $video_map;
		}

		$video_map = array();
		$map_file = WP_PLUGIN_DIR . '/eta-app-api/cloudflare_video_map.json';
		if ( ! file_exists( $map_file ) ) {
			return $video_map;
		}

		$raw_map = json_decode( file_get_contents( $map_file ), true );
		if ( ! is_array( $raw_map ) ) {
			return $video_map;
		}

		foreach ( $raw_map as $course ) {
			if ( empty( $course['videos'] ) || ! is_array( $course['videos'] ) ) {
				continue;
			}
			foreach ( $course['videos'] as $video ) {
				if ( isset( $video['lesson_id'] ) ) {
					$video_map[ (int) $video['lesson_id'] ] = $video;
				}
			}
		}

		return $video_map;
	}
}

if ( ! function_exists( 'eta_course_content_api_video_url' ) ) {
	function eta_course_content_api_video_url( $lesson_id ) {
		if ( function_exists( 'eta_get_lesson_secure_video_url' ) ) {
			$video_url = eta_get_lesson_secure_video_url( $lesson_id );
			if ( is_string( $video_url ) && '' !== trim( $video_url ) ) {
				return $video_url;
			}
		}

		$video_map = eta_course_content_api_video_map();
		$mapped_video = isset( $video_map[ (int) $lesson_id ] ) ? $video_map[ (int) $lesson_id ] : array();
		$r2_key = get_post_meta( $lesson_id, '_r2_video_key', true );
		if ( empty( $r2_key ) && ! empty( $mapped_video['r2_key'] ) ) {
			$r2_key = $mapped_video['r2_key'];
		}

		if ( ! empty( $r2_key ) && function_exists( 'eta_generate_secure_video_url' ) ) {
			$video_url = eta_generate_secure_video_url( $r2_key );
			if ( is_string( $video_url ) && '' !== trim( $video_url ) ) {
				return $video_url;
			}
		}

		$video_url = get_post_meta( $lesson_id, '_video_source_url', true );
		if ( empty( $video_url ) && ! empty( $mapped_video['source_url'] ) ) {
			$video_url = $mapped_video['source_url'];
		}
		if ( ! is_string( $video_url ) || '' === trim( $video_url ) ) {
			return '';
		}

		if (
			function_exists( 'eta_generate_secure_video_url' ) &&
			( false !== strpos( $video_url, 'media.expressteck.workers.dev' ) || 0 === strpos( $video_url, 'courses/' ) )
		) {
			return eta_generate_secure_video_url( $video_url );
		}

		return $video_url;
	}
}

if ( ! function_exists( 'eta_course_content_api_quiz_data' ) ) {
	function eta_course_content_api_quiz_data( $quiz_id ) {
		$question_posts = get_posts( array(
			'post_type'      => 'mto-question',
			'post_parent'    => (int) $quiz_id,
			'posts_per_page' => -1,
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
			'post_status'    => 'publish',
		) );

		$questions = array();
		foreach ( $question_posts as $question_post ) {
			$choices = json_decode( $question_post->post_content, true );
			if ( ! is_array( $choices ) ) {
				$choices = get_post_meta( $question_post->ID, '_answers', true );
				if ( is_string( $choices ) ) {
					$choices = json_decode( $choices, true );
				}
			}
			if ( ! is_array( $choices ) ) {
				continue;
			}

			$options = array();
			$answer = null;
			foreach ( $choices as $choice ) {
				if ( ! is_array( $choice ) || ! isset( $choice['name'] ) ) {
					continue;
				}
				$options[] = wp_strip_all_tags( (string) $choice['name'] );
				if ( null === $answer && isset( $choice['correct'] ) && filter_var( $choice['correct'], FILTER_VALIDATE_BOOLEAN ) ) {
					$answer = count( $options ) - 1;
				}
			}

			$question_title = html_entity_decode( wp_strip_all_tags( $question_post->post_title ), ENT_QUOTES, 'UTF-8' );
			if ( '' === trim( $question_title ) || count( $options ) < 2 || null === $answer ) {
				continue;
			}

			$question = array(
				'q'       => $question_title,
				'options' => $options,
				'answer'  => $answer,
			);
			$explanation = get_post_meta( $question_post->ID, '_answer_explanation', true );
			if ( ! empty( $explanation ) ) {
				$question['explanation'] = html_entity_decode( wp_strip_all_tags( $explanation ), ENT_QUOTES, 'UTF-8' );
			}
			$questions[] = $question;
		}

		if ( empty( $questions ) ) {
			return null;
		}

		$passing_score = (int) get_post_meta( $quiz_id, '_pass_mark', true );
		if ( $passing_score <= 0 ) {
			$passing_score = 70;
		}

		return array(
			'passingScore' => min( 100, $passing_score ),
			'questions'    => $questions,
		);
	}
}

if ( ! function_exists( 'eta_course_content_api_assignment_data' ) ) {
	function eta_course_content_api_assignment_data( $assignment_id ) {
		$assignment = get_post( $assignment_id );
		if ( ! $assignment ) {
			return null;
		}

		$description = strip_shortcodes( $assignment->post_content );
		$description = preg_replace( '/<li\b[^>]*>/i', '- ', $description );
		$description = preg_replace( '/<br\s*\/?>|<\/(?:p|div|h[1-6]|li|tr)>/i', "\n", $description );
		$description = html_entity_decode( wp_strip_all_tags( $description ), ENT_QUOTES, 'UTF-8' );
		$description = preg_replace( "/[ \t]*\r?\n[ \t]*/", "\n", $description );
		$description = trim( preg_replace( "/\n{3,}/", "\n\n", $description ) );

		$data = array(
			'title'       => html_entity_decode( $assignment->post_title, ENT_QUOTES, 'UTF-8' ),
			'description' => $description,
		);
		$total_points = (int) get_post_meta( $assignment_id, '_total_points', true );
		$pass_points = (int) get_post_meta( $assignment_id, '_pass_points', true );
		if ( $total_points > 0 ) {
			$data['totalPoints'] = $total_points;
		}
		if ( $pass_points > 0 ) {
			$data['passPoints'] = $pass_points;
		}

		return $data;
	}
}

if ( ! function_exists( 'eta_course_content_api_enrich_modules' ) ) {
	function eta_course_content_api_enrich_modules( &$modules ) {
		if ( ! is_array( $modules ) ) {
			return;
		}

		foreach ( $modules as &$module ) {
			if ( ! is_array( $module ) || empty( $module['lessons'] ) || ! is_array( $module['lessons'] ) ) {
				continue;
			}

			foreach ( $module['lessons'] as &$lesson ) {
				if ( ! is_array( $lesson ) || empty( $lesson['id'] ) ) {
					continue;
				}

				$lesson_id = (int) $lesson['id'];
				$type = isset( $lesson['type'] ) ? $lesson['type'] : 'video';
				if ( 'video' === $type && empty( $lesson['videoUrl'] ) ) {
					$lesson['videoUrl'] = eta_course_content_api_video_url( $lesson_id );
				} elseif ( 'quiz' === $type && empty( $lesson['quizData'] ) ) {
					$quiz_data = eta_course_content_api_quiz_data( $lesson_id );
					if ( null !== $quiz_data ) {
						$lesson['quizData'] = $quiz_data;
					}
				} elseif ( 'assignment' === $type && empty( $lesson['assignmentData'] ) ) {
					$assignment_data = eta_course_content_api_assignment_data( $lesson_id );
					if ( null !== $assignment_data ) {
						$lesson['assignmentData'] = $assignment_data;
					}
				}

				if ( 'quiz' === $type && ! empty( $lesson['duration'] ) && preg_match( '/^(\d+)m$/', $lesson['duration'], $matches ) && (int) $matches[1] >= 60 ) {
					$lesson['duration'] = (int) ceil( (int) $matches[1] / 60 ) . 'm';
				}
			}
			unset( $lesson );
		}
		unset( $module );
	}
}

if ( ! function_exists( 'eta_course_content_api_enrich_payload' ) ) {
	function eta_course_content_api_enrich_payload( &$payload ) {
		if ( ! is_array( $payload ) ) {
			return;
		}

		if ( isset( $payload['modules'] ) && is_array( $payload['modules'] ) ) {
			eta_course_content_api_enrich_modules( $payload['modules'] );
			return;
		}

		foreach ( $payload as &$item ) {
			if ( is_array( $item ) ) {
				eta_course_content_api_enrich_payload( $item );
			}
		}
		unset( $item );
	}
}

if ( ! function_exists( 'eta_course_content_api_filter_rest_response' ) ) {
	function eta_course_content_api_filter_rest_response( $response, $server, $request ) {
		if ( ! is_object( $request ) || ! method_exists( $request, 'get_route' ) ) {
			return $response;
		}

		$route = trim( $request->get_route(), '/' );
		if ( ! in_array( $route, array( 'eta/v1/courses', 'eta/v1/course-curriculum', 'eta/v1/course-details', 'eta/v1/my-courses' ), true ) ) {
			return $response;
		}

		if ( is_a( $response, 'WP_REST_Response' ) ) {
			$payload = $response->get_data();
			eta_course_content_api_enrich_payload( $payload );
			$response->set_data( $payload );
		}

		return $response;
	}
}

add_filter( 'rest_post_dispatch', 'eta_course_content_api_filter_rest_response', 99, 3 );
