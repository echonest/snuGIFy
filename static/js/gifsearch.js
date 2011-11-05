$(function(){
	var $gifSearch = $("#gifSearch");

	$gifSearch.submit(function(){
		var $this = $(this),
		//url = $gifSearch.val("action");
		url = "http://snugify.sandpit.us/searchgif?query=",
		finderoo = $("#gifTitle").val();

		console.log(finderoo);
		$.ajax({
			url : url + finderoo,
			type : "GET",
			success : function(data){
				console.log(data);
			},
			error : function (a,b,c) {
				console.log(a,b,c);
			}
		});
		return false;
	});

});