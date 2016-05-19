var color = "odd";
var set = [];
var startDate;
var endDate;
var time = [];
var x, xAxis, y, yAxis, lines, line, graph, transitionDelay, tickFormatForLogScale, timeStep;
var width, height;
var jsonData;

function displayGraph(id, newwidth, newheight, interpolation, animate, updateDelay, newtransitionDelay, newjsonData, Xoffset, Yoffset) {
  var padding = {y : 50, x: 50};
  transitionDelay = newtransitionDelay;
  // create an SVG element inside the #graph div that fills 100% of the div
  height = newheight - 28;
  width = newwidth;
  jsonData = newjsonData;
  var color = ["green","orange","red","darkred","blue","darkyellow"];
  var container = document.querySelector(id);
  var formatNumber = d3.format(",.0f") // for formatting integers
  tickFormatForLogScale = function(d) { return formatNumber(d) };

  var hoverLineXOffset = Xoffset;
  var hoverLineYOffset = Yoffset;

  graph = d3.select(id)
  .append("svg:svg")
  .attr("class", "lines")
  .attr("width", "100%")
  .attr("height", "100%");

  console.log(jsonData);
  timeStep = jsonData.step;
  startDate = new Date(Date.parse(jsonData.start));
  endDate = new Date(Date.parse(jsonData.end));
  time = [startDate, endDate]; 
  var displayName = [];
  var legendFontSize = 12;
   
           
  jsonData.Groups.forEach(function(d) {
    set.push(d.data);
    displayName.push(d.Group);
  });

  var yMax = findMax(set);
  var yMin = findMin(set);
           
  x = d3.time.scale().domain([startDate, endDate]).range([0, width - 50]);
  xAxis = d3.svg.axis().scale(x).tickFormat(d3.time.format("%H:%M:%S")).tickSize(-height);
  y = d3.scale.pow().domain([yMin, yMax + 100]).range([height, 20]);
  yAxis = d3.svg.axis().scale(y).ticks(4, tickFormatForLogScale).orient("right").tickSize(-width);
           
  line = d3.svg.line()
  .x(function(d,i) { 
  // verbose logging to show what's actually being done
  //console.log('Plotting X value for data point: ' + d + ' using index: ' + i + ' to be at: ' + x(i) + ' using our xScale.');
  // return the X coordinate where we want to plot this datapoint

  var xPosition = new Date(startDate.toString());
  xPosition.setSeconds(xPosition.getSeconds() + i * timeStep);
  return x(xPosition);
  })
  .y(function(d) { 
  // return the Y coordinate where we want to plot this datapoint
  if (d == 0) {
    return y(0.1);
  }
  return y(d); 
  })
  .interpolate(interpolation);
  var yXpoi = width - 50;           
  graph.append("svg:g")
    .attr("class", "y-axis")
    .attr("transform", "translate(" + yXpoi + ",0)")
    .call(yAxis);

  graph.append("svg:g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
           
                      
  lines = graph.selectAll(".line")
              .data(set)
              .enter().append("g")
              .attr("class", "line"); 
  lines.append("path")
      .attr("class", "moveLine")
      .attr("id", function(d, i) { return i;})
      .style("stroke", function(d, i) {
          return color[i];
      })
      .attr("d", function(d, i) {return line(d);});
     
           
           
           
           
  //___________________//

  var hoverLineGroup = graph.append("svg:g")
    .attr("class", "hover-line");
  // add the line to the group
  hoverLine = hoverLineGroup
    .append("svg:line")
    .attr("x1", 10).attr("x2", 10) // vertical line so same value on each
    .attr("y1", 0).attr("y2", height); // top to bottom	

  // hide it by default
  hoverLine.style("opacity", 0);

           
  //_____________________//

  var legendLabelGroup = graph.append("svg:g")
    .attr("class", "legend-group")
    .selectAll("g")
    .data(displayName)
    .enter().append("g")
    .attr("class", "legend-labels");
  legendLabelGroup.append("svg:text")
    .attr("class", "legend name")
    .text(function(d, i) {
      return d;
    })
    .style("stroke", function(d, i) {
          return color[i];
      })
    .attr("font-size", legendFontSize)
    .attr("y", function(d, i) {
      return height+28;
    })
    .attr("x", function(d, i) {
      return width - i * 60 - 50;
    });

  legendLabelGroup.append("svg:text")
    .attr("class", "legend value")
    .attr("font-size", legendFontSize)
    .attr("y", function(d, i) {
      return height+28;
    });

  //___________________//
  var displayValueLabelsForPositionX = function(xPosition, withTransition) {
    var animate = false;
    if(withTransition != undefined) {
      if(withTransition) {
        animate = true;
      }
    }
    var index;
    var dateToShow;
    var labelValueWidths = [];
    graph.selectAll("text.legend.value")
      .text(function(d, i) {
    var valuesForX = getValueForPositionXFromData(xPosition, i);
    index = valuesForX.index;
    //dateToShow = valuesForX.date;
      return valuesForX.value;
    })
    .attr("x", function(d, i) {
      labelValueWidths[i] = this.getComputedTextLength();
    })

		// position label names
		var cumulativeWidth = 0;
		var labelNameEnd = [];
		graph.selectAll("text.legend.name")
				.attr("x", function(d, i) {
					// return it at the width of previous labels (where the last one ends)
					var returnX = cumulativeWidth;
					// increment cumulative to include this one + the value label at this index
					cumulativeWidth += this.getComputedTextLength()+4+labelValueWidths[i]+8;
					// store where this ends
					labelNameEnd[i] = returnX + this.getComputedTextLength()+5;
					return returnX;
				})

		// remove last bit of padding from cumulativeWidth
		cumulativeWidth = cumulativeWidth - 8;

		if(cumulativeWidth > width) {
			// decrease font-size to make fit
			legendFontSize = legendFontSize-1;
			//debug("making legend fit by decreasing font size to: " + legendFontSize)
			graph.selectAll("text.legend.name")
				.attr("font-size", legendFontSize);
			graph.selectAll("text.legend.value")
				.attr("font-size", legendFontSize);
			
			// recursively call until we get ourselves fitting
			displayValueLabelsForPositionX(xPosition);
			return;
		}

		// position label values
		graph.selectAll("text.legend.value")
		.attr("x", function(d, i) {
			return labelNameEnd[i];
		})
		// show the date

		// move the group of labels to the right side
		if(animate) {
			graph.selectAll("g.legend-group g")
				.transition()
				.duration(transitionDuration)
				.ease("linear")
				.attr("transform", "translate(" + (width-cumulativeWidth) +",0)")
		} else {
			graph.selectAll("g.legend-group g")
				.attr("transform", "translate(" + (width-cumulativeWidth) +",0)")
		}
    return index;
	}
	
        
        
  var getValueForPositionXFromData = function(xPosition, dataSeriesIndex) {
		var d = set[dataSeriesIndex];
		
		// get the date on x-axis for the current location
		var xValue = x.invert(xPosition);
		// Calculate the value from this date by determining the 'index'
		// within the data array that applies to this value
		var index = (xValue/*.getTime()*/ - startDate) / timeStep/1000;
		if(index >= d.length) {
			index = d.length-1;
		}
		// The date we're given is interpolated so we have to round off to get the nearest
		// index in the data array for the xValue we're given.
		// Once we have the index, we then retrieve the data from the d[] array
		index = Math.round(index);
        //console.log(time[0] + jsonData.step * index);
		// bucketDate is the date rounded to the correct 'step' instead of interpolated
		//var bucketDate = new Date(data.startTime.getTime() + data.step * (index+1)); // index+1 as it is 0 based but we need 1-based for this math
				
		var v = d[index];

		//var roundToNumDecimals = data.rounding[dataSeriesIndex];

		return {
            value: v,
            index: index
            //,date: bucketDate
    };
	}
     
     //___________________//
     
     

  setInterval(function() {
    $.ajax({
      url: '/updateLine',
      dataType: 'json',
      complete: function(data) {
          //jsonData = data.responseText;
          if (data.statusText == "OK") {
            jsonData = data.responseJSON;
            startDate = new Date(Date.parse(jsonData.start));
            endDate = new Date(Date.parse(jsonData.end));
            if (time[0].toString() != startDate.toString()) {
              time[0] = startDate;
              time[1] = endDate;
              for (var i = 0; i < set.length; i++) {
                set[i].shift();
                set[i].push(jsonData.Groups[i].data[jsonData.Groups[i].data.length - 1]);
              }
              redrawWithAnimation();
            }
            
          }

      }
    });
  }, updateDelay);
           
  $(container).mouseleave(function(event) {
     handleMouseOutGraph(event);
  });
  $(container).mousemove(function(event) {
    //console.log(event);
     handleMouseOverGraph(event);
  });
  $(container).click(function(event) {
    //console.log(event);
     handleMouseClickGraph(event);
  });
           
           
           
  var handleMouseOverGraph = function(event) {
      var mouseX = event.pageX-hoverLineXOffset;
      var mouseY = event.pageY-hoverLineYOffset;
      if(mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
           var index = displayValueLabelsForPositionX(mouseX)
          // show the hover line
          hoverLine.style("opacity", 1);
          // set position of hoverLine
          var xPosition = new Date(startDate.toString());
          xPosition.setSeconds(xPosition.getSeconds() + timeStep * index);
          hoverLine.attr("x1", x(xPosition)).attr("x2", x(xPosition));

          // user is interacting
          userCurrentlyInteracting = true;
          currentUserPositionX = mouseX;
      } else {
          // proactively act as if we've left the area since we're out of the bounds we want
          handleMouseOutGraph(event)
      }
  }
  var handleMouseOutGraph = function(event) {	
      // hide the hover-line
      hoverLine.style("opacity", 0);

      //setValueLabelsToLatest();

      //debug("MouseOut graph [" + containerId + "] => " + mouseX + ", " + mouseY)

      // user is no longer interacting
      userCurrentlyInteracting = false;
  }
           
          
           
           
  var handleMouseClickGraph = function(event) {
      var mouseX = event.pageX-hoverLineXOffset;
      var mouseY = event.pageY-hoverLineYOffset;
     if(mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
         var d = set[0];
         var xValue = x.invert(mouseX);
         var index = (xValue/*.getTime()*/ - startDate) / timeStep/1000;
          if(index >= d.length) {
              index = d.length-1;
          }
          index = Math.round(index);
          var xPostion = new Date(startDate.toString());
          xPostion.setSeconds(startDate.getSeconds() + timeStep * index);
          console.log(xPostion);
          var timeStamp = xPostion;
          var message = {};
          message.message = timeStamp;

          document.getElementById("history-title").innerHTML = xPostion.toString();

          $.ajax({
            type: 'POST',
            data: message,
            url: '/lineChartClick',
            complete: function(data) {
          
              }
          });

          passMessage();
     }
  }
           
           
           
           
           
           
  
       
           
            // var TO = false;
            // $(window).resize(function(){
            //     if(TO !== false)
            //         clearTimeout(TO);
            //     TO = setTimeout(handleWindowResizeEvent, 200); // time in miliseconds
            // });
}


function redrawWithAnimation() {


    yMax = findMax(set);
    yMin = findMin(set);
    y = d3.scale.pow().domain([yMin, yMax + 10]).range([height, 20]); 
    yAxis = d3.svg.axis().scale(y).ticks(4, tickFormatForLogScale).orient("right").tickSize(-width);

    graph.selectAll(".y-axis")
      .transition()
      .duration(200)
      .ease("linear")
      .call(yAxis);




    x = d3.time.scale().domain([startDate, endDate]).range([0, width - 50]);
    xAxis = d3.svg.axis().scale(x).tickFormat(d3.time.format("%H:%M:%S")).tickSize(-height);    
    graph.selectAll(".x-axis")
        .transition()
    .duration(200)
    .ease("linear")
    .call(xAxis);
    // update with animation
    var xPosition = new Date(startDate.toString());
    xPosition.setSeconds(xPosition.getSeconds() + timeStep);
    lines.selectAll(".moveLine")
      .attr("transform", "translate(" + x(xPosition) + ")") // set the transform to the right by x(1) pixels (6 for the scale we've set) to hide the new value
      .attr("d", function(d, i) { return line(d);}) // apply the new data values ... but the new value is hidden at this point off the right of the canvas
      .transition() // start a transition to bring the new value into view
      .ease("linear")
      .duration(transitionDelay) // for this demo we want a continual slide so set this to the same as the setInterval amount below
      .attr("transform", "translate(" + x(startDate) + ")"); // animate a slide to the left back to x(0) pixels to reveal the new value
       
  }

function redrawWithAnimationNow() {


    yMax = findMax(set);
    yMin = findMin(set);
    y = d3.scale.pow().domain([yMin, yMax + 10]).range([height, 20]); 
    yAxis = d3.svg.axis().scale(y).ticks(4, tickFormatForLogScale).orient("right").tickSize(-width);

    graph.selectAll(".y-axis")
      .transition()
      .duration(200)
      .ease("linear")
      .call(yAxis);




    x = d3.time.scale().domain([startDate, endDate]).range([0, width - 50]);
    xAxis = d3.svg.axis().scale(x).tickFormat(d3.time.format("%H:%M:%S")).tickSize(-height);    
    graph.selectAll(".x-axis")
        .transition()
    .duration(200)
    .ease("linear")
    .call(xAxis);
    // update with animation
    lines.selectAll(".moveLine")
      .attr("d", function(d, i) { return line(d);}) // apply the new data values ... but the new value is hidden at this point off the right of the canvas
      .transition() // start a transition to bring the new value into view
      //.ease("linear")
      .duration(transitionDelay) // for this demo we want a continual slide so set this to the same as the setInterval amount below
      //.attr("transform", "translate(" + x(startDate) + ")"); // animate a slide to the left back to x(0) pixels to reveal the new value
       
  }


function passMessage() {
  setTimeout(function() {
    $.ajax({
      url: '/historyData',
      dataType: 'json',
      complete: function(data) {
          if (data.statusText == "OK") {
            drawHistory(data.responseJSON);
          }
        }
      });
  }, 600);
}

function drawHistory(data) {
  drawBarchart("#history-Women",data[0]["abusiveWord"][0]["set"], 300, 200);
  drawBarchart("#history-Black",data[0]["abusiveWord"][1]["set"], 300, 200);
  drawBarchart("#history-Homosexual",data[0]["abusiveWord"][2]["set"], 300, 200);
  drawBarchart("#history-Different_regions",data[0]["abusiveWord"][3]["set"], 300, 200);
  drawBarchart("#history-Body_form",data[0]["abusiveWord"][4]["set"], 300, 200);
  drawBarchart("#history-General",data[0]["abusiveWord"][5]["set"], 300, 200);
  drawBarchart("#history-hashtag",data[1]["topHashtag"], 300, 150);
  drawBarchart("#history-user",data[2]["topUser"], 300, 150);
  document.getElementById("history").style.opacity = 1;
  document.getElementById("history").style.top = "200px";
  document.getElementById("history").style.left = "200px";
}
function drawBarchart(id, data, rawWidth, rawHeight) {
            var margin = {top: 10, right: 10, bottom: 50, left: 40},
                width = rawWidth - margin.left - margin.right,
                height = rawHeight - margin.top - margin.bottom;

            var x = d3.scale.ordinal()
                .rangeRoundBands([0, width], .1);

            var y = d3.scale.linear()
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");
            d3.select(id).selectAll("svg").remove();
            var svg = d3.select(id).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            y.domain([0, d3.max(data, function(d) { return d.value;})]);
            x.domain(data.map(function(d) { return d.key; }));
            
            svg.append("g")
              .attr("class", "history-x history-axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis)
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start");

            var Y = svg.append("g")
              .attr("class", "history-y history-axis")
              .call(yAxis)
            .append("text")
              .attr("transform", "rotate(-45)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end");
            
            if (id == "#history-user") {
                Y.text("followers");
            }
            else {
                Y.text("value");   
            }
            
            svg.selectAll(".history-bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "history-bar")
                .attr("x", function(d) { return x(d.key); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d.value); })
                .attr("height", function(d) { return height - y(d.value); })
                .attr("text", function(d) {
                  return d.key;
                })
                .on("click", function(d, i) {
                   clickItem(data, d3.select(this).attr("text"));
                 });
            
        }

function findMin(set) {
  var min = set[0][0];
  set.forEach(function(d, i) {
      var localMin = d3.min(d);
      if (min >= localMin) {
          min = localMin;
      }
  });
  if (min == 0) {
    return 0.1;
  }
  return min;
}
function findMax(set) {
  var max = 0;
  set.forEach(function(d, i) {
      var localMax = d3.max(d);
      if (max < localMax) {
          max = localMax;
      }
  });
  return max;
}

function clickItem(newData, name) {
        newData.forEach(function(d) {
            if (d.key == name) {
                createDraggable(d.tweets, name);
            }
        })
    }
function createDraggable(data, num) {
            var newWindow = document.createElement("div");
            newWindow.className = "tweets panel panel-default";
            newWindow.id = num;
            newWindow.style.position = "absolute";
            
            var closeBut = document.createElement("button");
            closeBut.className = "btn btn-warning close-button";
            closeBut.innerHTML = "close";
            closeBut.style.position = "absolute";
            closeBut.style.top = "2px";
            closeBut.style.left = "2px";
            closeBut.onclick = function(){
                close(num);
            };
            
            newWindow.appendChild(closeBut);
            
            var panelHead = document.createElement("div");
            panelHead.className = "panel-heading";
            panelHead.innerHTML = num;
            
            var panelBody = document.createElement("div");
            panelBody.className = "panel-body tweets-panel";
            
            newWindow.appendChild(panelHead);
            newWindow.appendChild(panelBody);
            
            var uL = document.createElement("ul");
            uL.className = "tweets-List";
            panelBody.appendChild(uL);
            data.forEach(function(d) {
               var newList = document.createElement("li");
                newList.className = decideColor();
                newList.id = "tweets-List-element";
                var content = document.createElement("p");
                content.innerHTML = d;
                newList.appendChild(content);
                uL.appendChild(newList);
                
            });
            newWindow.style.opacity = "visible";
            document.getElementById("main").appendChild(newWindow);
            $(".tweets").draggable();
        }
        
        
function close(id) {
    console.log($("#" + id));
    $("#" + id).remove();
}
function decideColor() {
    if (color == "even") {
        color = "odd";
        return "odd";
    }
    else {
        color = "even";
        return "even";
    }
}











function updateLineChart() {
  this.updateLine = function (id, width, height, Xoffset, Yoffset) {
    setTimeout(function() {
      $.ajax({
        url: '/updateLine',
        dataType: 'json',
        complete: function(data) {
            //jsonData = data.responseText;
            if (data.statusText == "OK") {
                displayGraph(id, width, height, "linear", true, 2000, 200, data.responseJSON, Xoffset, Yoffset);
            }

        }
      });
    }, 1000);
  }

  this.reSet = function(number) {
    $.ajax({
      url: '/updateLine',
      dataType: 'json',
      complete: function(data) {
          //jsonData = data.responseText;
          if (data.statusText == "OK") {
            jsonData = data.responseJSON;
            startDate = new Date(Date.parse(jsonData.start));
            endDate = new Date(Date.parse(jsonData.end));
            timeStep = jsonData.step;
              time[0] = startDate;
              time[1] = endDate;

              for (var i = 0; i < set.length; i++) {
                while (set[i].length < number) {
                  set[i].unshift(0.1);
                }
                while (set[i].length > number) {
                  set[i].shift();
                }
                console.log(set[i].length);
              }
              redrawWithAnimationNow();
            
            
          }

      }
    });
  }

  

}






