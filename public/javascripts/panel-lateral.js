jQuery(document).ready(function($){
	//open the lateral panel
	$('.cd-btn').on('click', function(event){
		event.preventDefault();
		$('.cd-panel').css('z-index','4');
		$('.cd-panel').addClass('is-visible');
		if ($('header').hasClass('fadeOutLeft') == false){
			if(!supported){
				$('header').stop(true, true).fadeOut(); // Is mobile?
			}
			$('#show_menu').removeClass('btn-danger');
			$('#show_menu').addClass('btn-default');
			$('#show_menu').empty();
			$('#show_menu').append('<i class="fa fa-navicon" style="color: #fff"></i>');
			$('header').addClass('fadeOutLeft');
		}
	});
	//clode the lateral panel
	$('.cd-panel').on('click', function(event){
		if( $(event.target).is('.cd-panel') || $(event.target).is('.cd-panel-close') ) { 
			$('.cd-panel').removeClass('is-visible');
			event.preventDefault();
		}
	});
});