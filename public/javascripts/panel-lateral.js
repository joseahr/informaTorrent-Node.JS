$('.cd-btn').on('click', function(event){
	
	var panel = $(this).attr('panel-open');
		
	if(panel == 'comentarios'){
		tinymce.init({
			selector: 'textarea',
			plugins: ['advlist autolink link lists charmap print preview hr anchor pagebreak',
			'searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking',
			'save table contextmenu directionality emoticons template paste textcolor'],
			theme: 'modern',
			language_url: '/langs/es.js',
			min_width: 300,
			resize: false
		});	
	}
	
	if(panel == 'imagenes'){
	    $('.carousel').carousel({
	        interval: false
	    });
	}
	
	$('.btn-map').css('z-index', '0');
	$('#' + panel + ' > .cd-panel-container').css('z-index','5');
	$('#' + panel + ' > .cd-panel-header').css('display', 'block');
	$('#' + panel + ' > .cd-panel-header').css('z-index','6');
	$('#' + panel).addClass('is-visible');
	
	if ($('header').css('display') == 'block'){
		$('header').css('display', 'none');
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

		var panel = $(this).attr('id');
		$('#' + panel).removeClass('is-visible');
		$('#' + panel + ' > .cd-panel-container').css('z-index','0');
		$('#' + panel + ' > .cd-panel-header').css('z-index','0');
		$('.btn-map').css('z-index', '2');
		event.preventDefault();
	}
});