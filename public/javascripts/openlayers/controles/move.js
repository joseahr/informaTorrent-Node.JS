window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para moverse por el mapa (quitar controles de dibujar...)
 */
app.Move = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-hand-o-up"></i>';

  var this_ = this;
  
  function move_ (){
	  console.log();
      map.getControls().forEach(function (control) {
    	  //console.log(control, 'control', window.app.GetFeatureInfo(), 'gfi');
    	  if(control instanceof ((new app.Draw()).constructor)){
    		  control.removeDraw();
    		  control.removeModify();
    		  control.activar(false);
    	  }
      });
  }

  button.addEventListener('click', move_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Mover');
  element.setAttribute('data-content', 'Desplazarse por el mapa');
  element.className = 'move ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.Move, ol.control.Control);
