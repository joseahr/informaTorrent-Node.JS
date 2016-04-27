window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para darle un like a la denuncia
 */
app.ExternalWMS = function(opt_options) {

  var options = opt_options || {},
  button = document.createElement('button'),
  element = document.createElement('div'),
  this_ = this,
  parser = new ol.format.WMSCapabilities(),
  multiselect = function(opciones){
    return '<div class="container-fluid text-center"><div class="row">' +
    '<div class="col-xs-5">' +
        '<select name="from[]" id="multiselect" class="form-control" size="8" multiple="multiple">' + 
          opciones + 
        '</select>' +
    '</div>' +

    '<div class="col-xs-2">' +
        '<button type="button" id="multiselect_rightAll" class="btn btn-block"><i class="glyphicon glyphicon-forward"></i></button>' +
        '<button type="button" id="multiselect_rightSelected" class="btn btn-block"><i class="glyphicon glyphicon-chevron-right"></i></button>' +
        '<button type="button" id="multiselect_leftSelected" class="btn btn-block"><i class="glyphicon glyphicon-chevron-left"></i></button>' +
        '<button type="button" id="multiselect_leftAll" class="btn btn-block"><i class="glyphicon glyphicon-backward"></i></button>' +
    '</div>' +

    '<div class="col-xs-5">' +
        '<select name="to[]" id="multiselect_to" class="form-control" size="8" multiple="multiple"></select>' + 
    '</div></div>' +
    '<button id="add_capas" class="btn btn-success col-lg-12" style="margin-top: 5px">AÑADIR CAPAS</button>' +
  '</div>'
  }, 
  message = '<div class="container-fluid"><p> Pega aquí el link hacia el servidor externo</p><input placeholder="ej: http://www.dominio.es/geoserver/wms" class="form-control col-lg-12" id="input_ext" class="col-lg-12" type="text"></input><button id="btn_ext" style="min-width : 100%" class="col-lg-12 btn btn-success">CONECTAR CON EL SERVIDOR</button></div>',
  dialog_ = function() {
    var dialog = new BootstrapDialog({
      title : 'Añade un servidor WMS externo',
      message : message, 
      autodestroy : true, 
      onshow : function(dialog){
          dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
            '<div class="col-xs-4" style="text-align: center; color: #fff; font-weight : bold;">' +
            '<i class="fa fa-external-link" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
              '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> Añade un Servidor WMS externo</h4>' +
            '</div>' +
          '</div>'));
          dialog.getModalBody().parent().css('border-radius', '15px');
          dialog.getModalBody().css('padding-top', '10px');
      },
      onshown : function(d){
        $(dialog.getModalBody()).find('#btn_ext').click(function(e){
          var wms_ext = $(dialog.getModalBody()).find('#input_ext').val();
          
          var regex = new RegExp(/^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/);
          
          wms_ext = wms_ext.split('?')[0];
          
          console.log(wms_ext.match(regex));
          
          if(!wms_ext.match(regex))
            return BootstrapDialog.show({
              title : 'Error', 
              message : 'Debe introducir una URL válida',
              onshow : function(dialog){$(dialog.getModalHeader()).css('background', 'rgb(200,50,50)')}
            });

          var xhr = new XMLHttpRequest();
          var url = wms_ext + '?request=GetCapabilities&service=WMS&version=1.3.0';

          var params = {url : url, method : 'GET'};
          xhr.open('GET', "/xhr?" + $.param(params), true);
          //xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
          xhr.onload = function(){
            //console.log(xhr.responseText);
            try {
              var json_cap = parser.read(xhr.responseText);
              //console.log(json_cap);
              var opts = '';
              json_cap.Capability.Layer.Layer.forEach(function(layer){
                console.log(layer);
                // TODO --> Mostrar capas en un recuadro, decirle al usuario que 
                // elija las que quiera y cargarlas como un grupo de capas
                opts += '<option value="' + layer.Name + '">' + layer.Name + '</option>';
              });

              //dialog.setData('url', url);
              $(dialog.getModalBody()).empty().append($(multiselect(opts)));
              $(dialog.getModalBody()).find('#multiselect').multiselect({
                keepRenderingSort : true,
              });
              $(dialog.getModalBody()).find('button').css('min-width', '0px');

              $(dialog.getModalBody()).find('#add_capas').click(function(){
                var layers = [];
                $('#multiselect_to > option').each(function(){

                  console.log($(this).val());
                  layers.push(new ol.layer.Tile({
                    title: $(this).val(),
                    visible: true,
                    source: new ol.source.TileWMS({
                      //crossOrigin: 'anonymous', // So important maniguiiiiii
                      url: wms_ext,
                      params: {
                        'FORMAT': 'image/png', 
                        VERSION : '1.1.0',
                        LAYERS: $(this).val(),
                        STYLES: '',
                      }
                    })
                  }));

                }); // multiselect option each 

                map.addLayer(new ol.layer.Group({
                  title : wms_ext,
                  layers : layers
                }));

                d.close();

              }); // add capas click

            } catch (e) {
              BootstrapDialog.show({
                title : 'Error',
                message : 'Error conectando al Servidor externo: \n' + e,
                onshow : function(dialog){
                  $(dialog.getModalHeader()).css('background', 'rgb(200,50,50)');
                }
              });
            }
          };
          xhr.send();
        });
      }
    });
    dialog.open();
  };

  function external_wms (){
    dialog_();
  };

  button.innerHTML = '<i class="fa fa-external-link"></i>';
  button.addEventListener('click', external_wms, false);

  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'WMS Externo');
  element.setAttribute('data-content', 'Añade capas de un servidor WMS externo');
  element.className = 'external_wms ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });
};

ol.inherits(app.ExternalWMS, ol.control.Control);