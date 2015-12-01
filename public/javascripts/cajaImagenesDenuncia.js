$(function(){
	
	$('#rightContainer').hover(function(){
		if($('#files').html() == ''){
			//alert('rc no files');
			return;
		}
		if($('#files').scrollLeft() + $('#files').innerWidth() >= $('#files')[0].scrollWidth){
			//alert('max-right');
			return;
		}
		if($(this).is(':animated')){$(this).stop(true, false)}
		else {$(this).fadeTo(300, 1);}
	}, function(){$(this).fadeTo(300, 0)});
	
	$('#leftContainer').hover(function(){
	
		if($('#files').scrollLeft() == 0){
			//alert('max-left');
			return;
		}
		if($('#files').html() == '') {
			//alert('lc no files');
			return;
		}
		if($(this).is(':animated')){$(this).stop(true, false)}
		else {$(this).fadeTo(300, 1);}
	}, function(){$(this).fadeTo(300, 0)});
			
	$('#right-button').click(function(event) {
		event.preventDefault();
		$('#files').animate({
			scrollLeft: "+=282px"
		}, "fast");
	});
	$('#left-button').click(function(event) {
		event.preventDefault();
		$('#files').animate({
			scrollLeft: "-=282px"
		}, "fast");
	});
});