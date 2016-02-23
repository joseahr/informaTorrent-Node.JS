window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para abrir el panel lateral info denuncia
 */
app.InfoDenuncia = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-list-alt"></i>';

  var this_ = this;
  
  function info_ (){
	  
	  var panel = 'contenido';
	  
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

  button.addEventListener('click', info_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Contenido');
  element.setAttribute('data-content', 'Título y descripción de la denuncia');
  element.className = 'info_denuncia ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.InfoDenuncia, ol.control.Control);