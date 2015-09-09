var map = (function(map, $, d3) {
	'use strict'

	// default values
	var mapType = 'btn-precip';
	var sliderYear = '1980';
	var csvFileName = 'precip_1980.csv';
	var svg = undefined;
	var container = undefined;
	var path = undefined;

	// example data
	var data = [3, 6, 2, 7, 5, 2, 0, 3, 8, 9, 2, 5, 7, 5, 2, 4, 5, 1, 5, 10, 5, 1, 5, 5, 4, 5, 6, 1, 8, 9, 5, 6];

	// set width, height, and margin of chart
	var chartW = 290;
	var chartH = 180;
	var chartM = 20;

	// set width and height of svg element (aquifer map)
	var mapWidth = 1000;
	var mapHeight = 700;
	var mapOrigWidth = undefined;
	var multiplier = 1;

	// chart axes
	var x = d3.scale.linear()
		.domain([0, data.length])
		.range([0 + chartM, chartW - 2*chartM]);

	var y = d3.scale.linear()
		.domain([0, 10])
		.range([chartH - chartM, 0 + 2*chartM]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
		
	var line = d3.svg.line()
		.x(function(d,i) { return x(i); })
		.y(function(d) { return y(d); });

	// var line = d3.svg.line()
		// .x(function(d) { return x(d.year); })
		// .y(function(d) { return y(d.value); });
	
	// create a quantize scale (function) to sort data values into buckets of color
	var color = d3.scale.quantize()
		.range(colorbrewer.RdYlBu[9]);
	
	// slider bar for map year
	$("#slider-year").slider();
	$("#slider-year").on("slide", function(slideEvt) {
		sliderYear = slideEvt.value;
		$("#sliderValue").text(slideEvt.value);
		$('#chart-header1 .chart-type').text('Year: ' + slideEvt.value);
		paintPMAS();
	});
	
	// function for zoom
	function zoomed() {
		container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}

	// function to calculate a color based on precip_mean
	function calculate_color(d) {
		var value = d.properties.precip_mean;

		if (value) {
			return color(value);
		}
		else {
			return "#808080"; // gray
		}
	}
	
	
	map.preInit = function() {
		console.log("at preInit");
		
		var tempWidth = $('#map-aquifer-container').width();
		
		var tempMultiplier = 0;
		
		if(tempWidth < 1200) {
			tempMultiplier = 1
		}
		else {
			tempMultipler = 1
		}
		
		var tempHeight = tempWidth * tempMultiplier;
		
		$('#map-aquifer').css('height', tempHeight)
	}
	
	map.initMap = function() {
		console.log("at initMap top");
		
		// create an svg element to the body of the html
		svg = d3.select("#map-aquifer").append("svg")
			.attr('id', 'map-aquifer-svg')
			.attr("width", mapWidth)
			.attr("height", mapHeight)
			.append("g");
			
		// this is needed for pan performance
		container = svg.append("g");
		
		console.log("at initMap middleA");
		// create zoom and pan functionality
		var zoom = d3.behavior.zoom()
			.translate([0,0])
			.scale(1)
			.scaleExtent([1,10])
			.on("zoom", zoomed);
		console.log("at initMap middleB");
		
		svg
			.call(zoom)
			.call(zoom.event);
		
		console.log("at initMap bottom");
		// $.getScript("data/testdata.js", initData)
		initData();
	}
	
	var initData = function() {
		
		setResizer();
		generateChart();
		drawMap();
		$('#map-aquifer').css('height', 'auto')
		
		// adding click events to button group
		$("#btn-precip").click(function() {
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

		$("#btn-et").click(function() {
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

		$("#btn-recharge").click(function() {
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
	}
	
	var setResizer = function() {
		$(window).resize(function() {
			setDimensions();
			
			d3.select("#map-aquifer-svg")
				.attr("width", mapWidth)
				.attr("height", mapHeight);
			
			container.attr("transform", 'scale(' + mapWidth/mapOrigWidth + ')')
		});
	}
	
	var setDimensions = function() {
		
		// mapWidth = $(window).width();
		mapWidth = mapWidth * multiplier;
		
		if(mapWidth < 1200) {
			multiplier = 1
		}
		else {
			multipler = 1
		}
		// mapHeight = mapWidth * multiplier;
		mapHeight = mapHeight * multiplier;
		
		if(mapOrigWidth == undefined){
			mapOrigWidth = mapWidth;
		}
	}
	
	// Generate chart
	var generateChart = function() {
		
		var mapChart = d3.select("#map-aquifer-chart").append("svg")
			.attr('id', 'map-aquifer-chart-svg')
			.attr("width", chartW)
			.attr("height", chartH)
			.append("g")
			.attr("transform", "translate(30,-20)");
		
		mapChart.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (chartH-chartM) + ")")
			.call(xAxis);

		mapChart.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(" + chartM + ",0)")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".75em")
			.style("text-anchor", "end")
			.text("ylabel");

		mapChart.append("path")
			.attr("class", "chartLineA")
			.attr("d", line(data));
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
	
	var drawMap = function() {
		// create projection
		var mapProjection = d3.geo.albersUsa()
			.translate([mapWidth / 15, mapHeight / 2])
			.scale([3000]);

		// create path generator; converts geojson to svg path's ("M 100 100 L 300 100 L 200 300 z")
		path = d3.geo.path()
			.projection(mapProjection);
		
		paintPMAS();
	}
	
	// Set the color of each HUC-8 depending on the mapType (dataName) and sliderYear
	var paintPMAS = function() {
		
		// Construct fileName for .csv data file
		var dataName = '';
		if( mapType == 'btn-precip'){
			dataName = 'precip'
		}
		else if( mapType == 'btn-et'){
			dataName = 'et'
		}
		else if( mapType == 'btn-recharge'){
			dataName = 'recharge'
		}
		
		csvFileName = (dataName + '_' + sliderYear + '.csv');
		console.log(csvFileName);
		
		svg.selectAll("path")
			.attr('fill', function() {
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
		
		loadData();
	}

	// load the SWB model data
	function loadData() {
		var url = ('"data/' + csvFileName + '"');
		console.log(url);
		
		d3.csv("data/et_1980.csv", function(precip) {
			
			// set the input domain for the color scale
			color.domain([
				d3.min(precip, function(d) { return parseFloat(d.MEAN); }),
				d3.max(precip, function(d) { return parseFloat(d.MEAN); })
				]);

			// load the data file; note path is relative from index.html
			d3.json("data/WBD_HUC8_PMAS_sa_Geo.json", function(error, json_huc8) {
				//data/PMAS_model_boundary_Geo.json
				//data/WBD_HUC8_PMAS_sa_Geo.json

				if (error) { return console.error(error) };
				console.log("hello#1");
				populateChart();

				// merge the precip data and geojson
				for (var i = 0; i < precip.length; i++) {

					// get the HUC8 name
					var precip_HUC8 = precip[i].HUC_8;

					// get the precip value and convert from string to float
					var precip_mean = parseFloat(precip[i].MEAN);

					// find the corresponding HUC8 inside the geojson
					for (var j = 0; j < json_huc8.features.length; j++) {

						// get the json HUC8 name
						var json_HUC8 = json_huc8.features[j].properties.HUC_8;

						if (precip_HUC8 === json_HUC8) {

							// copy the precip value into the json
							json_huc8.features[j].properties.precip_mean = precip_mean;

							// stop looking through the geojson
							break;
						}
					}	
				}
				
				console.log("hello#2");
				
				// bind the data and create one path for each geojson feature
				container.selectAll("path")
					.data(json_huc8.features)
					.enter()
					.append("path")
					.attr("d", path)
					.attr("fill", calculate_color);

				container.selectAll("path")
					.data(json_huc8.features)
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
			});   // <-- End of json_huc8
		});   // <-- End of csv
	}

	// Adding a legend
	// var legend_labels = ["Dry", ".", ".", ".", ".", ".", ".", ".", "Wet"];

	// var legend = svg.selectAll("g.legend")
		// .data(color.range())
		// .enter()
		// .append("g")
		// .attr("class", "legend");

	// var ls_w = 20, ls_h = 20;

	// legend.append("rect")
		// .attr("x", 20)
		// .attr("y", function(d, i){ return mapHeight - (i*ls_h) - 2*ls_h;})
		// .attr("width", ls_w)
		// .attr("height", ls_h)
		// .style("fill", function(d) { return d; });

	// legend.append("text")
		// .attr("x", 50)
		// .attr("y", function(d, i){ return mapHeight - (i*ls_h) - ls_h - 4;})
		// .text(function(d, i){ return legend_labels[i]; });

	
	// End stuff
	console.log("hello#0a");
	return map;
	
}(map || {}, jQuery, d3 ))

map.preInit();
console.log("hello#0b");

jQuery(document).ready(function(){
	console.log("hello#0c");
	map.initMap();
	console.log("hello#0d");
})
