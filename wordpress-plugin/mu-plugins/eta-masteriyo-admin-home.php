<?php
/**
 * Plugin Name: ETA LMS admin home fix
 * Description: Opening wp-admin/admin.php?page=masteriyo with no "#/..." page showed Masteriyo's 404 screen. Send it to the LMS Dashboard (#/analytics) instead.
 */

add_action( 'admin_head', function () {
	if ( ! isset( $_GET['page'] ) || 'masteriyo' !== $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification
		return;
	}
	?>
	<script>
	(function () {
		var h = window.location.hash;
		if (!h || h === '#' || h === '#/') {
			window.location.replace(window.location.href.split('#')[0] + '#/analytics');
		}
	})();
	</script>
	<?php
}, 1 );
