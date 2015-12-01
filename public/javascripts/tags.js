$(function(){
	/// TAGS
	var count = 0;
	var next = 1;
	$(".add-more").click(function(e){
		if(count == 5){
			$('#b1').removeClass('add-more');
			$('#b1').addClass('disabled');
			return false;
		}
		//e.preventDefault();
		var addto = "#ig1";
		count = count + 1;
		next = next + 1;
		var newIn = '<div id="ig' + next + '" class="input-group"><span id="remove' + (next) + '" class="btn btn-warning input-group-addon remove-me" >-</span>' + 
		'<input autocomplete="off" class="form-control" id="field' + next + '" name="field' + next + '" type="text" disabled></div><br>';
		var newInput = $(newIn);
		$(addto).before(newInput);
		$("#field" + next).val($('#field1').val());
		$('#field1').val('');
		$('.remove-me').click(function(e){
			count = count -1;
			if(count < 5){
				$('#b1').addClass('add-more');
				$('#b1').removeClass('disabled');
			}
			//e.preventDefault();
			var fieldNum = this.id.charAt(this.id.length-1);
			var fieldID = "#ig" + fieldNum;
			$('#field' + fieldNum).remove();
			$(this).remove();
			$(fieldID).next().remove();
			$(fieldID).remove();
		});
	});
});