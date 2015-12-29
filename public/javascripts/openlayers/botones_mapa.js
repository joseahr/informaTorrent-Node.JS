window.app = {};
var app = window.app;

/**
 * Control Creado para obtener nuestra posición
 */
app.Tracking = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-eye"></i>';

  var this_ = this;
  
  function show (){
      show_position = !show_position;
      geolocation.setTracking(show_position);
      featuresOverlay.setVisible(show_position);
      
      if(show_position){
        $(button).empty();
        $(button).append('<i class="fa fa-eye-slash" >');
        panTo = 0;
      }
      else {
        $(button).empty();
        $(button).append('<i class="fa fa-eye" >');
      }
  }

  button.addEventListener('click', show, false);

  var element = document.createElement('div');
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


/**
 * Control Creado para hacer peticiones GetFeatureInfo
 */
app.GetFeatureInfo = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-info-circle"></i>';

  var this_ = this;
  
  function getFeatureInfo_ (){
      $(helpTooltipElement).removeClass('hidden');
      info = true;
  }

  button.addEventListener('click', getFeatureInfo_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'GetFeatureInfo');
  element.setAttribute('data-content', 'Obtener información de las entidades en un punto');
  element.className = 'get_feature_info ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.GetFeatureInfo, ol.control.Control);

/**
 * Control Creado para moverse por el mapa (quitar controles de dibujar...)
 */
app.Move = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-hand-o-up"></i>';

  var this_ = this;
  
  function move_ (){
      $(helpTooltipElement).addClass('hidden');
      info = false;
      
	  if(draw) map.removeInteraction(draw);
	  map.removeInteraction(modify);
	  info = false;
	  isDrawInteractionActive = false;
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

/**
 * Control Creado para mostrar el panel lateral (Editar, Nueva)
 */
app.Lateral = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-list-alt"></i>';
  
  var this_ = this;
  
  var aux = 0;
  
  function lateral_ (){
	  
	$('.btn-map').css('z-index', '0');
	$('.cd-panel-container').css('z-index','6');
	$('.cd-panel-header').css('display', 'block');
	$('.cd-panel-header').css('z-index','7');
	$('.cd-panel').addClass('is-visible');
	
	if ($('header').css('display') == 'block'){
		$('header').css('display', 'none');
		$('#show_menu').removeClass('btn-danger');
		$('#show_menu').addClass('btn-default');
		$('#show_menu').empty();
		$('#show_menu').append('<i class="fa fa-navicon" style="color: #fff"></i>');
		$('header').addClass('fadeOutLeft');
	}

	if (aux == 0) {
		iniciarEditor();
		iniciarTags();
		aux++;
	}
  }

  button.addEventListener('click', lateral_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Datos');
  element.setAttribute('data-content', 'Rellena o modifica los datos de la denuncia');
  element.className = 'lateral ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.Lateral, ol.control.Control);

/**
 * Control Creado para cerrar menú header
 */
app.CloseHeader = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.setAttribute('id', 'show_menu');
  button.innerHTML = '<i class="fa fa-navicon"></i>';
  
  var this_ = this;
  
  var aux = 0;
  
  function closeHeader_ (){
	if ($('header').hasClass('fadeOutLeft')){
		$('header').removeClass('fadeOutLeft');
		$('header').stop(true, true).slideDown();
		
		$(button).empty();
		$(button).append('<i class="fa fa-close" style="color: rgb(255, 50, 0)"></i>');
	} else {
		$('header').addClass('fadeOutLeft');
		$('header').stop(true, true).slideUp();

		$(button).empty();
		$(button).append('<i class="fa fa-navicon" style="color: #fff"></i>');
	}	  
  }

  button.addEventListener('click', closeHeader_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Cerrar Menú');
  element.setAttribute('data-content', 'Abrir/Cerrar el menú superior');
  element.className = 'close_header ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.CloseHeader, ol.control.Control);

/**
 * Control Creado para dibujar, eliminar, editar puntos lineas y polígonos
 */
app.Draw_ = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.setAttribute('id', 'show_menu');
  button.innerHTML = '<i class="fa fa-pencil"></i>';
  
  var this_ = this;
  
  function draw_ (){
	  BootstrapDialog.show({
		  title: 'Dibujar denuncia',
		  message: '<select id="dibujar" data-style="btn-default">' + 
		  				'<option value="nada">Nada</option>' +
		  				'<option value="punto">Punto</option>' +
		  				'<option value="linea">Línea</option>' +
		  				'<option value="poligono">Polígono</option>' +
		  				'<option value="editar">Editar</option>' +
		  				'<option value="eliminar">Eliminar</option>' +
		  			'</select>',
		  buttons: [{label: 'Cerrar', action: function(dialog){dialog.close();}}],
		  onshown: function(dialog){
			  $('#dibujar').selectpicker({
				  width: '100%'
			  });
			  
			  $('#dibujar').change(function(){
				  var opcion = $(this).val();
				  
				  if(opcion == 'punto'){
					  if(draw) map.removeInteraction(draw);
					  map.removeInteraction(modify);
					  addInteraction('Point');
					  info = false;
					  isDrawInteractionActive = true;
				  }
				  else if(opcion == 'linea'){
					  if(draw) map.removeInteraction(draw);
					  map.removeInteraction(modify);
					  addInteraction('LineString');
					  info = false;
					  isDrawInteractionActive = true;
				  }
				  else if(opcion == 'poligono'){
					  if(draw) map.removeInteraction(draw);
					  map.removeInteraction(modify);
					  addInteraction('Polygon');
					  info = false;
					  isDrawInteractionActive = true;
				  }
				  else if(opcion == 'editar'){
					  if(draw) map.removeInteraction(draw);
					  map.addInteraction(modify);
					  info = false;
					  isDrawInteractionActive = false;
				  }
				  else if(opcion == 'eliminar'){
					  BootstrapDialog.show({
						  title: 'Eliminar denuncia dibujada',
						  message: '¿Desea eliminar la denuncia dibujada?',
						  buttons: [{label: 'Cancelar', action: function(dialog_){dialog_.close();dialog.close();}},
							  		{label: 'Aceptar', action: function(dialog_){
										  map.removeInteraction(modify);
										  vectorSource.clear();
										  map.removeOverlay(lastTooltip);
										  info = false;
										  isDrawInteractionActive = false;
										  dialog_.close();
										  dialog.close();
							  		}}]
					  });
				  }
				  else if(opcion == 'nada'){
					  map.removeInteraction(modify);
					  map.removeInteraction(draw);
				  }
				  
			  });
		  }
	  });
	  
  }

  button.addEventListener('click', draw_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Dibujar');
  element.setAttribute('data-content', 'Herramientas para dibujar, editar y eliminar denuncias en el mapa');
  element.className = 'draw ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.Draw_, ol.control.Control);

/**
 * Control Creado para abrir el panel lateral info denuncia
 */
app.InfoDenuncia = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-list-alt"></i>';

  var this_ = this;
  
  function info_ (){
	  
	  var panel = 'contenido';
	  
	  $('.btn-map').css('z-index', '0');
	  $('#' + panel + ' > .cd-panel-container').css('z-index','5');
	  $('#' + panel + ' > .cd-panel-header').css('display', 'block');
	  $('#' + panel + ' > .cd-panel-header').css('z-index','6');
	  $('#' + panel).addClass('is-visible');
		
	  if ($('header').css('display') == 'block'){
		  $('header').css('display', 'none');
		  $('#show_menu').removeClass('btn-danger');
		  $('#show_menu').addClass('btn-default');
		  $('#show_menu').empty();
		  $('#show_menu').append('<i class="fa fa-navicon" style="color: #fff"></i>');
		  $('header').addClass('fadeOutLeft');
	  }
  }

  button.addEventListener('click', info_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Contenido');
  element.setAttribute('data-content', 'Título y descripción de la denuncia');
  element.className = 'info_denuncia ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.InfoDenuncia, ol.control.Control);

/**
 * Control Creado para abrir el panel lateral comentarios denuncia
 */
app.ComentariosDenuncia = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-comments"></i>';

  var this_ = this;
  
  function comentarios_ (){
	  
	  tinymce.init({
		  selector: 'textarea',
		  plugins: ['advlist autolink link lists charmap print preview hr anchor pagebreak',
		            'searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking',
		            'save table contextmenu directionality emoticons template paste textcolor'],
		  theme: 'modern',
		  language_url: '/langs/es.js',
		  min_width: 300,
		  resize: false
	  });	
	  
	  var panel = 'comentarios';
	  
	  $('.btn-map').css('z-index', '0');
	  $('#' + panel + ' > .cd-panel-container').css('z-index','5');
	  $('#' + panel + ' > .cd-panel-header').css('display', 'block');
	  $('#' + panel + ' > .cd-panel-header').css('z-index','6');
	  $('#' + panel).addClass('is-visible');
		
	  if ($('header').css('display') == 'block'){
		  $('header').css('display', 'none');
		  $('#show_menu').removeClass('btn-danger');
		  $('#show_menu').addClass('btn-default');
		  $('#show_menu').empty();
		  $('#show_menu').append('<i class="fa fa-navicon" style="color: #fff"></i>');
		  $('header').addClass('fadeOutLeft');
	  }
  }

  button.addEventListener('click', comentarios_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Comentarios');
  element.setAttribute('data-content', 'Añadir/Ver comentarios');
  element.className = 'comentarios_denuncia ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.ComentariosDenuncia, ol.control.Control);

/**
 * Control Creado para abrir el panel lateral imágenes denuncia
 */
app.ImagenesDenuncia = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-image"></i>';

  var this_ = this;
  
  function imagenes_ (){
	  
	  $('.carousel').carousel({
	      interval: false
	  });
	  
	  var panel = 'imagenes';
	  
	  $('.btn-map').css('z-index', '0');
	  $('#' + panel + ' > .cd-panel-container').css('z-index','5');
	  $('#' + panel + ' > .cd-panel-header').css('display', 'block');
	  $('#' + panel + ' > .cd-panel-header').css('z-index','6');
	  $('#' + panel).addClass('is-visible');
		
	  if ($('header').css('display') == 'block'){
		  $('header').css('display', 'none');
		  $('#show_menu').removeClass('btn-danger');
		  $('#show_menu').addClass('btn-default');
		  $('#show_menu').empty();
		  $('#show_menu').append('<i class="fa fa-navicon" style="color: #fff"></i>');
		  $('header').addClass('fadeOutLeft');
	  }
  }

  button.addEventListener('click', imagenes_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Imágenes');
  element.setAttribute('data-content', 'Imágenes asociadas a la denuncia');
  element.className = 'imagenes_denuncia ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.ImagenesDenuncia, ol.control.Control);
