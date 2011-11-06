	var $gifSearch = $("#gifSearch"),
		$selectable = $(".selectable"),
		$imagesContainer = $("#images");
	
		$selectable.live("click",function(){
			var $this = $(this),
				source = $this.attr("src");
			
			$imagesContainer.children("img").removeClass("selected");
			
			$(this).addClass("selected");
			
			//playGIF(this.src);
			
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
				addLoader('#gifSearch .btn','imageLoader');
			},
			success : function(data){
				populate($imagesContainer,data);
				$("#songSearch").fadeIn();
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
		$("#imageLoader").fadeOut();
	};

	var addLoader = function(to,id){
		console.log("add loader to ", to);
		$('<div class="loader" id="'+id+'"></div>').insertAfter(to);
	};
