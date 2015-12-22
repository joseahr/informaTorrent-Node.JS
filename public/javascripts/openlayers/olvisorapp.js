console.log(denuncias + ' denuncias' + typeof(denuncias) );
denuncias.forEach(function(denuncia){
	console.log('denuncia añadida bdd' + JSON.parse(denuncia.geom).type);
	var feature, type = JSON.parse(denuncia.geom).type;
	
	if(type == 'Point'){
    	feature = new ol.Feature({
    		  geometry: new ol.geom.Point(JSON.parse(denuncia.geom).coordinates),
    		  name: 'Denuncia - Punto'
    	});
    }
    else if(type == 'LineString'){
    	feature = new ol.Feature({
    		geometry: new ol.geom.LineString(JSON.parse(denuncia.geom).coordinates),
    		name: 'Denuncia - Polígono'
    	});
    }
    else if(type == 'Polygon'){
    	feature = new ol.Feature({
    		geometry: new ol.geom.Polygon(JSON.parse(denuncia.geom).coordinates),
    		name: 'Denuncia - Polígono'
    	});
    }
	console.log(feature);
	vector.getSource().addFeature(feature);
});

map.addLayer(vector);

var select = new ol.interaction.Select();

map.addInteraction(select); // Seleccionar feature

/*
 * Animación geometría añadida
 */
var duration = 6000;

function flash(feature) {
	  var start = new Date().getTime();
	  var listenerKey;

	  function animate(event) {
	    var vectorContext = event.vectorContext;
	    var frameState = event.frameState;
	    var flashGeom = new ol.geom.Point(ol.extent.getCenter(feature.getGeometry().getExtent()));
	    var elapsed = frameState.time - start;
	    var elapsedRatio = elapsed / duration;
	    // radius will be 5 at start and 30 at end.
	    var radius = ol.easing.easeOut(elapsedRatio) * 50 + 5;
	    var opacity = ol.easing.easeOut(1 - elapsedRatio);

	    var flashStyle = new ol.style.Circle({
	      radius: radius,
	      snapToPixel: false,
	      stroke: new ol.style.Stroke({
	        color: 'rgba(255, 0, 0, ' + opacity + ')',
	        width: 1
	      })
	    });

	    vectorContext.setImageStyle(flashStyle);
	    vectorContext.drawPointGeometry(flashGeom, null);
	    if (elapsed > duration) {
	      ol.Observable.unByKey(listenerKey);
	      return;
	    }
	    // tell OL3 to continue postcompose animation
	    frameState.animate = true;
	  }
	  listenerKey = map.on('postcompose', animate);
	}

	vector.getSource().on('addfeature', function(e) {
	  flash(e.feature);
	});