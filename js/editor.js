$("#editor-area").on("keydown change input", null, function(e) {
	if (e.keyCode == 9 || e.which == 9) {
		e.preventDefault();
		var s = this.selectionStart;
		$(this).val(function(i, v) {
			return v.substring(0, s) + "\t" + v.substring(this.selectionEnd);
		});
		this.selectionEnd = s + 1;
	}
	$("#editor").html(
		$(this)
			.val()
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;") || ""
	);
	$(this).each(function(index, elem) {
		elem.style.height =
			$("#editor")
				.parent()
				.height() +
			5 +
			"px";
	});
	Prism.highlightElement($("#editor")[0]);
});
