window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para hacer peticiones GetFeatureInfo
 */
app.GetFeatureInfo = function(opt_options) {

  var options = opt_options || {},
  info = false,
  div,
  this_ = this,
  button = document.createElement('button'),
  element = document.createElement('div'),
  popup = new ol.Overlay({
        element: document.getElementById('popup'),
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
  }),
  helpTooltipElement, 
  helpTooltip, 
  helpMsg,
  createHelpTooltip = function() {
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
    if (evt.dragging || !info) {
      return;
    }

    helpMsg = '<i class="fa fa-info-circle"></i> Click para obtener información';
  
    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
  
    $(helpTooltipElement).removeClass('hidden');
  },
  addURL = function(coordinate, layer){
    if(layer.getSource() instanceof ol.source.TileWMS && layer.getVisible() == true){
      console.log('eeeeee');
      var url = layer.getSource().getGetFeatureInfoUrl(
        coordinate,
        map.getView().getResolution(),
        proj, 
        {'INFO_FORMAT': 'text/html'}
      );
      $.get(url, function(data){
        if(data.length > 0) {
          div.append($(data));
        }
        console.log(div + 'diiiiiiiiiiiiv');
        //alert(JSON.stringify(div));
        $('table.featureInfo').addClass('table table-responsive auto');
        $('table.featureInfo tbody tr th').addClass('info auto');
      });
    } 
  };
  
  this.activar = function(bool){

    if(bool){
      map.getControls().forEach(function(control){
        if(control instanceof app.Draw){
          control.activar(false);
        }
      });
      info = true;
      $(helpTooltipElement).removeClass('hidden');
      button.innerHTML = '<i class="fa fa-info-circle" style="color:#ffbb00"></i>';
    }
    else {
      info = false;
      $('#popup').css('display', 'none');
      $(helpTooltipElement).addClass('hidden');
      button.innerHTML = '<i class="fa fa-info-circle"></i>';
    }
  };
  
  /******************* INIT ****/  
  map.addOverlay(popup);
  $('#popup').css('display', 'none');


  /******************* EVENTOS ****/
  map.on('singleclick', function(evt){ // Cuando clickemos en el mapa 
    div = $(document.createElement('div'));
    if (!info) return;
    
    // Si el control está activado ...
    
    div.css('overflow-x', 'scroll');
    var coordinate = evt.coordinate;
    div.append('<p>' + ol.coordinate.toStringHDMS(coordinate) + '</p>');
    
    map.getLayers().forEach(function(layer, index, that){
      //console.log(layer);
      var append = '';

      try {
        console.log('layer');
        if (layer instanceof ol.layer.Group && layer.getVisible() == true ) {
          layer.getLayers().getArray().forEach(function(sublayer, j, layers) {
            if(sublayer.getVisible())
              addURL(coordinate, sublayer);
          })
        } else if ( !(layer instanceof ol.layer.Group) && layer.getVisible() == true ) {
          if(layer.getVisible())
            addURL(coordinate, layer);
        }
      }
      catch(e){
        console.log('no source' + e);
      }

      if(index == that.length -1) {
        $('#popup').parent().css('display', '');
        var button_mas_info = document.createElement('button');
          button_mas_info.className = 'btn btn-default';
          button_mas_info.innerHTML = 'VER INFORMACIÓN'
          button_mas_info.addEventListener('click', function(event){
          BootstrapDialog.show({
            title: 'Operación GetFeatureInfo',
            message: div,
            onshow : function(dialog){
                dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
                  '<div class="bootstrap-dialog-close-button">' + 
                    '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
                  '</div>' +
                  '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
                  '<i class="fa fa-info-circle" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
                    '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> GetFeatureInfo</h4>' +
                  '</div>' +
                '</div>'));
                dialog.getModalDialog().find('.close').click(function(){dialog.close()});
                dialog.getModalBody().parent().css('border-radius', '15px');
                dialog.getModalBody().css('padding-top', '10px');
            },
            buttons: [{
              label: 'Cerrar',
              action: function(dialog){dialog.close();}
            }]
          });
          });
          console.log(coordinate);
          $('.ol-popup').parent().css('display', '');
          $('.ol-popup').css('display', '');
          $('#popup').removeClass('hidden');
          $('#popup > #popup-content').empty();
          $('.ol-popup > #popup-content').append(button_mas_info);
          popup.setPosition(coordinate);
      }

    });
  
  });
  
  $('#popup-closer').click(function() {
    popup.setPosition(undefined);
    $(this).blur();
    return false;
  });

  map.on('pointermove', pointerMoveHandler);
  createHelpTooltip();
  
  map.getViewport().addEventListener('mouseout', function(evt){
	    $(helpTooltipElement).addClass('hidden');
  }, false);

  
  function getFeatureInfo_ (){
    if(!info) this_.activar(true);
    else this_.activar(false);
  }

  button.innerHTML = '<i class="fa fa-info-circle"></i>';
  button.addEventListener('click', getFeatureInfo_, false);

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
