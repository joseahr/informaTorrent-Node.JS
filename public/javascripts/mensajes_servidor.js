if(message != undefined)
{
	var type = message.type;
	if (type != 'undefined'){
		var title = '';
		var msg = message.msg;
		
		if (type == 'type-error'){
			title = 'Error';
			type = BootstrapDialog.TYPE_DANGER;
		}
		if (type == 'type-success'){ 
			title = 'Completado';
			type = BootstrapDialog.TYPE_SUCCESS;
		}
		if (type == 'type-info'){ 
			title = 'Info';
			type = BootstrapDialog.TYPE_INFO;
		}
		if (type)
			BootstrapDialog.show({
				type: type,
				title: title,
				message: msg,
				buttons: [{
				label: 'Cerrar',
				action: function(dialog){dialog.close()}
				}]
			}); 

	}
}