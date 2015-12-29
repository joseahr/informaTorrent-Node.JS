  // GET FEATURE INFO
  var div = $('<div>');
  var hayInfo = false;
  map.on('singleclick', function(evt){
    if (!info) {$('.ol-popup').addClass('hidden'); return;}
    $('.ol-popup').removeClass('hidden');
    $('#popup-content').empty();
    div = $('<div>');
    div.css('overflow-x', 'scroll');
    var coordinate = evt.coordinate;
    div.append('<p>' + ol.coordinate.toStringHDMS(coordinate) + '</p>');
    groupCartoTorrentWMS.getLayers().forEach(function(layer){
      console.log(layer);
      var url;
      var append = '';
      if(layer.getSource() instanceof ol.source.TileWMS && layer.getVisible() == true){
        url = layer.getSource().getGetFeatureInfoUrl(coordinate,
        map.getView().getResolution(),
        proj, {'INFO_FORMAT': 'text/html'});
        $.get(url, function(data){
          hayInfo = true;
          $(div).append(data);
          $('table.featureInfo').addClass('table table-responsive auto');
          $('table.featureInfo tbody tr th').addClass('info auto');
        });
      }
    });
  
    if (hayInfo){
      var button_mas_info = document.createElement('button');
      button_mas_info.className = 'btn btn-default';
      button_mas_info.innerHTML = 'VER INFORMACIÓN'
      button_mas_info.addEventListener('click', function(event){
      BootstrapDialog.show({
        title: 'Operación GetFeatureInfo',
        message: $(div),
        buttons: [{
          label: 'Cerrar',
          action: function(dialog){dialog.close();}
        }]
      });
    });
  
    $('#popup-content').append(button_mas_info);
    popup.setPosition(coordinate);
    hayInfo = false;
    }
  });
  
  $('#popup-closer').click(function() {
    popup.setPosition(undefined);
    $(this).blur();
    return false;
  });
    
  