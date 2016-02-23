window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para cerrar menú header
 */
app.CloseHeader = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.setAttribute('id', 'show_menu');
  button.innerHTML = '<i class="fa fa-navicon"></i>';
  
  var this_ = this;
  
  var aux = 0;
  
  function closeHeader_ (){
	if ($('header').hasClass('fadeOutLeft')){
		$('header').removeClass('fadeOutLeft');
		$('header').stop(true, true).slideDown();
		
		$(button).empty();
		$(button).append('<i class="fa fa-close" style="color: rgb(255, 50, 0)"></i>');
	} else {
		$('header').addClass('fadeOutLeft');
		$('header').stop(true, true).slideUp();

		$(button).empty();
		$(button).append('<i class="fa fa-navicon" style="color: #fff"></i>');
	}	  
  }

  button.addEventListener('click', closeHeader_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Cerrar Menú');
  element.setAttribute('data-content', 'Abrir/Cerrar el menú superior');
  element.className = 'close_header ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.CloseHeader, ol.control.Control);
map.addControl(new app.CloseHeader);
