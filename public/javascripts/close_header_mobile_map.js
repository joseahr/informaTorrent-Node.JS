$('body').addClass('fixed-header-on');

var supported = !( navigator.userAgent.match(/Android/i)
		 || navigator.userAgent.match(/webOS/i)
		 || navigator.userAgent.match(/iPhone/i)
		 || navigator.userAgent.match(/iPad/i)
		 || navigator.userAgent.match(/iPod/i)
		 || navigator.userAgent.match(/BlackBerry/i)
		 || navigator.userAgent.match(/Windows Phone/i)
		 );

if(!supported){
	$('header').fadeOut(); // Ismobile?
}

$('#show_menu').click(function(event){
	console.log('ee');
	if ($('header').hasClass('fadeOutLeft')){
		if(!supported){
			$('header').stop(true, true).fadeIn(); // Is mobile? Animaciones no funcionan en móviles
		}
		$(this).removeClass('btn-default');
		$(this).addClass('btn-danger');
		$(this).empty();
		$(this).append('<i class="fa fa-close"></i>');
		$('header').removeClass('fixed-header-on');
		$('header').removeClass('fadeOutLeft');
	} else {
		if(!supported){
			$('header').stop(true, true).fadeOut(); // Is mobile?
		}
		$(this).removeClass('btn-danger');
		$(this).addClass('btn-default');
		$(this).empty();
		$(this).append('<i class="fa fa-navicon" style="color: #fff"></i>');
		$('header').addClass('fadeOutLeft');
	}

});