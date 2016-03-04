/**
 * Elements that make up the popup.
 */
var container = document.getElementById('popup-visor');
var content = document.getElementById('popup-visor-content');
var closer = document.getElementById('popup-visor-closer');

var seleccionada = '';

/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function() {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};


/**
 * Create an overlay to anchor the popup to the map.
 */
var overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
  element: container,
  autoPan: false
}));


console.log(denuncias + ' denuncias' + typeof(denuncias) );
denuncias.forEach(function(denuncia){
	console.log('denuncia añadida bdd' + JSON.parse(denuncia.geometria).type);
	var feature, type = JSON.parse(denuncia.geometria).type, coordinates = JSON.parse(denuncia.geometria).coordinates;
	
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
	denuncia.tipo = type;
	denuncia.coordenadas = coordinates;
	feature.attributes = {
		denuncia: denuncia
		
	};
	
	console.log(feature.attributes);
	vector.getSource().addFeature(feature);
});

map.addLayer(vector);

map.addOverlay(overlay);

var select = new ol.interaction.Select();

select.on('select', function(e){
	if(! e.selected[0]) return;
	e.target.getFeatures().forEach(function(f){
		
		console.log('denuncia seleccionada : ' + f.attributes.denuncia.gid);

		$(content).empty();
		$(content).append($(getDenunciaRow(f.attributes.denuncia, true)));
		$('.container-fluid').css('text-align', 'center');
		$('.container-fluid').css('padding-top', '0px');
		$('.container-fluid').css('margin', '0px');
		overlay.setPosition(ol.extent.getCenter(f.getGeometry().getExtent()));

		$('#imagenes_denuncia').click(function(e){
			cambiar_imagen(f.attributes.denuncia, this);
		});

	});
	$(container).removeClass('hidden');
});

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

	function cambiar_imagen(denuncia, boton){
		//console.log(denuncia);
		//denuncia = JSON.parse(denuncia);
		console.log(denuncia.imagenes);
		var imagenes = denuncia.imagenes;
		if(!imagenes) return;
		var actual = $(boton).attr('src');

		var index = -1;

		imagenes.forEach(function(imagen, index_){
			if(imagen.path == actual) index = index_;
		});

		if(index == -1) $(boton).attr('src', imagenes[0].path)
		else if(index == imagenes.length - 1) $(boton).attr('src', getGeoserverMiniatura(denuncia, 1200));
		else $(boton).attr('src', imagenes[index + 1].path);
		console.log('index', index, 'length', imagenes.length);
	}