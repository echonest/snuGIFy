$(function(){
	var $gifSearch = $("#gifSearch");

	$gifSearch.submit(function(){
		var $this = $(this),
		//url = $gifSearch.val("action");
		url = "http://snuggle.sandpit.us/searchgif?query=",
		finderoo = $("#gifTitle").val(),
		$imagesContainer = $("#images");

		console.log(finderoo);
		$.ajax({
			url : url + finderoo,
			dataType: 'json',
			success : function(data){
				populate($imagesContainer,data);
			},
			error : function (a,b,c) {
				console.log(a,b,c);
			}
		});
		return false;
	});

	var populate = function($obj,data){
		var html = "";
		for (var i=0;i<data.length;i++){
			html += '<img src="'+data[i].url+'" class="selectable" />';
		}
		$obj.html(html);
	};

});