window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para abrir el panel lateral comentarios denuncia
 */
app.ComentariosDenuncia = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-comments"></i>';

  var this_ = this;
  
  function comentarios_ (){
	  
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
	  
	  var panel = 'comentarios';
	  
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
  }

  button.addEventListener('click', comentarios_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Comentarios');
  element.setAttribute('data-content', 'Añadir/Ver comentarios');
  element.className = 'comentarios_denuncia ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.ComentariosDenuncia, ol.control.Control);