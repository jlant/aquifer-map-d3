// default values
var mapType = 'btn-precip';
var sliderYear = '1980';

// set width and height of chart
var chartWidth = 290;
var chartHeight = 50;

// set width and height of svg element (aquifer map)
var mapWidth = 1000;
var mapHeight = 700;

// chart axes
var x = d3.scale.linear()
	.range([1980, 2011]);

var y = d3.scale.linear()
	.range([100, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

// var line = d3.svg.line()
    // .x(function(d) { return x(d.year); })
    // .y(function(d) { return y(d.value); });

// slider bar for map year
$("#slider-year").slider();
$("#slider-year").on("slide", function(slideEvt) {
	sliderYear = slideEvt.value;
	$("#sliderValue").text(slideEvt.value);
	$('#chart-header1 .chart-type').text('Year: ' + slideEvt.value);
});

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

// this is needed for pan performance
var container = svg.append("g");
	
svg
    .call(zoom)
    .call(zoom.event);

// load the data file; note path is relative from index.html
d3.json("data/WBD_HUC8_PMAS_sa_Geo.json", function(error, json) {
	//data/PMAS_model_boundary_Geo.json
	//data/WBD_HUC8_PMAS_sa_Geo.json

	if (error) { return console.error(error) };
    console.log("hello#1");
	populateChart();
	generateChart();

	// bind the data and create one path for each geojson feature
	container.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path);

	container.selectAll("path")
		.data(json.features)
		.on("mouseover", function(d) {
			d3.select(this)
				.transition().duration(10)
				.attr("fill", "yellow")
				.attr("stroke-width", 3);
			d3.select("#chart-title").text("HUC8: " + d.properties.HUC_8)
		})
		.on("mouseout", function(d) {
				d3.select(this)
					.transition().duration(10)
					.attr("fill", "white")
					.attr("stroke-width", 1);
		})
});   // <-- End of map drawing

function zoomed() {
  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
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


// adding click events to button group
$("#btn-precip").on('click', function() {
	$("#btn-et").removeClass('btn btn-primary');
	$("#btn-et").addClass('btn btn-default');
	$("#btn-recharge").removeClass('btn btn-primary');
	$("#btn-recharge").addClass('btn btn-default');
	$(this).addClass('btn btn-primary');
	mapType = $(this).attr('id');
	console.log(mapType);
	paintPMAS();
	populateChart();
	//alert("Precip button clicked!");
});

$("#btn-et").on('click', function() {
	$("#btn-precip").removeClass('btn btn-primary');
	$("#btn-precip").addClass('btn btn-default');
	$("#btn-recharge").removeClass('btn btn-primary');
	$("#btn-recharge").addClass('btn btn-default');
	$(this).addClass('btn btn-primary');
	mapType = $(this).attr('id');
	console.log(mapType);
	paintPMAS();
	populateChart();
	//alert("ET button clicked!");
});

$("#btn-recharge").on('click', function() {
	$("#btn-precip").removeClass('btn btn-primary');
	$("#btn-precip").addClass('btn btn-default');
	$("#btn-et").removeClass('btn btn-primary');
	$("#btn-et").addClass('btn btn-default');
	$(this).addClass('btn btn-primary');
	mapType = $(this).attr('id');
	console.log(mapType);
	paintPMAS();
	populateChart();
	//alert("Recharge button clicked!");
});


// Set the color depending on the mapType (eventually load raster here too?)
var paintPMAS = function() {
	svg.selectAll("path")
		.attr('fill', function(d){
			var color = '#eee';
			if( mapType == 'btn-precip'){
				color = 'blue'
			}
			else if( mapType == 'btn-et'){
				color = 'red'
			}
			else if( mapType == 'btn-recharge'){
				color = 'green'
			}
			return color;
		})
}


// Generate chart
var generateChart = function() {
	mapChart = d3.select("#map-aquifer-chart").append("svg")
		.attr('id', 'map-aquifer-chart-svg')
		.attr("width", chartWidth)
		.attr("height", chartHeight)
		.append("g");
}


// Populate chart
var populateChart = function() {
	var chartLabel = '';
	if( mapType == 'btn-precip'){
		chartLabel = 'Precipitation, in in/yr'
	}
	else if( mapType == 'btn-et'){
		chartLabel = 'Evapotranspiration, in in/yr'
	}
	else if( mapType == 'btn-recharge'){
		chartLabel = 'Recharge, in in/yr'
	}
	$('#chart-title').text('HUC8: ');
	$('#chart-header1 .chart-type').text('Year: ' + sliderYear);
	$('#chart-header2 .chart-type').text(chartLabel);
}