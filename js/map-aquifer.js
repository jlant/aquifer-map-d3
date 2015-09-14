var map = (function(map, $, d3) {
	'use strict'

	// default values
	var mapType = 'btn-precip';
	var sliderYear = '1980';
	var mapChart = undefined;
	var zoom = undefined;
	var svg = undefined;
	var container = undefined;
	var path = undefined;
	var csvFileName_map = undefined;
	var csvFileName_timeseries = undefined;
	var url_map = undefined;
	var url_timeseries = undefined;

	// set width, height, and margin of chart
	var chartW = 390;
	var chartH = 180;
	var chartM = 20;

	// set width and height of svg element (aquifer map)
	var mapWidth = 1100;
	var mapHeight = 700;
	var mapOrigWidth = undefined;
	var multiplier = 1;
	
	// map axes
	var x_map = d3.scale.linear();
	var y_map = d3.scale.linear();
	
	// chart axes
	var x = d3.scale.linear()
		// .domain([0, dataNum.length])
		.range([0 + chartM, chartW - 2*chartM]);

	var y = d3.scale.linear()
		// .domain([0, 10])
		.range([chartH - chartM, 0 + 2*chartM]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickFormat(d3.format("d"));

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
	
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
		whichData();
	});

	$("#btn-et").click(function() {
		$("#btn-precip").removeClass('btn btn-primary');
		$("#btn-precip").addClass('btn btn-default');
		$("#btn-recharge").removeClass('btn btn-primary');
		$("#btn-recharge").addClass('btn btn-default');
		$(this).addClass('btn btn-primary');
		mapType = $(this).attr('id');
		console.log(mapType);
		whichData();
	});

	$("#btn-recharge").click(function() {
		$("#btn-precip").removeClass('btn btn-primary');
		$("#btn-precip").addClass('btn btn-default');
		$("#btn-et").removeClass('btn btn-primary');
		$("#btn-et").addClass('btn btn-default');
		$(this).addClass('btn btn-primary');
		mapType = $(this).attr('id');
		console.log(mapType);
		whichData();
	});
	
	// EVENT: slider bar for map year
	$("#slider-year").slider();
	$("#slider-year").on("slide", function(slideEvt) {
		sliderYear = slideEvt.value;
		$("#sliderValue").text(slideEvt.value);
		$('#chart-header1 .chart-type').text('Year: ' + slideEvt.value);
		whichData();
	});
	
	// EVENT: click event to reset zoom button
	$("#button-reset").click(function() {
		resetZoom();
	});
	
	// function for zoom
	function zoomed() {
		container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}
	
	// function for zoom reset
	function resetZoom() {
		d3.transition().duration(10).tween("zoom", function() {
			var ix = d3.interpolate(x_map.domain(), [-mapWidth / 2, mapWidth / 2]);
			var iy = d3.interpolate(y_map.domain(), [-mapHeight / 2, mapHeight / 2]);
			return function(t) {
				zoom.x(x_map.domain(ix(t))).y(y_map.domain(iy(t)));
				svg.call(zoom.event);
			};
		});
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
		zoom = d3.behavior.zoom()
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
		whichData();
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
		
		$('#chart-title').text('HUC8: ');
		$('#chart-header1 .chart-type').text('Year: ' + sliderYear);
		$('#chart-header2 .chart-type').text('Precipitation, in in/yr');
		
		mapChart = d3.select("#map-aquifer-chart").append("svg")
			.attr('id', 'map-aquifer-chart-svg')
			.attr("width", chartW)
			.attr("height", chartH)
			.append("g")
			.attr("transform", "translate(30,-20)");
		
		mapChart.append("g")
			.attr("class", "x-axis")
			.attr("transform", "translate(0," + (chartH-chartM) + ")")
			.call(xAxis);

		mapChart.append("g")
			.attr("class", "y-axis")
			.attr("transform", "translate(" + chartM + ",0)")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".75em")
			.style("text-anchor", "end")
			.text("ylabel");
		
		mapChart.append("path")
			.attr("class", "chartLineA");
	}
	
	// Populate chart
	var populateChart = function(data_year, data_inyr) {
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
		
		console.log(data_year);
		console.log(data_inyr);
		
		x.domain(d3.extent(data_year));
		y.domain(d3.extent(data_inyr));
		
		mapChart.select(".x-axis")
			.call(xAxis);
		
		mapChart.select(".y-axis")
			.call(yAxis);
		
		var lineData = [];
		for (var i = 0; i < data_year.length; i++) {
			lineData.push({"x": data_year[i], "y": data_inyr[i]});
		}
		console.log(lineData);
		
		var drawLine = d3.svg.line()
			.x(function(d) { return x(d.x); })
			.y(function(d) { return y(d.y); });
		
		mapChart.select(".chartLineA")
			.attr("d", drawLine(lineData));
	}
	
	// Determine which data to load
	var whichData = function() {
		console.log("at whichData");
		
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
		
		csvFileName_map = (dataName + '_' + sliderYear + '.csv');
		console.log(csvFileName_map);
		
		csvFileName_timeseries = ('time-series_' + dataName + '_mean.csv');
		console.log(csvFileName_timeseries);
		
		// path to the SWB model data
		url_map = ('data/' + csvFileName_map);
		console.log(url_map);
		url_timeseries = ('data/' + csvFileName_timeseries);
		
		loadData();
	}

	var loadData = function() {
		console.log("at loadData");
		
		// create projection
		var mapProjection = d3.geo.albersUsa()
			.translate([mapWidth / 15, mapHeight / 2])
			.scale([3000]);

		// create path generator; converts geojson to svg path's ("M 100 100 L 300 100 L 200 300 z")
		path = d3.geo.path()
			.projection(mapProjection);
		
		queue()
			.defer(d3.csv, url_map)   // modelVar
			.defer(d3.csv, url_timeseries)   // modelTS
			.defer(d3.json, "data/conus.json")   // json_conus
			.defer(d3.json, "data/WBD_HUC8_PMAS_sa_Geo.json")   // json_huc8
			.await(drawMap);
		
		function drawMap(error, modelVar, modelTS, json_conus, json_huc8) {
			if (error) { return console.error(error) };
			console.log("hello#1");
			
			// set the input domain for the color scale
			color.domain([
				d3.min(modelVar, function(d) { return parseFloat(d.MEAN); }),
				d3.max(modelVar, function(d) { return parseFloat(d.MEAN); })
				]);

			container.selectAll(".conus-states")
				.data(json_conus.features)
				.enter()
				.append("path")
				.attr("class", "conus-states")
				.attr("d", path)

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
			
			// get the time-series data for the selected HUC8
			console.log(modelTS);
			var hts = $.grep(modelTS, function(obj){return obj.HUC_8 === '02050204';});
			console.log(hts);
			
			var data_year = [];
			var data_inyr = [];
			for(var k in hts[0]) {
				data_year.push(+k);
				data_inyr.push(+hts[0][k]);
			}
			
			// remove the first item of an array
			data_year.shift();
			data_inyr.shift();
			
			console.log(data_year);
			console.log(data_inyr);
			console.log(d3.extent(data_year));
			console.log(d3.extent(data_inyr));
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
			populateChart(data_year, data_inyr);
			colorMap();
			addLegend();
			console.log("hello#4");
		}
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
