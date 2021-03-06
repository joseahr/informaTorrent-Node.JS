window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para descargar cartografía bbox
 */
app.BBOX = function(opt_options) {

  var options = opt_options || {},
  url = window.location.href.split(':')[1],
  puerto_geoserver = '8001',
  hasbbox = false,
  button = document.createElement('button'),
  element = document.createElement('div'),
  this_ = this,
  helpTooltipElement, 
  helpMsg,
  boundingBox = new ol.interaction.DragBox({
    condition: ol.events.condition.always, // default
    className: 'line-dragbox'
  }),
  createHelpTooltip =  function() {
    if (helpTooltipElement) {
      helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'tooltip hidden';
    helpTooltip = new ol.Overlay({
      element: helpTooltipElement,
      offset: [15, 0],
      positioning: 'center-left'
    });
    map.addOverlay(helpTooltip);
  },
  pointerMoveHandler = function(evt) {
  	if (!hasbbox) {
  		console.log('no bbox', hasbbox);
  	 return;
  	}
  	  
  	$(helpTooltipElement).removeClass('hidden');
  	  
  	if(evt.dragging){
  		helpTooltipElement.innerHTML = 'Suelta para acabar el BBOX';
  		helpTooltip.setPosition(evt.coordinate);
  		return;
  	}
  	  
  	var helpMsg = 'Click para empezar a dibujar BBOX';
  	
  	helpTooltipElement.innerHTML = helpMsg;
  	helpTooltip.setPosition(evt.coordinate);	  
  };
  
  this.activar = function(bool){
	  console.log('BBOX', bool);
		if(!bool) {
      hasbbox = false;
      map.removeInteraction(boundingBox);
      $(helpTooltipElement).addClass('hidden');
      button.innerHTML = '<i class="fa fa-download"></i>';
      $('#capas_mapa').selectpicker('hide');
    }
    else {
      hasbbox = true;
      map.addInteraction(boundingBox);
      $(helpTooltipElement).removeClass('hidden');
      button.innerHTML = '<i class="fa fa-download" style="color:#ffbb00"></i>';
      $('#capas_mapa').selectpicker('show');
    }
    console.log('HASBBOX', hasbbox);
  };
  /*****************   INIT         */
  console.log(url);
  $('#capas_mapa').selectpicker('hide');

  map.on('pointermove', pointerMoveHandler);

  createHelpTooltip();
  /*****************     Evento bbox - boxEnd      */
  boundingBox.on('boxend', function(e){
  	 $(helpTooltipElement).addClass('hidden');
  	console.log('boxend');
  	
  	BootstrapDialog.show({
  		type: BootstrapDialog.TYPE_INFO,
  		title: 'DESCARGA DE CARTOGRAFÍA INTERACTIVA',
  		message: '<p>¿Desea descargar la cartografía seleccionada?</p><p>Capa: ' + $('#capas_mapa').val() + '</p>' +
  				 '<p> BBOX: [' + boundingBox.getGeometry().getExtent() + ']</p>',
      onshow : function(dialog){
          dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
            '<div class="bootstrap-dialog-close-button">' + 
              '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
            '</div>' +
            '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
            '<i class="fa fa-download" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
              '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> Descargar selección</h4>' +
            '</div>' +
          '</div>'));
          dialog.getModalDialog().find('.close').click(function(){dialog.close()});
          dialog.getModalBody().parent().css('border-radius', '15px');
          dialog.getModalBody().css('padding-top', '10px');
      },
  		buttons: [{
  		label: 'Cerrar',
  		action: function(dialog){dialog.close();}},
  		{label: 'SHP',
  		action: function(dialog){
  			dialog.close();
  			window.open(url + ':' + puerto_geoserver + '/geoserver/jahr/ows?service=WFS&version=1.0.0' + 
  			'&request=GetFeature&typeName=' + $('#capas_mapa').val() + '&outputFormat=shape-zip&bbox=' + boundingBox.getGeometry().getExtent());
  		}},
  		{label: 'GeoJSON',
  		 action: function(dialog){
  			 dialog.close();
  			 window.open(url + ':' + puerto_geoserver + '/geoserver/jahr/ows?service=WFS&version=1.0.0' + 
  			 '&request=GetFeature&typeName=' + $('#capas_mapa').val() + '&outputFormat=application/json&bbox=' + boundingBox.getGeometry().getExtent());
  		 }},
  		 {label: 'GML 3.2',
  		  action: function(dialog){
  			  dialog.close();
  			  window.open(url + ':' + puerto_geoserver + '/geoserver/jahr/ows?service=WFS&version=1.0.0' + 
  			  '&request=GetFeature&typeName=' + $('#capas_mapa').val() + '&outputFormat=application%2Fgml%2Bxml%3B+version%3D3.2&bbox=' + boundingBox.getGeometry().getExtent());
  		  }}],
  	});

  });
  
  function bbox_ (){
  	console.log('bbox');
  	if(!hasbbox) this_.activar(true);
  	else this_.activar(false);
  }

  button.innerHTML = '<i class="fa fa-download"></i>';
  button.addEventListener('click', bbox_, false);

  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Selecciona BBOX');
  element.setAttribute('data-content', 'Selecciona un recátngulo para limitar los elementos a descargar');
  element.className = 'bbox_download ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};

ol.inherits(app.BBOX, ol.control.Control);
