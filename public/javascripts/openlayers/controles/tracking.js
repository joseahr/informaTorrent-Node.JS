window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para obtener nuestra posición
 */
app.Tracking = function(opt_options) {

  var options = opt_options || {},
  show_position = false, // Bool - Activar/Desactivar control
  panTo = 0,
  this_ = this,
  geolocation = new ol.Geolocation({
	  projection: map.getView().getProjection()
  }), // Objeto geolocalizador
  positionFeature = new ol.Feature(), // Feature de posición
  accuracyFeature = new ol.Feature(), // Feature precisión
  featuresOverlay = new ol.layer.Vector({
    map: map,
    source: new ol.source.Vector({
      features: [accuracyFeature, positionFeature]
    })
  }), // Overlay que contiene los dos features creados: posición + precisión
  button = document.createElement('button'), // Botón del control
  element = document.createElement('div');

  this.desactivar = function(){
    $(button).empty();
    $(button).append('<i class="fa fa-eye" >');
    geolocation.setTracking(false);
    featuresOverlay.setVisible(false);
  };

  // Estilamos el feature
  positionFeature.setStyle(new ol.style.Style({
    image: new ol.style.Circle({
      radius: 6,
      fill: new ol.style.Fill({
        color: '#3399CC'
      }),
      stroke: new ol.style.Stroke({
        color: '#fff',
        width: 2
      })
    })
  }));

  // Eventos Geolocation ******************************************************
  geolocation.on('error', function(e){
    BootstrapDialog.show({
      title: 'Error tratando de geolocalizar tu dispositivo',
      message: 'Revise y active las opciones de geolocalización de su dispositivo'
    });
  });

  geolocation.on('change:accuracyGeometry', function() {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  }); // Manejador - Se dispara cuando cambia la precisión      
	  
  geolocation.on('change:position', function() {
    var coordinates = geolocation.getPosition();
    positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
    // Solo haremos pan una vez por activación de control. Pa que el usuario no se raye.
    // En cambio si que actualizamos la posición cuando tenga nuevas coords.
    if (panTo == 0){
      panTo ++;
      // Pan a mi localización
      var duration = 2000; // duración
      var start = +new Date(); // Comienzo
      
      var pan = ol.animation.pan({
        duration: duration,
        source: /** @type {ol.Coordinate} */ (map.getView().getCenter()),
        start: start
      }); // Animación pan
    
      var bounce = ol.animation.bounce({
        duration: duration,
        resolution: 4 * map.getView().getResolution(),
        start: start
      }); //Animación bounce
    
      map.beforeRender(pan, bounce); 
      map.getView().setCenter(coordinates);
      
    }
  });

  function show (){ // Manejador del control
	  // Cuando hacemos click sobre el control
      show_position = !show_position;
      //alert(show_position);
      
      if(show_position){
        $(button).empty();
        $(button).append('<i class="fa fa-eye-slash" >');
        panTo = 0;
        geolocation.setTracking(true);
        featuresOverlay.setVisible(true);
        map.getControls().forEach(function(c){
          if(c instanceof app.TrackingDenunciasCerca) c.desactivar();
        });
      }
      else {
        this_.desactivar();
      }
  }

  button.innerHTML = '<i class="fa fa-eye"></i>';
  button.addEventListener('click', show, false);

  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Geolocalización');
  element.setAttribute('data-content', 'Situarme mi posición en el mapa');
  element.className = 'show_position ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.Tracking, ol.control.Control);