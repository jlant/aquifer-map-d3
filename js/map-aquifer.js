var map = (function(map, $, d3) {
	'use strict'

	// default values
	var mapType = 'btn-precip';
	var sliderYear = '1980';
	var mouseoverHUC8 = '05010002';
	var meanValuePOR = undefined;
	var color = d3.scale.quantize().range([1,2,3,4,5,6,7,8,9]);
	var mapChart = undefined;
	var legend = undefined;
	var zoom = undefined;
	var svg = undefined;
	var container = undefined;
	var path = undefined;
	var csvFileName_map = undefined;
	var csvFileName_timeseries = undefined;
	var url_map = undefined;
	var url_timeseries = undefined;
	var url_por = undefined;

	// set width, height, and margin of chart
	var chartW = 390;
	var chartH = 200;
	var chartM = 20;

	// set width and height of svg element (aquifer map)
	var mapWidth = 0;
	var mapHeight = 0;
	var mapOrigWidth = undefined;
	var multiplier = 1;
	
	// map axes
	var x_map = d3.scale.linear();
	var y_map = d3.scale.linear();
	
	// chart axes
	var x = d3.scale.linear()
		.range([0 + chartM, chartW - 2*chartM]);

	var y = d3.scale.linear()
		.range([chartH - chartM, 0 + 2*chartM]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickFormat(d3.format("d"));

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
	
	// tooltip
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
			return '#808080'; // gray
		}
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
		console.log("at initMap");
		
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
		
		// draw bounding box (to allow larger pan extent instead of just the states; pan needs drawn elements to grab)
		d3.json("data/boundingBox.json", function(error, json_boundingBox) {
			if (error) return console.warn(error);
			
			// bind the data and create one path for each geojson feature
			container.selectAll(".bounding-box")
				.data(json_boundingBox.features)
				.enter()
				.append("path")
				.attr("class", "bounding-box")
				.attr("d", path);
		});
		
		initData();
	}
	
	var initData = function() {
		console.log("at initData");
		
		setDimensions();
		resizeMap();
		
		$(window).resize(function() {
			setDimensions();
			resizeMap();
		});
		
		generateChart();
		generateLegend();
		whichData();
		$('#map-aquifer').css('height', 'auto')
	}
	
	var setDimensions = function() {
		// mapWidth = $(window).width();
		mapWidth = $('#map-aquifer').width();
		console.log(mapWidth);
		
		if(mapWidth < 1200) {
			multiplier = 0.63;
		}
		else {
			multiplier = 0.63;
		}
		mapHeight = mapWidth * multiplier;
		
		if(mapOrigWidth == undefined){
			mapOrigWidth = mapWidth;
		}
	}
	
	var resizeMap = function() {
		d3.select("#map-aquifer-svg")
				.attr("width", mapWidth)
				.attr("height", mapHeight);
			
		container.attr("transform", 'scale(' + mapWidth/mapOrigWidth + ')');
	}
	
	// Generate chart
	var generateChart = function() {
		console.log("at generateChart");
		
		$('#chart-title').text('HUC8: ');
		$('#chart-header1 .chart-type').text('Year: ' + sliderYear);
		$('#chart-header2 .chart-type').text('Precipitation, in in/yr');
		
		mapChart = svg.selectAll("#map-aquifer-chart")
			.data([0])
			.enter()
			.append("g")
			.attr("id", "map-aquifer-chart");
		
		mapChart.append("rect")
			.attr("x", 1)
			.attr("y", 10)
			.attr("width", 395)
			.attr("height", 195)
			.attr("class", "chart-rect")
			.style("fill", "white");
		
		mapChart = d3.select("#map-aquifer-chart").append("svg")
			.attr('id', 'map-aquifer-chart-svg')
			.attr("width", chartW)
			.attr("height", chartH)
			.append("g")
			.attr("transform", "translate(30,-20)");
		
		mapChart.append("g")
			.attr("class", "x-axis")
			.attr("transform", "translate(0," + (chartH-chartM) + ")")
			.call(xAxis)
			.append("text")
			.attr("class", "x-label")
			.attr("text-anchor", "end")
			.attr("x", 195)
			.attr("y", 35)
			.text("Year");

		mapChart.append("g")
			.attr("class", "y-axis")
			.attr("transform", "translate(" + chartM + ",0)")
			.call(yAxis)
			.append("text")
			.attr("class", "y-label")
			.attr("transform", "rotate(-90)")
			.attr("x", -90)
			.attr("y", -35)
			.style("text-anchor", "end")
			.text("in/yr");
		
		mapChart.append("path")
			.attr("class", "chartLineTS");
		
		mapChart.append("path")
			.attr("class", "chartLineMean");
		
		mapChart.append("circle")
			.attr("class", "chartPoint");
	}
	
	// Generate legend
	var generateLegend = function() {
		console.log("at generateLegend");
		
		var ls_w = 20, ls_h = 20;
		
		legend = svg.selectAll(".legend")
			.data(color.range())
			.enter()
			.append("g")
			.attr("class", "legend");

		legend.append("rect")
			.attr("x", 20)
			.attr("y", function(d, i){ return mapHeight - (i*ls_h) - 2*ls_h;})
			.attr("width", ls_w)
			.attr("height", ls_h)
			.attr("class", "legend-rect");

		legend.append("text")
			.attr("x", 50)
			.attr("y", function(d, i){ return mapHeight - (i*ls_h) - ls_h - 4;})
			.attr("class", "legend-text");
	}
	
	// Determine which data to load
	var whichData = function() {
		console.log("at whichData");
		
		// Set dataName and color range based on mapType
		var dataName = '';
		if( mapType == 'btn-precip'){
			dataName = 'precip';
			color.range(colorbrewer.RdYlBu[9]);
			url_por = 'data/precip_1980-2011.csv';
		}
		else if( mapType == 'btn-et'){
			dataName = 'et';
			color.range(colorbrewer.YlOrRd[9]);
			url_por = 'data/et_1980-2011_w_0s.csv';
		}
		else if( mapType == 'btn-recharge'){
			dataName = 'recharge';
			color.range(colorbrewer.YlGnBu[9]);
			url_por = 'data/recharge_1980-2011_w_0s.csv';
		}
		
		// Construct fileName for .csv data file
		csvFileName_map = (dataName + '_' + sliderYear + '.csv');
		console.log(csvFileName_map);
		
		csvFileName_timeseries = ('time-series_' + dataName + '_mean.csv');
		console.log(csvFileName_timeseries);
		
		// path to the SWB model data
		url_map = ('data/' + csvFileName_map);
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
			.defer(d3.csv, url_por)   // modelPOR
			.defer(d3.json, "data/conus.json")   // json_conus
			.defer(d3.json, "data/PMAS_model_boundary_Geo.json")   // json_boundary
			.defer(d3.json, "data/WBD_HUC8_PMAS_sa_Geo.json")   // json_huc8
			.await(drawMap);
		
		function drawMap(error, modelVar, modelTS, modelPOR, json_conus, json_boundary, json_huc8) {
			if (error) { return console.error(error) };
			console.log("hello#1");
			
			// set the input domain for the color scale
			color.domain([
				d3.min(modelVar, function(d) { return parseFloat(d.MEAN); }),
				d3.max(modelVar, function(d) { return parseFloat(d.MEAN); })
				]);

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
			
			// merge the modelPOR mean and geojson
			for (var i = 0; i < modelPOR.length; i++) {

				// get the HUC8 name
				var modelPOR_HUC8 = modelPOR[i].HUC_8;

				// get the modelPOR mean and convert from string to float
				var modelPOR_mean = parseFloat(modelPOR[i].MEAN);

				// find the corresponding HUC8 inside the geojson
				for (var j = 0; j < json_huc8.features.length; j++) {

					// get the json HUC8 name
					var json_HUC_8 = json_huc8.features[j].properties.HUC_8;

					if (modelPOR_HUC8 === json_HUC_8) {

						// copy the modelPOR values into the json
						json_huc8.features[j].properties.modelPOR_mean = modelPOR_mean;

						// stop looking through the geojson
						break;
					}
				}	
			}
			
			// get the period of record (POR) mean for the selected HUC-8
			var hucTemp = $.grep(json_huc8.features, function(obj){return obj.properties.HUC_8 === mouseoverHUC8;});
			var meanValuePOR = hucTemp[0].properties.modelPOR_mean;
			
			// get the time-series data for the selected HUC-8
			var hts = $.grep(modelTS, function(obj){return obj.HUC_8 === mouseoverHUC8;});
			var data_year = [];
			var data_inyr = [];
			for(var k in hts[0]) {
				data_year.push(+k);
				data_inyr.push(+hts[0][k]);
			}
			
			// remove the NaN data pair (depending on the browser, not necessarily the first item in the array)
			for(var i in data_year) {
				if(isNaN(data_year[i])) {
					data_year.splice(i,1);
					data_inyr.splice(i,1);
				}
			}
			
			console.log(d3.extent(data_year));
			console.log(d3.extent(data_inyr));
			console.log("hello#2");
			
			// bind the data and create one path for each geojson feature
			container.selectAll(".huc8s-fill")
				.data(json_huc8.features)
				.enter()
				.append("path")
				.attr("class", "huc8s-fill")
				.attr("d", path);
			
			// bind the data and create one path for each geojson feature
			container.selectAll(".conus-states")
				.data(json_conus.features)
				.enter()
				.append("path")
				.attr("class", "conus-states")
				.attr("d", path);
			
			// bind the data and create one path for each geojson feature
			container.selectAll(".model-boundary")
				.data(json_boundary.features)
				.enter()
				.append("path")
				.attr("class", "model-boundary")
				.attr("d", path);
			
			// bind the data and create one path for each geojson feature
			container.selectAll(".huc8s-outline")
				.data(json_huc8.features)
				.enter()
				.append("path")
				.attr("class", "huc8s-outline")
				.attr("d", path);
			
			// mouse events
			container.selectAll(".huc8s-outline")
				.data(json_huc8.features)
				.on("mouseover", function(d) {
					mouseoverHUC8 = d.properties.HUC_8;
					meanValuePOR = d.properties.modelPOR_mean;
					d3.select(this)
						.transition().duration(10)
						.attr("stroke-width", 3);
					getHUC8data(modelTS, mouseoverHUC8, meanValuePOR);
				})
				.on("mouseout", function(d) {
					d3.select(this)
						.transition().duration(10)
						.attr("stroke-width", 1)
					tooltip_HUC8.style("visibility", "hidden");
				})
				.on("click", function(d) {
					var format = d3.format("0.1f");
					tooltip_HUC8.style("visibility", "visible")
						.style("top", (d3.event.pageY + 10) + "px")
						.style("left", (d3.event.pageX + 10) + "px")
						.html("HUC8: " + d.properties.HUC_8 + "<br>" +
							"______________" + "<br>" +
							"Year: " + sliderYear + "<br>" +
							"Max: " + format(d.properties.modelVar_max) + " in/yr" + "<br>" +
							"Mean: " + format(d.properties.modelVar_mean) + " in/yr" + "<br>" +
							"Min: " + format(d.properties.modelVar_min) + " in/yr" + "<br>" +
							"______________" + "<br>" +
							"Year: 1980-2011" + "<br>" +
							"Mean: " + format(d.properties.modelPOR_mean) + " in/yr");
				})
				.on("mousemove", function() {
					tooltip_HUC8.style("top", (d3.event.pageY + 10) + "px")
						.style("left", (d3.event.pageX + 10) + "px");
				});
			
			console.log("hello#3");
			populateChart(mouseoverHUC8, data_year, data_inyr, meanValuePOR);
			colorMap();
			populateLegend();
			console.log("hello#4");
		}
	}
	
	// Get the time series data for the HUC8 on mouseover
	var getHUC8data = function(modelTS, mouseoverHUC8, meanValuePOR) {
		console.log("at getHUC8data");
		console.log(mouseoverHUC8);
		console.log(meanValuePOR);
		
		// get the time-series data for the selected HUC8
		var hts = $.grep(modelTS, function(obj){return obj.HUC_8 === mouseoverHUC8;});
		var data_year = [];
		var data_inyr = [];
		for(var k in hts[0]) {
			data_year.push(+k);
			data_inyr.push(+hts[0][k]);
		}
		
		// remove the NaN data pair (depending on the browser, not necessarily the first item in the array)
		for(var i in data_year) {
			if(isNaN(data_year[i])) {
				data_year.splice(i,1);
				data_inyr.splice(i,1);
			}
		}
		
		populateChart(mouseoverHUC8, data_year, data_inyr, meanValuePOR);
	}
	
	// Populate chart
	var populateChart = function(mouseoverHUC8, data_year, data_inyr, meanValuePOR) {
		console.log("at populateChart");
		
		var chartLabel = '';
		if( mapType == 'btn-precip'){
			chartLabel = 'Precipitation, in in/yr';
			y.domain([0, 90]);   // min: 26.5, max: 88.2
		}
		else if( mapType == 'btn-et'){
			chartLabel = 'Evapotranspiration, in in/yr';
			y.domain([0, 45]);   // min: 18.7, max: 42.8
		}
		else if( mapType == 'btn-recharge'){
			chartLabel = 'Recharge, in in/yr';
			y.domain([0, 24]);   // min: 1.4, max: 24.6
		}
		$('#chart-title').text('HUC8: ' + mouseoverHUC8);
		$('#chart-header1 .chart-type').text('Year: ' + sliderYear);
		$('#chart-header2 .chart-type').text(chartLabel);
		
		x.domain(d3.extent(data_year));
		// y.domain(d3.extent(data_inyr));
		
		mapChart.select(".x-axis")
			.call(xAxis);
		
		mapChart.select(".y-axis")
			.call(yAxis);
		
		var lineData = [];
		for (var i = 0; i < data_year.length; i++) {
			lineData.push({"x": data_year[i], "y": data_inyr[i]});
		}
		
		var drawLine = d3.svg.line()
			.x(function(d) { return x(d.x); })
			.y(function(d) { return y(d.y); });
		
		mapChart.select(".chartLineTS")
			.attr("d", drawLine(lineData));
		
		var linePORmean = [{"x": 1980, "y": meanValuePOR}, {"x": 2011, "y": meanValuePOR}];
 
		mapChart.select(".chartLineMean")
			.attr("d", drawLine(linePORmean));
		
		updatePoint(lineData);
	}
	
	// Update point on plot
	var updatePoint = function(lineData) {
		console.log("at updatePoint");
		
		var dataXY = $.grep(lineData, function(obj){return obj.x === parseInt(sliderYear);});
		
		mapChart.select(".chartPoint")
			.attr("cx", x(dataXY[0].x))
			.attr("cy", y(dataXY[0].y))
			.attr("r", 2)
			.attr("stroke", "black")
			.attr("fill", "black");
	}
	
	// Set the color of each HUC-8 depending on the mapType (dataName) and sliderYear
	var colorMap = function() {
		console.log("at colorMap");
		
		container.selectAll(".huc8s-fill")
			.attr("fill", calculate_color);
	}
	
	// Populate legend
	var populateLegend = function() {
		console.log("at populateLegend");
		
		console.log(color.domain());
		
		// color
		legend = svg.selectAll(".legend-rect")
			.data(color.range())
			.style("fill", function(d) { return d; });
		
		// text
		legend = svg.selectAll(".legend-text")
			.data(color.range())
			.text(function(d) {
				var legend_label = color.invertExtent(d);
				var format = d3.format("0.1f");
				return format(+legend_label[0]) + " \u2013 " + format(+legend_label[1]);
			});
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
