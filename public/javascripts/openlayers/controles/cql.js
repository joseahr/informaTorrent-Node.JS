window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para filtrar cartografía por sus atributos
 */
app.CQL = function(opt_options) {

	var options = opt_options || {},
	ip = '192.168.1.14',
	button = document.createElement('button'),
	element = document.createElement('div'),
  	this_ = this,
  	html = '<div class="container" style="width: 100%"><div class="col-lg-12">' +
  		'<select id="capas_mapa" class="selectpicker col-lg-12" data-style="btn-info" data-live-search="false" style="width: 100%">' +
  			'<option value="jahr:muni_torrent">Municipio</option>' +
  			'<option value="jahr:manzanas">Manzanas</option>' +
  			'<option value="jahr:viales">Viales</option>' +
  			'<option value="jahr:caminos">Caminos</option>' +
  			'<option value="jahr:portales">Portales</option>' +
  			'<option value="jahr:nombres_viales">Etiquetado Calles</option>' +
  			'<option value="jahr:denuncias_puntos">Denuncias Puntual</option>' +
  			'<option value="jahr:denuncias_lineas">Denuncias Lineal</option>' +
  			'<option value="jahr:denuncias_poligonos">Denuncias Poligonal</option>' +
  		'</select>' +
  		'<div class="col-lg-12"><div class="input-group space"><span class="input-group-addon"> Filtrar</span>' +
  		"<input id='cql_filter' class='form-control btn-default' type='text' placeholder='ej: gid=&#39;3h039h30b3l1jb9&#39;, titulo like &#39;%ejemplo%&#39;, etc. ' /></div></div>" +
  		'<div class="col-lg-12"><button class="btn btn-default col-lg-12" style="min-width : 100%" id="consultar">CONSULTAR</button></div>' + 
  		'<div class="col-lg-12"><button class="btn btn-default col-lg-12" style="min-width : 100%" id="reset">RESETEAR</button></div>' + 
  		'<div id="columnas" class="col-lg-12 space"></div>' +
  	'</div></div>';

  	function cql_ (){
	  	BootstrapDialog.show({
		  	title: 'Filtrar cartografía por sus atributos',
		  	message: html,
		  	buttons: [{label: 'Cerrar', action: function(d){d.close();}}],
		  	draggable: true,
		    onshow : function(dialog){
		        dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
			      '<div class="bootstrap-dialog-close-button">' + 
			        '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
			      '</div>' +
		          '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
		          '<i class="fa fa-search" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
		            '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> Filtrar cartografía por atributos</h4>' +
		          '</div>' +
		        '</div>'));
		        dialog.getModalDialog().find('.close').click(function(){dialog.close()});
		        dialog.getModalBody().parent().css('border-radius', '15px');
		        dialog.getModalBody().css('padding-top', '10px');
		    },
		  	onshown: function(){ 
			  	$('.selectpicker').selectpicker({width : '100%'}).selectpicker('mobile');
			  
			  	$('.selectpicker').change(function(e){
				  	var capa_aux = '';
				  	var capa = this.value;
				  
				  	if (capa == 'jahr:muni_torrent') capa_aux = 'muni_torrent';
				  	if (capa == 'jahr:manzanas') capa_aux = 'manzanas';
				  	if (capa == 'jahr:viales') capa_aux = 'tramos';
				  	if (capa == 'jahr:caminos') capa_aux = 'tramos';
				  	if (capa == 'jahr:nombres_viales') capa_aux = 'tramos';
				  	if (capa == 'jahr:portales') capa_aux = 'portales';
				  	if (capa == 'jahr:denuncias_puntos') capa_aux = 'denuncias_puntos';
				  	if (capa == 'jahr:denuncias_lineas') capa_aux = 'denuncias_lineas';
				  	if (capa == 'jahr:denuncias_poligonos') capa_aux = 'denuncias_poligonos';
				  
				  	var xhr = new XMLHttpRequest();
				  	xhr.open('GET', '/info?tabla=' + capa_aux, true);
				  	xhr.send();
				  
				  	xhr.onload = function(){
					  	var html = "<h4>Atributos de la capa '" + capa_aux + "'</h4>";
					  	var res = xhr.responseText;
					  	//alert(res);
					  	JSON.parse(res).cols.forEach(function(col){
						  	html += '<p><b>' +  col.nombre + '</b> (' + col.tipo + ')</p>';
					  	});
					  	$('#columnas').empty().append(html);
				  	}
				  
			  	});
			  
			  	$('#consultar').click(function(){
				  	var capa = $('.selectpicker').val(),
				  	style = (capa == 'jahr:muni_torrent' || capa == 'jahr:manzanas' || capa == 'jahr:denuncias_poligonos') ? 
				  		'poli_sel' : ((capa == 'jahr:portales' || capa == 'jahr:denuncias_puntos') ? 'punto_sel' : 'linea_sel'),
				  	source = new ol.source.TileWMS({
				  		crossOrigin : 'anonymous',
						url: 'http://' + ip + ':8080/geoserver/jahr/wms',
						params: {
							'FORMAT': format, 
			             	'VERSION': '1.1.0',
			             	tiled: true,
			             	LAYERS: capa,
			             	STYLES: style,
			             	'cql_filter': $('#cql_filter').val()
						}
				  	});

				  	console.log(source.getUrls()[0]);
				  	console.log(source.getParams());

				  	if (capa == 'jahr:muni_torrent') municipio.setSource(source);
				  	if (capa == 'jahr:manzanas') manzanas.setSource(source);
				  	if (capa == 'jahr:viales') viales.setSource(source);
				  	if (capa == 'jahr:caminos') caminos.setSource(source);
				  	if (capa == 'jahr:nombres_viales') nom_viales.setSource(source);
				  	if (capa == 'jahr:portales') portales.setSource(source);
				  	if (capa == 'jahr:denuncias_puntos') denuncias_puntos.setSource(source);
				  	if (capa == 'jahr:denuncias_lineas') denuncias_lineas.setSource(source);
				  	if (capa == 'jahr:denuncias_poligonos') denuncias_poligonos.setSource(source);  
			  	});

			  	$('#reset').click(function(){
				  	var capa = $('.selectpicker').val(),
				  	source = new ol.source.TileWMS({
				  		crossOrigin : 'anonymous',
						url: 'http://' + ip + ':8080/geoserver/jahr/wms',
						params: {
							'FORMAT': format, 
				            'VERSION': '1.1.0',
				            tiled: true,
				            LAYERS: capa,
				            STYLES: '',
						}
				  	});
				  
				  	console.log(source.getUrls());

				  	if (capa == 'jahr:muni_torrent') municipio.setSource(source);
				  	if (capa == 'jahr:manzanas') manzanas.setSource(source);
				  	if (capa == 'jahr:viales') viales.setSource(source);
				  	if (capa == 'jahr:caminos') caminos.setSource(source);
				  	if (capa == 'jahr:nombres_viales') nom_viales.setSource(source);
				  	if (capa == 'jahr:portales') portales.setSource(source);
				  	if (capa == 'jahr:denuncias_puntos') denuncias_puntos.setSource(source);
				  	if (capa == 'jahr:denuncias_lineas') denuncias_lineas.setSource(source);
				  	if (capa == 'jahr:denuncias_poligonos') denuncias_poligonos.setSource(source);
				  
				  
			  	});
		  	}
	  	});
  	}

	button.innerHTML = '<i class="fa fa-search"></i>';
  	button.addEventListener('click', cql_, false);

  	element.setAttribute('data-toggle', 'left');
  	element.setAttribute('title', 'Filtrar cartografía');
  	element.setAttribute('data-content', 'Filtrar cartografía por sus atributos');
  	element.className = 'cql_filter ol-unselectable ol-control';
  	element.appendChild(button);

  	ol.control.Control.call(this, {
    	element: element,
    	target: options.target
  	});
};

ol.inherits(app.CQL, ol.control.Control);
map.addControl(new app.CQL);
