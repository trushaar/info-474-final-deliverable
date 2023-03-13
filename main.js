// CODE BORROWED AND MODIFIED FROM: https://d3-graph-gallery.com/graph/ridgeline_basic.html

// set the dimensions and margins of the graph
var margin = {top: 60, right: 30, bottom: 40, left:80},
    width = 410 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// define the cities and their associated data files
var cities = [{name: "Seattle", file: "KSEA.csv"}, {name: "Charlotte", file: "CLT.csv"}, {name: "Los Angeles", file: "CQT.csv"}, {name: "Indianapolis", file: "IND.csv"}, {name: "Jacksonville", file: "JAX.csv"}, {name: "Chicago", file: "MDW.csv"}, {name: "Philadelphia", file: "PHL.csv"}, {name: "Phoenix", file: "PHX.csv"}, {name: "Houston", file: "IND.csv"}, {name: "New York", file: "KNYC.csv"}];

// loop through each city and load the corresponding data
cities.forEach(function(city) {
  var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("position", "absolute")
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

  d3.csv("\\data\\" + city.file, function(data) {

  // Get the different categories and count them
  var categories = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  var n = categories.length

  var info = [];
  for (i = 0; i < n; i++) {
    var allTemps = [];
    for (k = 0; k < data.length; k++) {
      if (data[k].date.includes("-"+ (i+1) +"-")) {
        allTemps.push(parseInt(data[k].actual_mean_temp));
      }
    }
    var total = 0;
    var min = 150;
    var max = 0;
    for (j = 0; j < allTemps.length; j++) {
      total += allTemps[j];
      if (allTemps[j] > max) {
        max = allTemps[j];
      }
      if (allTemps[j] < min) {
        min = allTemps[j];
      }
    }
    info[i] = {"avg": Math.round((total/allTemps.length)) /* * 100) / 100*/, "min": min, "max": max};
  }

  // append text for city titles and x-axis
  svg.append("text")
  .text(city.name)
  .attr("font-family", "Montserrat")
  .attr("font-size", "15px")
  .attr("font-weight", "bold")
  .attr("transform", "translate(0, -30)");

  svg.append("text")
   .text("Temperature (\u00b0F)")
   .attr("font-size", "12px")
   .attr("transform", "translate(" + (width/2 - margin.right - 25) + "," + (height+35) + ")")
   .attr("font-family", "Arial");

  // add x axis
  var x = d3.scaleLinear()
    .domain([-10, 110])
    .range([ 0, width ]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // create a y-scale for densities
  var y = d3.scaleLinear()
    .domain([0, 0.05])
    .range([ height, 0]);

  // create the y-axis for names
  var yName = d3.scaleBand()
    .domain(categories)
    .range([0, height])
    .paddingInner(1)
  svg.append("g")
    .call(d3.axisLeft(yName));

  // compute kernel density estimation for each column:
  var kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(100)) // increase this 40 for more accurate density.
  var allDensity = []
  for (i = 0; i < n; i++) {
      key = categories[i]
      density = kde( data.map(function(d) {  
        if (d.date.includes("-"+ (i+1) +"-"))
        return d.actual_mean_temp;
      }) )
      allDensity.push({key: key, density: density})
  }

  // define your color scale
  var colorScale = d3.scaleLinear()
    .domain([0, allDensity.length-1])
    .range(["#D8B5FF", "#1EAE98"]);

  // add areas
  var lines = svg.selectAll("areas")
    .data(allDensity)
    .enter()
    .append("path")
    .attr("transform", function(d){return("translate(0," + (yName(d.key)-height) +")" )})
    .datum(function(d){return(d.density)})
    .attr("fill", function(d, i) { return colorScale(i); })
    .attr("stroke", "#000")
    .attr("opacity", 0.6)
    .attr("stroke-width", 0.7)
    .attr("d",  d3.line()
        .curve(d3.curveBasis)
        .x(function(d) { return x(d[0]); })
        .y(function(d) { return y(d[1]); })
    )
    .attr("id", function(d, i) { return categories[i]; })
    .on('mouseover', function (d, i) {
      d3.selectAll("#"+categories[i]).transition()
        .duration('50')
        .attr('opacity', '0.5');
      d3.selectAll("#"+categories[i]+"-label").transition()
           .duration(50)
           .style("opacity", 1)
    })
    .on('mouseout', function (d, i) {
          d3.selectAll("#"+categories[i]).transition()
              .duration('50')
              .attr('opacity', '0.9');
          d3.selectAll("#"+categories[i]+"-label").transition()
              .duration('50')
              .style("opacity", 0);
    });

  // add hover text
    var labels = svg.selectAll("areas")
      .data(allDensity)
      .enter()
      .append("text")
      .attr("class", "unselectable")
      .attr("id", function(d, i) { return categories[i] + "-label"; })
      .text(function(d, i) { return "Avg: " + info[i].avg + "\u00b0 Min: " + info[i].min + "\u00b0 Max: " + info[i].max + "\u00b0";})
      .attr("transform", function(d){ return("translate(175," + (yName(d.key)-10) +")" )})
      .style("opacity", 0)
      .attr("font-size", "13px")
      .attr("fill", "red")
      .attr("font-family", "Arial");
    });

  // compute kernel density estimation
  function kernelDensityEstimator(kernel, X) {
    return function(V) {
      return X.map(function(x) {
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
      });
    };
  }
  function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  };
}})
