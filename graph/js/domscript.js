var svg = d3.select("#visualization");

d3.json("data/authors.json", function(error, data) {
	// create logharitmic scale for text
	min = 999;
	max = 0;
	for (var i=0; i<data.length;i++) {
		var length = data[i]["publications"].length
		min = (length < min) ? length : min;
		max = (length > max) ? length : max;
	}
	fontSizeScale = d3.scale.log()
		.domain([min, max])
		.range([15, 40]);

	svg.selectAll("text").data(data)
	.enter().append("text")
	.attr("x", 40)
	.attr("y", function(d, i) { return i*20+10})
	.text(function(d) {return d["name"]})
	.style("fill", "steelblue")
	.style("font-size", function(d) {
		return fontSizeScale(d["publications"].length)
	})
})