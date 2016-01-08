/**
 * Elements that make up the popup.
 */
var container = document.getElementById('popup-visor');
var content = document.getElementById('popup-visor-content');
var closer = document.getElementById('popup-visor-closer');

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
	var feature, type = JSON.parse(denuncia.geometria).type;
	
	if(type == 'Point'){
    	feature = new ol.Feature({
    		  geometry: new ol.geom.Point(JSON.parse(denuncia.geometria).coordinates),
    		  name: 'Denuncia - Punto'
    	});
    	
    }
    else if(type == 'LineString'){
    	feature = new ol.Feature({
    		geometry: new ol.geom.LineString(JSON.parse(denuncia.geometria).coordinates),
    		name: 'Denuncia - Polígono'
    	});
    }
    else if(type == 'Polygon'){
    	feature = new ol.Feature({
    		geometry: new ol.geom.Polygon(JSON.parse(denuncia.geometria).coordinates),
    		name: 'Denuncia - Polígono'
    	});
    }
	
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
		
		var tags = f.attributes.denuncia.tags_ || [];
		
		var numImages = f.attributes.denuncia.imagenes ? f.attributes.denuncia.imagenes.length : 0;
		
		numComments = f.attributes.denuncia.comentarios ? f.attributes.denuncia.comentarios.length : 0;
		
		var stringTags = '';
		
		tags.forEach(function(tag){
			stringTags += '#' + tag.tag + '  ';
		});
		
		content.innerHTML = '<div class="row text-center" style="padding-bottom: 0px !important;background: rgba(0,0,0,0.2); padding: 5px;"><div class="col-lg-4 text-center"><img class="img img-thumbnail img-responsive img-circle" src="' + f.attributes.denuncia.usuario[0].profile.picture + '" style="height: 60px; width: 60px; float: left; margin: 0 auto;"></img></div>' + 
							'<div class="col-lg-8 text-center" style="padding: 5px;"><p> denunciado por <span><a href="/app/usuarios/' + f.attributes.denuncia.usuario[0]._id + '">' + f.attributes.denuncia.usuario[0].profile.username + '</a></span></p></div>'+
							'<div class="col-lg-12 btn-info text-center" style="padding: 5px;">' + f.attributes.denuncia.fecha + '</div>' +
							'<div class="col-lg-12" style="clear: both; margin-top: 5px;"><i class="fa fa-tags"></i> ' + stringTags + '</div>' + 
							'<div class="col-lg-12" style="clear: both;"><i class="fa fa-image"></i> ' + numImages + '  <i class="fa fa-comments"></i> ' + numComments + '</div>' + 
							'</div>' + 
							'<h4>' + f.attributes.denuncia.titulo + '</h4>' +
							'<div class="space" style="clear: both;"></div>' + 
							'<div style="max-height: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; word-wrap: break-word; word-break: break-all;">' + f.attributes.denuncia.descripcion + '</div>' +
							'<div class="space" style="clear: both;"></div>' + 
							'<a style="margin-right: 15px; width: 100%;" class="btn btn-warning" href="/app/denuncia/' + f.attributes.denuncia.gid + '"> + Info</a>';
		overlay.setPosition(ol.extent.getCenter(f.getGeometry().getExtent()));
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