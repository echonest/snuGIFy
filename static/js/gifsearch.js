$(function(){
	var $gifSearch = $("#gifSearch"),
		$selectable = $(".selectable"),
		$imagesContainer = $("#images");
	
		$selectable.live("click",function(){
			$imagesContainer.children("img").removeClass("selected");
			$(this).addClass("selected");
			$imagesContainer.find("img:not('.selected')").fadeOut(300,function(){
				$(this).remove();
			});
		});	

	$gifSearch.submit(function(){
		var $this = $(this),
		//url = $gifSearch.val("action");
		url = "http://snuggle.sandpit.us/searchgif?query=",
		finderoo = $("#gifTitle").val();

		console.log(finderoo);
		$.ajax({
			url : url + finderoo,
			dataType: 'json',
			beforeSend : function($this){
				addLoader('#gifSearch .btn');
			},
			success : function(data){
				populate($imagesContainer,data);
			},
			error : function (a,b,c) {
				console.log(a,b,c);
				$("#imageLoader").fadeOut().remove();
				alert("Something went wrong, so search again bitch.");
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
		$("imageLoader").fadeOut();
	};

	var addLoader = function(to){
		$('<div class="loader" id="imageLoader"></div>').insertAfter(to);
	}

});