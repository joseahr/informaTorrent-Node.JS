window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para filtrar cartografía por sus atributos
 */
app.Layers = function(opt_options) {

	var options = opt_options || {};


  	function layers_ (){
  		$('[data-target=".sidebar-right"]').click();
  	}

  	button = document.createElement('button'),
	button.innerHTML = '<img src="/files/images/layers.svg"></img>';
  	button.addEventListener('click', layers_, false);

	var element = document.createElement('div');
  	element.setAttribute('data-toggle', 'left');
  	element.setAttribute('title', 'Capas y Leyenda');
  	element.setAttribute('data-content', 'Control de capas donde podrás ver la leyenda de cada capa');
  	element.className = 'layers_ ol-unselectable ol-control';
  	element.appendChild(button);

  	ol.control.Control.call(this, {
    	element: element,
    	target: options.target
  	});
};

ol.inherits(app.Layers, ol.control.Control);