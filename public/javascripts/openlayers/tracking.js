  // GEOLOCACLIZACIÓN
  
  var geolocation = new ol.Geolocation({
    projection: map.getView().getProjection()
  });
  
  var accuracyFeature = new ol.Feature();
  
  geolocation.on('change:accuracyGeometry', function() {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  });
  
  var positionFeature = new ol.Feature();
  
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
  
  var panTo = 0;
  geolocation.on('change:position', function() {
    var coordinates = geolocation.getPosition();
    positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
    if (panTo == 0){
      panTo ++;
      // Pan a mi localización
      var duration = 2000;
      var start = +new Date();
    
      var pan = ol.animation.pan({
        duration: duration,
        source: /** @type {ol.Coordinate} */ (map.getView().getCenter()),
        start: start
      });
    
      var bounce = ol.animation.bounce({
        duration: duration,
        resolution: 4 * map.getView().getResolution(),
        start: start
      });
    
      map.beforeRender(pan, bounce);
      map.getView().setCenter(coordinates);
      
    }
  });
  
  var featuresOverlay = new ol.layer.Vector({
    map: map,
    source: new ol.source.Vector({
      features: [accuracyFeature, positionFeature]
    })
  });
  
  var show_position = false;
  
  map.addControl(new app.Tracking());