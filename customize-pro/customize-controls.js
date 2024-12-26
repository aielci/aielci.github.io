( function( api ) {
	// Extends our custom "legal-adviser-lite" section.
	api.sectionConstructor['legal-adviser-lite'] = api.Section.extend( {
		// No events for this type of section.
		attachEvents: function () {},
		// Always make the section active.
		isContextuallyActive: function () {
			return true;
		}
	} );
} )( wp.customize );