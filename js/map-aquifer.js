var map = (function(map, $, d3) {
	'use strict'

	// default values
	var mapType = 'btn-precip';
	var sliderYear = '1980';
	var csvFileName = undefined;
	var svg = undefined;
	var container = undefined;
	var path = undefined;

	// example data
	var dataNum = [3, 6, 2, 7, 5, 2, 0, 3, 8, 9, 2, 5, 7, 5, 2, 4, 5, 1, 5, 10, 5, 1, 5, 5, 4, 5, 6, 1, 8, 9, 5, 6];

	// set width, height, and margin of chart
	var chartW = 390;
	var chartH = 180;
	var chartM = 20;

	// set width and height of svg element (aquifer map)
	var mapWidth = 1100;
	var mapHeight = 700;
	var mapOrigWidth = undefined;
	var multiplier = 1;

	// chart axes
	var x = d3.scale.linear()
		.domain([0, dataNum.length])
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
	
	// chart line
	var line = d3.svg.line()
		.x(function(d,i) { return x(i); })
		.y(function(d) { return y(d); });

	// var line = d3.svg.line()
		// .x(function(d) { return x(d.year); })
		// .y(function(d) { return y(d.value); });
	
	// create a quantize scale (function) to sort data values into buckets of color
	var color = d3.scale.quantize()
		.range(colorbrewer.RdYlBu[9]);
	
	// add a tooltip
	var tooltip_HUC8 = d3.select("body")
		.append("div")
		.attr("class", "tooltip_HUC8");
	
	// EVENT: adding click events to button group
	$("#btn-precip").click(function() {
		$("#btn-et").removeClass('btn btn-primary');
		$("#btn-et").addClass('btn btn-default');
		$("#btn-recharge").removeClass('btn btn-primary');
		$("#btn-recharge").addClass('btn btn-default');
		$(this).addClass('btn btn-primary');
		mapType = $(this).attr('id');
		console.log(mapType);
		loadData();
	});

	$("#btn-et").click(function() {
		$("#btn-precip").removeClass('btn btn-primary');
		$("#btn-precip").addClass('btn btn-default');
		$("#btn-recharge").removeClass('btn btn-primary');
		$("#btn-recharge").addClass('btn btn-default');
		$(this).addClass('btn btn-primary');
		mapType = $(this).attr('id');
		console.log(mapType);
		loadData();
	});

	$("#btn-recharge").click(function() {
		$("#btn-precip").removeClass('btn btn-primary');
		$("#btn-precip").addClass('btn btn-default');
		$("#btn-et").removeClass('btn btn-primary');
		$("#btn-et").addClass('btn btn-default');
		$(this).addClass('btn btn-primary');
		mapType = $(this).attr('id');
		console.log(mapType);
		loadData();
	});
	
	// EVENT: slider bar for map year
	$("#slider-year").slider();
	$("#slider-year").on("slide", function(slideEvt) {
		sliderYear = slideEvt.value;
		$("#sliderValue").text(slideEvt.value);
		$('#chart-header1 .chart-type').text('Year: ' + slideEvt.value);
		loadData();
	});
	
	// function for zoom
	function zoomed() {
		container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}

	// function to calculate a color based on modelVar_mean
	function calculate_color(d) {
		var value = d.properties.modelVar_mean;

		if (value) {
			return color(value);
		}
		else {
			return "#808080"; // gray
		}
	}
	
	// keep...might need this above if different color schemes for the three maps
	function calcolor() {
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
	}
	
	// ****MAIN****
	
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
		
		// create zoom and pan functionality
		var zoom = d3.behavior.zoom()
			.translate([0,0])
			.scale(1)
			.scaleExtent([1,10])
			.on("zoom", zoomed);
		
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
		console.log("at generateChart");
		
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
			.attr("d", line(dataNum));
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
	
	// Draw background layers here?
	var drawMap = function() {
		// create projection
		var mapProjection = d3.geo.albersUsa()
			.translate([mapWidth / 15, mapHeight / 2])
			.scale([3000]);

		// create path generator; converts geojson to svg path's ("M 100 100 L 300 100 L 200 300 z")
		path = d3.geo.path()
			.projection(mapProjection);
		
		loadData();
	}

	// load the SWB model data
	var loadData = function() {
		console.log("at loadData");
		
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
		
		var url = ('data/' + csvFileName);
		console.log(url);
		
		d3.csv(url, function(modelVar) {
			
			// set the input domain for the color scale
			color.domain([
				d3.min(modelVar, function(d) { return parseFloat(d.MEAN); }),
				d3.max(modelVar, function(d) { return parseFloat(d.MEAN); })
				]);
			
			// load the data file; note path is relative from index.html
			d3.json("data/conus.json", function(error, json_conus) {

				if (error) { return console.error(error) };
				
				// container.append("path")
					// .data(json_conus.features)
					// .attr("class", "conusStates")
					// .attr("d", path);
				container.selectAll(".conus-states")
					.data(json_conus.features)
					.enter()
					.append("path")
					.attr("class", "conus-states")
					.attr("d", path)
			});

			// load the data file; note path is relative from index.html
			d3.json("data/WBD_HUC8_PMAS_sa_Geo.json", function(error, json_huc8) {

				if (error) { return console.error(error) };
				console.log("hello#1");
				populateChart();

				// merge the modelVar data and geojson
				for (var i = 0; i < modelVar.length; i++) {

					// get the HUC8 name
					var modelVar_HUC8 = modelVar[i].HUC_8;

					// get the modelVar values (mean, min, max) and convert from string to float
					var modelVar_mean = parseFloat(modelVar[i].MEAN);
					var modelVar_min = parseFloat(modelVar[i].MIN);
					var modelVar_max = parseFloat(modelVar[i].MAX);

					// find the corresponding HUC8 inside the geojson
					for (var j = 0; j < json_huc8.features.length; j++) {

						// get the json HUC8 name
						var json_HUC_8 = json_huc8.features[j].properties.HUC_8;

						if (modelVar_HUC8 === json_HUC_8) {

							// copy the modelVar values into the json
							json_huc8.features[j].properties.modelVar_mean = modelVar_mean;
							json_huc8.features[j].properties.modelVar_min = modelVar_min;
							json_huc8.features[j].properties.modelVar_max = modelVar_max;

							// stop looking through the geojson
							break;
						}
					}	
				}
				
				console.log("hello#2");
				console.log(json_huc8);
				
				// bind the data and create one path for each geojson feature
				container.selectAll(".huc8s")
					.data(json_huc8.features)
					.enter()
					.append("path")
					.attr("class", "huc8s")
					.attr("d", path);

				container.selectAll(".huc8s")
					.data(json_huc8.features)
					.on("mouseover", function(d) {
						d3.select(this)
							.transition().duration(10)
							.attr("stroke-width", 3);
						d3.select("#chart-title").text("HUC8: " + d.properties.HUC_8);
					})
					.on("mouseout", function(d) {
							d3.select(this)
								.transition().duration(10)
								.attr("stroke-width", 1)
							return tooltip_HUC8.style("visibility", "hidden");
					})
					.on("click", function(d) {
						return tooltip_HUC8.style("visibility", "visible")
							.style("top", (d3.event.pageY + 10) + "px")
							.style("left", (d3.event.pageX + 10) + "px")
							.html("HUC8: " + d.properties.HUC_8 + "<br>" + "Max: " + d.properties.modelVar_max.toPrecision(3) + " in/yr" + "<br>" + "Mean: " + d.properties.modelVar_mean.toPrecision(3) + " in/yr" + "<br>" + "Min: " + d.properties.modelVar_min.toPrecision(3) + " in/yr");
					})
					.on("mousemove", function() {
						return tooltip_HUC8.style("top", (d3.event.pageY + 10) + "px")
							.style("left", (d3.event.pageX + 10) + "px");
					})
				
				console.log("hello#3");
				colorMap();
				addLegend();
				console.log("hello#4");
				
			});   // <-- End of json_huc8
		});   // <-- End of csv
	}
	
	// Set the color of each HUC-8 depending on the mapType (dataName) and sliderYear
	var colorMap = function() {
		console.log("at colorMap");
		
		container.selectAll(".huc8s")
			.attr("fill", calculate_color);
	}
	
	// Adding a legend
	var addLegend = function() {
		console.log("at addLegend");
		
		var legend_labels = ["Dry", ".", ".", ".", ".", ".", ".", ".", "Wet"];

		var legend = svg.selectAll("g.legend")
			.data(color.range())
			.enter()
			.append("g")
			.attr("class", "legend");

		var ls_w = 20, ls_h = 20;

		legend.append("rect")
			.attr("x", 20)
			.attr("y", function(d, i){ return mapHeight - (i*ls_h) - 2*ls_h;})
			.attr("width", ls_w)
			.attr("height", ls_h)
			.style("fill", function(d) { return d; });

		legend.append("text")
			.attr("x", 50)
			.attr("y", function(d, i){ return mapHeight - (i*ls_h) - ls_h - 4;})
			.text(function(d, i){ return legend_labels[i]; });
	}

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
