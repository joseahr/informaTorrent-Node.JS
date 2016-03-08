window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para obtener nuestra posición
 */
app.TrackingDenunciasCerca = function(opt_options) {

  var options = opt_options || {},
  show_position = false, // Bool - Activar/Desactivar control
  this_ = this,
  panTo = 0,
  wktFormat = new ol.format.WKT(),
  geolocation = new ol.Geolocation({
	    projection: map.getView().getProjection()
  }), // Objeto geolocalizador
  accuracyFeature = new ol.Feature(), // Feature precisión
  positionFeature = new ol.Feature(), // Feature de posición
  featuresOverlay = new ol.layer.Vector({
    map: map,
    source: new ol.source.Vector({
      features: [accuracyFeature, positionFeature]
    })
  }), // Overlay que contiene los dos features creados: posición + precisión
  dialog = new BootstrapDialog({
    title : 'Denuncias cercanas a mi posición'
  }),
  coor_ant,
  distancia = 100,
  projection = map.getView().getProjection(),
  button = document.createElement('button'), // Botón del control
  element = document.createElement('div');

  this.desactivar = function(){
    $(button).empty();
    $(button).append('<i class="fa fa-globe" style="color: #fff"></i>');
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

    if(coor_ant){
      var line = new ol.geom.LineString([coordinates, coor_ant]);

      var coordinates_ = line.getCoordinates();
      distancia = 0;
      for (var i = 0, ii = coordinates_.length - 1; i < ii; ++i) {
        var c1 = ol.proj.transform(coordinates_[i], projection, 'EPSG:4326');
        var c2 = ol.proj.transform(coordinates_[i + 1], projection, 'EPSG:4326');
        distancia += new ol.Sphere(6378137).haversineDistance(c1, c2);
      }

    }
    positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
    console.log('distancia', distancia, 'actual', coordinates, 'anterior', coor_ant);

    //alert(distancia);
    if(distancia > 20){
      console.log('distancia recorrida respecto a la ultima rev 20 metros');
      coor_ant = positionFeature.getGeometry().getCoordinates();
      // Enviamos a traves de socket io nuestra posición al servidor
      //alert(wktFormat.writeFeature(accuracyFeature.clone()));
      num_denuncias_io.emit('tengo_denuncias_cerca_?', wktFormat.writeFeature(positionFeature.clone()));
    }

    num_denuncias_io.on('si_que_tengo_denuncias_cerca', function(data){
      /* Mostrar las denuncias */
      //console.log(data);
      if(!data || data == '') return;
      var message = '<div style="text-align: center">' + 
                    '<p> Posición actual : ' + ol.coordinate.toStringHDMS(coordinates, 2) + '</p>';
      data.forEach(function(denuncia){
        denuncia.tipo = JSON.parse(denuncia.geometria).type;
        denuncia.coordenadas = JSON.parse(denuncia.geometria).coordinates;
        //alert('denuncia ' + denuncia.tipo + ' ' + denuncia.coordenadas);
        message += getDenunciaRow(denuncia, true);
      });
      message += '</div>'
      dialog.setMessage(message);
      dialog.open();
    });

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
  
  // Eventos Geolocation ******************************************************     

  button.innerHTML = '<i class="fa fa-globe" style="color: #fff"></i>';
  
  function show (){ // Manejador del control
	  // Cuando hacemos click sobre el control
      show_position = !show_position;
      //alert(show_position);
      
      if(show_position){
        $(button).empty();
        $(button).append('<i class="fa fa-globe" style="color: #60b644"></i>');
        panTo = 0;
        geolocation.setTracking(true);
        featuresOverlay.setVisible(true);
        map.getControls().forEach(function(c){
          if(c instanceof app.Tracking) c.desactivar();
        });
      }
      else {
        this_.desactivar();
      }
  }

  button.addEventListener('click', show, false);

  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Denuncias cercanas tiempo real');
  element.setAttribute('data-content', 'Denuncias cercanas a mi posición');
  element.className = 'denuncias_cerca_track ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.TrackingDenunciasCerca, ol.control.Control);