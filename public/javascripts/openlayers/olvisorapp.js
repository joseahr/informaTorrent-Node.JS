/**
 * Elements that make up the popup.
 */
var seleccionada = '',
vector_denuncias = new ol.layer.Vector({
	displayInLayerSwitcher: false,
	name : 'Geometría Denuncias',
    source: new ol.source.Vector({
        format: new ol.format.GeoJSON()
    }),
    style: styleFunction
}),// Vector donde añadiremos las denuncias
/*vector_markers = new ol.layer.Vector({
    source: new ol.source.Vector({
        format: new ol.format.GeoJSON()
    }),
    style: styleMarkers
}),// Vector donde añadiremos las denuncias*/
// Cluster Source
clusterSource = new ol.source.Cluster({
	distance: 7,
	source: new ol.source.Vector()
}),
// Animated cluster layer
clusterLayer = new ol.layer.AnimatedCluster({
	displayInLayerSwitcher: false,	
	name: 'Cluster Denuncias',
	source: clusterSource,
	animationDuration: 700,
	// Cluster style
	style: getClusterStyle
}),
features_cache = {},
duration = 6000,
flash = function(feature) {
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

	    var flashStyle = new ol.style.Style({
            image: new ol.style.Circle({
              radius: radius,
              snapToPixel: false,
              stroke: new ol.style.Stroke({
                color: 'rgba(255, 0, 0, ' + opacity + ')',
                width: 0.25 + opacity
              })
            })
        });
	    vectorContext.setStyle(flashStyle);
	    vectorContext.drawGeometry(flashGeom);

	    if (elapsed > duration) {
	      	ol.Observable.unByKey(listenerKey);
	      	return;
	    }

	    // tell OL3 to continue postcompose animation
	    map.render();
	}
	listenerKey = map.on('postcompose', animate);
},
spinner,
cambiar_imagen = function(denuncia, boton, d_body){
	//console.log(denuncia);
	//denuncia = JSON.parse(denuncia);
	console.log(denuncia.imagenes);
	var imagenes = denuncia.imagenes;
	if(!imagenes) {
		BootstrapDialog.alert({
			title : 'ERROR', 
			message : 'La denuncia no contiene imágenes',
			/*onshow : function(dialog){$(dialog.getModalHeader()).parent().css('background-color', 'rgb(200,50,50)')}*/
		});
		return;
	}
	var actual = $(boton).attr('src');

	var index = -1;

	imagenes.forEach(function(imagen, index_){
		if(imagen.path == actual) index = index_;
	});

	if(spinner) spinner.remove();
	spinner = $('<div id="spinner" style="text-align: center; position: absolute; z-index: 10; top: 100px;width: 100%;"><i class="fa fa-spinner fa-spin fa-5x" style="color: #339BEB"></i>'
		+ '<p>Cargando imagen...</p></div>');
	$(d_body).append(spinner);

	boton.onload = function(){
		spinner.remove();
	};

	if(index == -1) 
		$(boton).attr('src', imagenes[0].path);
	else if(index == imagenes.length - 1) 
		$(boton).attr('src', getGeoserverMiniatura(denuncia, 400));
	else 
		$(boton).attr('src', imagenes[index + 1].path);

	console.log('index', index, 'length', imagenes.length);
},
sel_dialog = new BootstrapDialog({
	autodestroy : true
});

/****************  INIT  ********/
denuncias.forEach(function(denuncia){
	//console.log('denuncia añadida bdd' + JSON.parse(denuncia.geometria).type);
	var feature,
	feature_marker, 
	type = denuncia.geometria.type, 
	coordinates = denuncia.geometria.coordinates;

	denuncia.marker = 'visor';

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

    var centro = denuncia.centro.coordinates;
    //centro[1] += 0.00001;
    feature_marker = new ol.Feature({
    	geometry : new ol.geom.Point(centro),
    	name : 'Denuncia Marker'
    });

	denuncia.tipo = type;
	denuncia.coordenadas = coordinates;

	feature.attributes = {
		type : 'denuncia',
		denuncia: denuncia
	};
	feature_marker.attributes = {
		type : 'marker',
		marker_type : 'visor',
		denuncia: denuncia
	};

	features_cache[denuncia.gid] = feature;
	//vector_markers.getSource().addFeature(feature_marker);
	clusterSource.getSource().addFeature(feature_marker);
});

//map.addLayer(vector_markers);
map.addLayer(vector_denuncias);
map.addLayer(clusterLayer);
//map.addLayer(vector);
//map.addOverlay(overlay);

/*******************    EVENTOS   *************/
clusterSource.getSource().on('addfeature', function(e) {
	//alert(e.feature.getGeometry().getType());
	console.log(e.feature.attributes.marker_type);
	if(e.feature.attributes.marker_type == 'nueva')
		flash(e.feature);
});

var style1 = new ol.style.Style({
	image: new ol.style.Circle({
		radius: 5,
		stroke: new ol.style.Stroke({
			color:"rgba(0,255,255,1)", 
			width:1 
		}),
		fill: new ol.style.Fill({
			color:"rgba(0,255,255,0.3)"
		})
	}),
	// Draw a link beetween points (or not)
	stroke: new ol.style.Stroke({
		color:"#fff", 
		width:1 
	}) 
});

// Select interaction to spread cluster out and select features
var selectCluster = new ol.interaction.SelectCluster({	
	// Point radius: to calculate distance between the features
	pointRadius: 20,
	animate: true,
	spiral : true,
	circleMaxObjects : 60,
	layers : [clusterLayer, vector_denuncias],
	// Feature style when it springs apart
	featureStyle: function(){
		return [ style1 ]
	}
});

map.addInteraction(selectCluster);
// On selected => get feature in cluster and show info
selectCluster.getFeatures().on(['add'], function (e){	
	console.log(e.element.getGeometry(), 'geom');
	var c = e.element.get('features');
	if(!c){
		// Hemos clicado sobre la geometría de la denuncia, ¡¡NO EL MARCADOR!!
		var f = e.element;
		// Mostramos la info
		show_denuncia(f.attributes.denuncia);
		console.log('denuncia seleccionada : ' + f.attributes.denuncia.gid);
	}
	else{
		console.log('pppp');
		if (c.length==1){

			var feature = c[0],
				feature_denuncia = features_cache[feature.attributes.denuncia.gid],
				pan = ol.animation.pan({duration: 500, source: map.getView().getCenter()}),
				zoom = ol.animation.zoom({duration: 500, resolution: map.getView().getResolution()});
			// Buscamos denuncias abiertas, actualizamos su atributo added
			vector_denuncias.getSource().getFeatures().forEach(function(f){
				if(f.attributes.denuncia.gid != feature.attributes.denuncia.gid){
					var fe = features_cache[f.attributes.denuncia.gid];
					fe.attributes.added = false;
					return;
				}
			});
			// Limpiamos la cpaa de geometrías de denuncias
			vector_denuncias.getSource().clear();
			// Animación
			map.beforeRender(pan, zoom);
			map.getView().setCenter(ol.extent.getCenter(feature_denuncia.getGeometry().getExtent()));
			map.getView().setZoom(10);
			// Si no está añadida la geometría de la denuncia la añadimos
			if(!feature_denuncia.attributes.added){
				feature_denuncia.attributes.added = true;
				vector_denuncias.getSource().addFeature(feature_denuncia);
			}
			// Si está añadida mostramos su info
			else {
				show_denuncia(feature_denuncia.attributes.denuncia);
			}
			// Deseleccionamos todo
			selectCluster.getFeatures().clear();
		}
		else if(c.length > 1){
			console.log('seleccionado cluster mas de una',c);
			c.forEach(function(f){
				f.setStyle(styles_markers[f.attributes.marker_type]);
				clusterLayer.changed();
			});
			//$(".infos").text("Cluster ("+c.length+" features)");
		}
	}
});

selectCluster.getFeatures().on(['remove'], function (e){	
	console.log(e.element.getGeometry(), 'geom');
	console.log('guaa');
	var c = e.element.get('features');
	if(!c){
		var f = e.element;
		features_cache[f.attributes.denuncia.gid].attributes.added = false;
		vector_denuncias.getSource().removeFeature(f);
		console.log('denuncia deseleccionada : ' + f.attributes.denuncia.gid);
	}
	else{
		console.log('pppp');
		if (c.length==1){	
			var feature = c[0];
			console.log(feature.attributes.marker_type, 'deselect');
			//feature.setStyle(styles_markers[feature.attributes.marker_type]);
		}
		else if(c.length > 1){
			console.log('deselecionado cluster mas de una',c);
			//$(".infos").text("Cluster ("+c.length+" features)");
		}
	}
});

function show_denuncia(denuncia){
	var num_likes = denuncia.likes ? denuncia.likes.length : 0,
	imagenes = denuncia.imagenes ? denuncia.imagenes.length : 0,
	comentarios = denuncia.comentarios ? denuncia.comentarios.length : 0,
	fecha = getFechaFormatted(new Date(denuncia.fecha)),
	tags = [];
	console.log(denuncia.tags_, denuncia)
	if (denuncia.tags_)
  		denuncia.tags_.forEach(function(tag){
  		tags.push('#' + tag.tag);
  	});

	sel_dialog = new BootstrapDialog({
		buttons: [{
			label: 'IR',
			action : function(){ window.location.replace('/app/denuncias/' + denuncia.gid) }
		}, {
			label : 'Cerrar',
			action : function(dialog){dialog.close()}
		}]
	});

	sel_dialog.onShow(function(dialog){
		$(dialog.getModalHeader()).replaceWith($('<div class="row" style="margin: 0px; padding-bottom: 15px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
	            '<div class="bootstrap-dialog-close-button">' + 
	          	  '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
	            '</div>' +
				'<div class="col-xs-4" style="text-align: center;">' +
					'<img class="img img-thumbnail" src="' + denuncia.usuario[0].profile.picture + '" style="margin-top: 15px; width: 90px; height: 90px; object-fit: cover;" />' +
				'</div>' +
				'<div class="col-xs-8" style="text-align: center; color: #fff">' +
					'<div class="col-lg-12" style="margin-top: 15px;height: 30px;"><i class="fa fa-user"></i> ' + denuncia.usuario[0].profile.username + '</div>' +
					'<div class="col-lg-12" style="height: 30px;">' + 
						'<i class="fa fa-eye"></i> ' + denuncia.veces_vista + 
						' <i class="fa fa-thumbs-up"></i> ' + num_likes + 
						' <i class="fa fa-image"></i> ' + imagenes +
						' <i class="fa fa-comments"></i> ' + comentarios + 
						' <i class="fa fa-tags"></i> ' + tags.length +  
					' </div>' +
					'<div class="col-lg-12" style="height: 30px;"><i class="fa fa-calendar"></i> ' + fecha + '</div>' +
				'</div>' + 
			'</div>'));

		dialog.getModalDialog().find('.close').click(function(){dialog.close()});
  		dialog.getModalBody().parent().css('border-radius', '15px');
  		dialog.getModalBody().css('padding-top', '0px');
	});

	sel_dialog.onShown(function(dialog){
		dialog.setMessage('<h4 style="width: 100%; color: #fff; background-color: rgba(0,0,0,0.4); margin-top: -10px;text-align:center; border-radius: 5px">' + denuncia.titulo + '</h4>' +
		'<div class="row" style="margin-top: 15px; overflow-x: hidden; background-color: #fff">' + 
			'<i class="fa fa-tags"> ' + tags + '</i>' +
			'<div class="col-lg-12 text-center"><a href="javascript:void(0)"><img class="img img-thumbnail" id="imagenes_denuncia" src="' + getGeoserverMiniatura(denuncia, 500) + '" style="width: 300px; height: 300px; object-fit: cover; margin: 10 0 10 0px;"></img></a><div style="position : absolute; bottom : 15px; left : 50%; right : 50%; margin-left : -145px; margin-right : -145px; background : #00bbff; color : #fff;">CLICK PARA VER MÁS</div></div>' +
			'<h4>Descripción</h4>' + 
			'<div id="desc" style="margin: 5px;"></div>' + 
		'</div>');
		$(dialog.getModalBody()).find('#desc').append(decodeURIComponent(denuncia.descripcion));

		$(dialog.getModalBody()).find('#imagenes_denuncia').click(function(e){
			cambiar_imagen(denuncia, this, dialog.getModalBody());
		});
	});

	sel_dialog.onHide(function(dialog){
		//alert('hide');
		var feature = features_cache[denuncia.gid];
		feature.attributes.added = false;
		selectCluster.getFeatures().clear();
		clusterLayer.changed();
	});

	sel_dialog.open();
};


/***** PERMALINK ******/
if (window.location.hash) {
  var hash = window.location.hash.replace('#', '');
  var parts = hash.split(';');
  if (parts.length > 3) {
    zoom = parseInt(parts[2], 10);
    center = [
      parseFloat(parts[0]),
      parseFloat(parts[1])
    ];

    map.getView().setCenter(center);
    map.getView().setZoom(zoom);

    if (parts[3]) {
	    $.ajax({
	      url:"/app/denuncias/api?geojson=false&ids=" + parts[3],
	      dataType:"json",
	      success:function(v) {
	        var denuncias = v.denuncias;
	        console.log(denuncias, v);
	        denuncias.forEach(function(denuncia){
	        	if(!features_cache[denuncia.gid]){
					denuncia.tipo = denuncia.geometria.type;
					denuncia.coordenadas = denuncia.geometria.coordinates;
					//alert('denuncia ' + denuncia.tipo + ' ' + denuncia.coordenadas);

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
					  marker_type : 'visor',
					  denuncia: denuncia
					};

					features_cache[denuncia.gid] = feature;
					clusterSource.getSource().addFeature(feature_marker);
	        	}
	        });
	      }
	    });
	}
  }
}

map.on('moveend', function(){
  var centro = map.getView().getCenter();
  window.location.hash = centro[0] + ';' + centro[1] + ';' + map.getView().getZoom() + ';' + Object.keys(features_cache).join();
});