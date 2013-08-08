;(function($){

	// prevent errors while logging to browsers that support it
	if ( ! window.console )
		window.console = { log: function(){ } };

	$( document ).on( 'click', '.face-detection-activate', function(e) {
		e.preventDefault();

		var $statusbox = $( this ).next(),
			$foundbox = $statusbox.next(),
			attachment_id = $( this ).data( 'attachment-id' );

		// update status - loading full image
		$statusbox.css( {
			marginLeft: '5px',
			paddingLeft: '20px',
			background: 'url(/wp-admin/images/wpspin_light.gif) no-repeat left center',
			backgroundSize: 'contain'
		} ).html( 'Loading full image' );

		// request full image
		$.post( facedetection.ajax_url, {
			action: 'facedetect_get_image',
			fd_get_image_nonce: facedetection.get_image_nonce,
			attachment_id: attachment_id
		}, function( rsp ) {
			if ( rsp && rsp.img ) {
				var image = new Image();
				image.src = rsp.img[ 0 ];

				console.log( rsp, image );

				$( image )
					.attr( 'id', 'facedetect-image' )
					.css( { position: 'absolute', top: '-9999px', left: '-9999px' } )
					.appendTo( 'body' )
					.load( function() {

						// update status - finding faces
						$statusbox.html( 'Looking for faces' );

						// face detection
						$( '#facedetect-image' ).faceDetection( {
							confidence: 0,
							start: function( img ) {
								$statusbox.html( 'Looking for faces' );
							}, // doesn't work yet
							complete: function( img, faces ) {
								// update status - found faces
								console.log( 'img:', img, 'faces:', faces );

								if ( ! faces.length ) {
									console.log( 'no faces...' );
									$statusbox.css( {
										paddingLeft: 0,
										background: 'none'
									} ).html( 'No faces found' );
									return;
								}

								$statusbox.html( 'Found ' + faces.length + ' faces, re-cropping thumbnails' );

								$.each( faces, function( i, item ) {
									console.log( img, item );
									Pixastic.process( image, 'crop', {
										rect: {
											left: item.x,
											top: item.y,
											width: item.width,
											height: item.height
										}
									}, function( face ) {
										console.log( face );
										$( face )
											.removeAttr( 'id' )
											.css( {
												position: 'static',
												width: 40,
												height: 'auto',
												margin: '10px 10px 0 0',
												display: 'inline-block'
											} )
											.appendTo( $foundbox );
									} );
								} );

								// save data & regen
								$.post( facedetection.ajax_url, {
									action: 'facedetect_save_faces',
									fd_save_faces_nonce: facedetection.save_faces_nonce,
									attachment_id: attachment_id,
									faces: faces
								}, function( rsp ) {
									if ( rsp && rsp.resized ) {
										// update status - thumbs regenerated
										console.log( '', rsp.resized );
										$statusbox.css( {
											paddingLeft: 0,
											background: 'none'
										} ).html( 'Thumbnails re-cropped' );

									} else {
										console.log( 'no regenerated thumbs', rsp );
										$statusbox.css( {
											paddingLeft: 0,
											background: 'none'
										} ).html( 'No thumbnails were re-cropped' );
									}
								}, 'json' );

								// cleanup
								$( '#facedetect-image' ).remove();
							},
							error: function( img, code, message  ) {
								// update status - error, message
								console.log( 'error', message );
								$statusbox.css( {
									paddingLeft: 0,
									background: 'none'
								} ).html( 'Error (' + code + '): ' + message );

								// cleanup
								$( '#facedetect-image' ).remove();
							}
						} );

					} );


			} else {
				console.log( 'No image url found' );
			}
		}, 'json' );

	} );

})(jQuery);