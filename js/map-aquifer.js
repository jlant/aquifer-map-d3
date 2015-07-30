// set width and height of svg element
var width = 1140;
var height = 500;

// create projection
var projection = d3.geo.albersUsa()
	.translate([width / 2, height / 2])
	.scale([1100]);

// create path generator; converts geojson to svg path's ("M 100 100 L 300 100 L 200 300 z")
var path = d3.geo.path()
	.projection(projection);

// create an svg element to the body of the html
var svg = d3.select("#map").append("svg")
	.attr("width", width)
	.attr("height", height);

// load the data file; note path is relative from index.html
d3.json("data/PMAS_model_boundary.json", function(error, json) {

	if (error) { return console.error(error) };
    console.log("hello");	

	// bind the data and create one path for each geojson feature
	svg.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path);
});
