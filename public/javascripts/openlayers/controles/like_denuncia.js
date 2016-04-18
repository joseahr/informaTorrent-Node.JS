window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para darle un like a la denuncia
 */
app.LikeDenuncia = function(opt_options) {

  var options = opt_options || {},
  button = document.createElement('button'),
  element = document.createElement('div'),
  this_ = this,
  aux = 0;
  
  num_denuncias_io.emit('te_pregunto_que_si_me_gusta_esta_puta_mierda_de_denuncia?', {denuncia: denuncia, usuario_id: id_usuario});

  num_denuncias_io.on('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?', 
  function(data){
	  if (data.error == false){
		  alert(data.like + 'like')
		  if(data.like)
			  button.innerHTML = '<i class="fa fa-thumbs-up" style="color: #00bbff"></i>';
		  else
			  button.innerHTML = '<i class="fa fa-thumbs-o-up"></i>';
	  }
	  else {
		  if (aux == 0) {aux++; return;}
		  BootstrapDialog.alert({
			  title: 'Error',
			  message: 'Debes estar registrado para indicar que te gusta esta denuncia',
        onshow : function(dialog){$(dialog.getModalHeader()).css('background', 'rgb(200,50,50)')}
		  });
	  }
  });
  
  function like_ (){
	  num_denuncias_io.emit('le_he_dao_al_boton_de_me_gusta_haz_lo_que_tengas_que_hacer', {denuncia: denuncia, usuario_id: id_usuario});
  }

  button.innerHTML = '<i class="fa fa-thumbs-o-up"></i>';
  button.addEventListener('click', like_, false);

  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Like');
  element.setAttribute('data-content', 'Dale un like a la denuncia');
  element.className = 'like_denuncia ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });
};

ol.inherits(app.LikeDenuncia, ol.control.Control);