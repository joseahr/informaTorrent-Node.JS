window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para obtener nuestra posición
 */
app.TrackingDenunciasCerca = function(opt_options) {

  var options = opt_options || {},
  message, // mensaje con las denuncias cerca
  coordinates, // ultimas coordenadas conocidas
  btn_abrir = document.createElement('button'), 
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
  dialog_td = new BootstrapDialog({
    title : 'Denuncias cercanas a mi posición',
    autodestroy : false,
    onshow : function(dialog){
        dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
          '<div class="bootstrap-dialog-close-button">' + 
            '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
          '</div>' +
          '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
          '<i class="fa fa-globe" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
            '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> Denuncias cercanas a mi posición</h4>' +
          '</div>' +
        '</div>'));
        dialog.getModalDialog().find('.close').click(function(){dialog.close()});
        dialog.getModalBody().parent().css('border-radius', '15px');
        dialog.getModalBody().css('padding-top', '10px');
    },
    buttons : [{
      label : 'Cerrar',
      action : function(dialog){
        dialog.close();
      },
    }]
  }),
  coor_ant,
  distancia = 100,
  projection = map.getView().getProjection(),
  button = document.createElement('button'), // Botón del control
  element_abrir = document.createElement('div'),
  element = document.createElement('div');

  this.desactivar = function(){
    $(element_abrir).hide();
    $(button).empty();
    $(button).append('<i class="fa fa-globe" style="color: #fff"></i>');
    geolocation.setTracking(false);
    featuresOverlay.setVisible(false);
    coor_ant = false;
    clearDenunciasCerca();
  };

  function clearDenunciasCerca (){
    clusterSource.getSource().getFeatures().forEach(function(f){
      if(f.attributes.marker_type == 'cerca'){
        console.log(f.attributes.denuncia.gid);
        delete features_cache[f.attributes.denuncia.gid];
        clusterSource.getSource().removeFeature(f);
      }
    });
  }

  // Eventos Geolocation ******************************************************
  geolocation.on('error', function(e){
    this_.desactivar();
    BootstrapDialog.show({
      title: 'Error tratando de geolocalizar tu dispositivo',
      message: 'Revise y active las opciones de geolocalización de su dispositivo',
      onshow : function(dialog){$(dialog.getModalHeader()).css('background', 'rgb(200,50,50)')}
    });
  });

  geolocation.on('change:accuracyGeometry', function() {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  }); // Manejador - Se dispara cuando cambia la precisión

  geolocation.on('change:position', function() {
    coordinates = geolocation.getPosition();
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
      distancia = 0;
    }


    // Solo haremos pan una vez por activación de control. Pa que el usuario no se raye.
    // En cambio sí que actualizamos la posición cuando tenga nuevas coords.
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
  num_denuncias_io.on('si_que_tengo_denuncias_cerca', function(data){
    clearDenunciasCerca();
    message = '';
    /* Mostrar las denuncias */
    console.log(data);
    if(!data || data == '') return;
    message = '<div class="col-lg-12 text-center" style="color: #fff; background-color: #ffbb00; border-radius : 10px; font-weight : bold; margin-bottom : 10px;">' + 
                  '<i class="fa fa-location-arrow"></i> ' + ol.coordinate.toStringHDMS(coordinates, 2) + '</div><div class="col-lg-12 text-center">';
    data.forEach(function(denuncia){
      denuncia.tipo = denuncia.geometria.type;
      denuncia.coordenadas = denuncia.geometria.coordinates;
      var distancia = denuncia.distancia_punto || denuncia.distancia_linea || denuncia.distancia_poligono;
      //alert('denuncia ' + denuncia.tipo + ' ' + denuncia.coordenadas);
      message += '<div class="col-lg-12 text-center" style="color: #fff; background-color: #00bbff; border-radius : 10px; font-weight : bold;">Distancia : ' + distancia.toFixed(3) + ' m</div>' + 
        getDenunciaRow(denuncia, true) + '<div class="col-lg-12 space"></div>';

      var feature, 
      feature_marker,
      type = denuncia.geometria.type, 
      coordinates = denuncia.geometria.coordinates;
      
      if(type == 'Point'){
          feature = new ol.Feature({
              geometry: new ol.geom.Point(coordinates),
              name: 'Denuncia - Punto'
          });
          
        }
        else if(type == 'LineString'){
          feature = new ol.Feature({
            geometry: new ol.geom.LineString(coordinates),
            name: 'Denuncia - Polígono'
          });
        }
        else if(type == 'Polygon'){
          feature = new ol.Feature({
            geometry: new ol.geom.Polygon(coordinates),
            name: 'Denuncia - Polígono'
          });
        }

        feature_marker = new ol.Feature({
          geometry : new ol.geom.Point(ol.extent.getCenter(feature.getGeometry().getExtent())),
          name : 'Denuncia Marker'
        });

        feature.attributes = {
          type : 'denuncia',
          from : 'query',
          denuncia: denuncia
        };
        feature_marker.attributes = {
          type : 'marker',
          marker_type : 'cerca',
          denuncia: denuncia
        };

        if(!features_cache[denuncia.gid]){
          features_cache[denuncia.gid] = feature;
          clusterSource.getSource().addFeature(feature_marker);
        }


    });
    message += '</div>';
    dialog_td.setMessage(message);
    $(btn_abrir).find('i').empty().append('<span style="background-color: #cc0000; font-size: 0.6em" class="badge">' + data.length + '</span>');
    //dialog_td.open();
  });   

  button.innerHTML = '<i class="fa fa-globe" style="color: #fff"></i>';
  
  function show (){ // Manejador del control
	  // Cuando hacemos click sobre el control
      show_position = !show_position;
      //alert(show_position);
      
      if(show_position){
        positionFeature.setStyle(styles_markers['posicion']);
        $(button).empty();
        $(button).append('<i class="fa fa-globe" style="color: #60b644"></i>');
        panTo = 0;
        geolocation.setTracking(true);
        featuresOverlay.setVisible(true);
        $(element_abrir).show();
        map.getControls().forEach(function(c){
          if(c instanceof app.Tracking) c.desactivar();
        });

        distancia = 100;
        coor_ant = null;
        message = '';

      }
      else {
        this_.desactivar();
      }
  }

  $('<i class="fa fa-bullhorn"></i>').appendTo($(btn_abrir));

  button.addEventListener('click', show, false);
  btn_abrir.addEventListener('click', function(){
    dialog_td.open();
  }, false);

  element_abrir.setAttribute('data-toggle', 'left');
  element_abrir.setAttribute('title', 'Denuncias cercanas');
  element_abrir.setAttribute('data-content', 'Denuncias cercanas a mi posición');
  element_abrir.className = 'denuncias_cerca_track_abrir ol-unselectable ol-control';
  element_abrir.appendChild(btn_abrir);
  $(element_abrir).hide();

  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Denuncias cercanas tiempo real');
  element.setAttribute('data-content', 'Denuncias cercanas a mi posición');
  element.className = 'denuncias_cerca_track ol-unselectable ol-control';
  element.appendChild(button);
  $(element_abrir).appendTo($('#map'));

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.TrackingDenunciasCerca, ol.control.Control);