      var info = false;
      
      var helpTooltipElement, helpMsg;
        function createHelpTooltip() {
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
      }
      
      var pointerMoveHandler = function(evt) {
        if (evt.dragging || !info) {
          return;
        }
        /** @type {string} */
        var helpMsg = '<i class="fa fa-info-circle"></i> Click para obtener información';
        helpTooltipElement.innerHTML = helpMsg;
        helpTooltip.setPosition(evt.coordinate);
        $(helpTooltipElement).removeClass('hidden');
      };
      
      // MousePosition Control --> ol.control.MousePosition
      var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.toStringHDMS,
      });
      
      // GET FEATURE INFO
      var popup = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
        element: document.getElementById('popup'),
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
      }));
      
      // Mapa --> ol.Map
      var map = new ol.Map({
        controls: ol.control.defaults({
          attribution: false // No atribución
        }).extend([mousePositionControl, // MousePosition
          new ol.control.FullScreen(), // FullScreen
          new ol.control.LayerSwitcher({tipLabel: 'Leyenda'}), // LayerSwitcher
          new ol.control.ScaleLine(), // ScaleLine
          new ol.control.ZoomSlider(), // ZoomSlider
          new app.GetFeatureInfo(),
          new app.Move(),
          new app.CloseHeader(),
          new app.Draw_()
        ]),
        target: 'map',
        overlays : [popup],
        view: new ol.View({
          projection: proj,
          zoom: 3,
          center: ol.proj.fromLonLat([-0.47343, 39.42811], 'EPSG:4258'),
          minZoom: 0,
          maxZoom: 10
          // Importante poner nuestra proyección, aunque es un parámetro opcional HAY QUE PONERLO!
        })
      });
      
      ortoPNOA.setVisible(true);
      manzanas.setVisible(false);
      caminos.setVisible(false);
      viales.setVisible(false);
      nom_viales.setVisible(false);
      
      var groupCartoTorrentWMS = new ol.layer.Group({
        title: 'Cartografía de Torrent WMS',
        layers: [municipio, manzanas, viales, caminos, nom_viales, portales]
      });
      
      map.addLayer(groupCapasBase); // Añadimos grupo de Capas 1
      //map.addLayer(groupCartoTorrentWMST); // Añadimos grupo de Capas 2
      map.addLayer(groupCartoTorrentWMS); // Añadimos grupo de Capas 2
      
      // Añadimos Control OverviewMap
      map.addControl(new ol.control.OverviewMap({
        layers: [new ol.layer.Tile(ignBase.getProperties())],
        view: new ol.View({ // Importante añadir la View con nuestra proyección
          projection: proj
        })
      }));
      
      ignBase.setVisible(false);
      
      map.on('pointermove', pointerMoveHandler);
      createHelpTooltip();
      // FIN MAPA
      
      map.getViewport().addEventListener('mouseout', function(evt){
        $(helpTooltipElement).addClass('hidden');
      }, false);
      
      $('#map').click(function(e){
          //alert('hideee');
          $('[data-toggle="right"], [data-toggle="left"]').popover('hide');
        });