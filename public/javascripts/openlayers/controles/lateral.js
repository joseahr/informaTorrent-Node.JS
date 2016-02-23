window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para mostrar el panel lateral (Editar, Nueva)
 */
app.Lateral = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-list-alt"></i>';
  
  var this_ = this;
  
  var aux = 0;
  
  function lateral_ (){
	  
	$('.btn-map').css('z-index', '0');
	$('.cd-panel-container').css('z-index','6');
	$('.cd-panel-header').css('display', 'block');
	$('.cd-panel-header').css('z-index','7');
	$('.cd-panel').addClass('is-visible');
	
	if ($('header').css('display') == 'block'){
		$('header').css('display', 'none');
		$('#show_menu').removeClass('btn-danger');
		$('#show_menu').addClass('btn-default');
		$('#show_menu').empty();
		$('#show_menu').append('<i class="fa fa-navicon" style="color: #fff"></i>');
		$('header').addClass('fadeOutLeft');
	}

	if (aux == 0) {
		iniciarEditor();
		iniciarTags();
		aux++;
	}
  }

  button.addEventListener('click', lateral_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Datos');
  element.setAttribute('data-content', 'Rellena o modifica los datos de la denuncia');
  element.className = 'lateral ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.Lateral, ol.control.Control);