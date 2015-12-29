$('.cd-panel').on('click', function(event){
	if( $(event.target).is('.cd-panel') || $(event.target).is('.cd-panel-close') ) {

		var panel = $(this).attr('id');
		$('#' + panel).removeClass('is-visible');
		$('#' + panel + ' > .cd-panel-container').css('z-index','0');
		$('#' + panel + ' > .cd-panel-header').css('z-index','0');
		$('.btn-map').css('z-index', '2');
		event.preventDefault();
	}
});