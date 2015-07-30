// set width and height of svg element
var width = 1000;
var height = 700;

// create projection
var projection = d3.geo.albersUsa()
	.translate([width / 15, height / 2])
	.scale([3000]);

// create zoom behavior
var zoom = d3.behavior.zoom()
    .on("zoom", zoomed);

// create path generator; converts geojson to svg path's ("M 100 100 L 300 100 L 200 300 z")
var path = d3.geo.path()
	.projection(projection);

// create an svg element to the body of the html
var svg = d3.select("#map").append("svg")
	.attr("width", width)
	.attr("height", height)
    .append("g");

var g = svg.append("g");
	
svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height);

svg
    .call(zoom)
    .call(zoom.event);

// load the data file; note path is relative from index.html
d3.json("data/PMAS_model_boundary.json", function(error, json) {

	if (error) { return console.error(error) };
    console.log("hello#1");	

	// bind the data and create one path for each geojson feature
	svg.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path);
});

function zoomed() {
  g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

d3.select(self.frameElement).style("height", height + "px");
