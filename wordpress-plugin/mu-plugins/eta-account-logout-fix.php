<?php
/**
 * Plugin Name: ETA account logout fix
 * Description: On phones and tablets (up to 1050px) the theme moves the student account
 * menu out of Masteriyo's React app to show it as a slide-in drawer. React then no longer
 * receives clicks there, and "Logout" (the only menu item without a real link) did nothing.
 * This sends that tap to the normal WordPress logout instead. On desktop, where the menu
 * stays inside the app, Masteriyo's own logout dialog is used as before.
 */

add_action( 'wp_footer', function () {
	if ( ! is_user_logged_in() ) {
		return;
	}
	// wp_logout_url() returns "&amp;" (for HTML); a script needs the plain URL.
	$logout_url = html_entity_decode( wp_logout_url( add_query_arg( array( 'auth' => 'login', 'logged_out' => '1' ), home_url( '/' ) ) ), ENT_QUOTES, 'UTF-8' );
	?>
	<script>
	(function () {
		var logoutUrl = <?php echo wp_json_encode( $logout_url ); ?>;
		document.addEventListener('click', function (e) {
			var link = e.target && e.target.closest ? e.target.closest('.mto-account-sidebar a, .masteriyo-sidebar-wrapper a') : null;
			if (!link || link.getAttribute('href')) return;
			if (!/^\s*log\s?out\s*$/i.test(link.textContent || '')) return;
			var app = document.getElementById('masteriyo-account-page');
			if (app && app.contains(link)) return; // Menu is inside the app: Masteriyo handles it.
			e.preventDefault();
			e.stopPropagation();
			if (window.confirm('Do you really want to log out?')) {
				window.location.href = logoutUrl;
			}
		}, true);
	})();
	</script>
	<?php
}, 99 );
