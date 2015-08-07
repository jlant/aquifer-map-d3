// default values
var mapType = 'btn-precip';

// set width and height of svg element
var mapWidth = 1000;
var mapHeight = 700;

// create projection
var projection = d3.geo.albersUsa()
	.translate([mapWidth / 15, mapHeight / 2])
	.scale([3000]);

// create zoom and pan functionality
var zoom = d3.behavior.zoom()
    .translate([0,0])
    .scale(1)
    .scaleExtent([1,10])
    .on("zoom", zoomed);

// create path generator; converts geojson to svg path's ("M 100 100 L 300 100 L 200 300 z")
var path = d3.geo.path()
	.projection(projection);

// create an svg element to the body of the html
var svg = d3.select("#map-aquifer").append("svg")
	.attr('id', 'map-aquifer-svg')
	.attr("width", mapWidth)
	.attr("height", mapHeight)
    .append("g");

// group the svg layers
var g = svg.append("g");

svg.append("rect")
    .attr("class", "overlay")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

svg
    .call(zoom)
    .call(zoom.event);

// load the data file; note path is relative from index.html
d3.json("data/PMAS_model_boundary_Geo.json", function(error, json) {

	if (error) { return console.error(error) };
    console.log("hello#1");	

	// bind the data and create one path for each geojson feature
	g.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path);
	
	g.selectAll("path")
		.data(json.features)
		.on("mouseover", function(d) {
			d3.select(this)
				.transition().duration(10)
				.attr("fill", "yellow")
				.attr("stroke-width", 3);
		})
		.on("mouseout", function(d) {
				d3.select(this)
					.transition().duration(10)
					.attr("fill", "white")
					.attr("stroke-width", 1);
		})
});   // <-- End of map drawing

function zoomed() {
  g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

// Adding a legend

var color_domain = [500, 1000, 1500, 2000, 2500, 3000];
var ext_color_domain = [0, 500, 1000, 1500, 2000, 2500, 3000];
var legend_labels = ["A", "B", "C", "D", "E", "F", "G"];
var color = d3.scale.threshold()
    .domain(color_domain)
    .range(["#bdc9be", "#97b0a0", "#5e8b73", "#4b7e64", "#256546", "#125937", "#004d28"]);

var legend = svg.selectAll("g.legend")
    .data(ext_color_domain)
    .enter()
	.append("g")
    .attr("class", "legend");

var ls_w = 20, ls_h = 20;

legend.append("rect")
    .attr("x", 20)
    .attr("y", function(d, i){ return mapHeight - (i*ls_h) - 2*ls_h;})
    .attr("width", ls_w)
    .attr("height", ls_h)
    .style("fill", function(d, i) { return color(d); })
    .style("opacity", 0.8);

legend.append("text")
    .attr("x", 50)
    .attr("y", function(d, i){ return mapHeight - (i*ls_h) - ls_h - 4;})
    .text(function(d, i){ return legend_labels[i]; });
