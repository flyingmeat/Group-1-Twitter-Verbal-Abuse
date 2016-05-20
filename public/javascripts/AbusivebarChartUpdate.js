var isFilter = false;
var filterSet = {};

function AbusivebarChartUpdate() {

    var fallDown = {"Women" : true, "Black" : false, "Homosexual" : true, "Different_regions" : true, "Body_form" : true, "General" : true};
    var settings = {};
    var keyWordUpdate = {};
    var setup = function (targetID ,times, rawHeight) {
        var margin = {top: 0, right: 0, bottom: 0, left: 0},
            width = 250 - margin.left - margin.right,
            height = rawHeight - margin.top - margin.bottom,
            categoryIndent = 4*15 + 5,
            defaultBarWidth = 2000;
        var x = d3.scale.linear()
                .domain([0, defaultBarWidth])
                .range([0, width]);
        var y = d3.scale.ordinal()
                .rangeRoundBands([0, height * times], 0.1, 0);
        //Create SVG element
        d3.select(targetID).selectAll("svg").remove()
        var svg = d3.select(targetID).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height * times)
        // .append("g")
        .attr("transform", "translate(" + margin.left + "," +  margin.top + ")");
        var settings = {
            margin:margin, width:width, height:height, categoryIndent:categoryIndent,
            svg:svg, x:x, y:y, times : times
        }
        return settings;
    };
        
    var renderChart = function(settings, newData) {
        var margin = settings.margin, width = settings.width, height = settings.height, categoryIndent = settings.categoryIndent, svg = settings.svg, x = settings.x, y = settings.y;
        var times = settings.times;
        var yMap = {};
        var eachGroup = {};
        var y0 = [];
        var y0Band = [];
        var y1 = [];
        
        var barMax = d3.max(newData, function(e) {
            return d3.max(e.set, function(ele) {
                return ele.value; 
            });
        });
        x.domain([0, barMax]);
        
        newData.forEach(function(d, i) {
            var count = 0;
            for (var j = 0; j < i; j++) {
                count += newData[j].set.length;
            }
            y0[i] = count * 20 + i * 30;
        });
        
        for(var i = 0; i < y0.length; i++) {
            if (i < y0.length - 1) {
                y0Band[i] = y0[i + 1] - y0[i];
            }
            else {
                y0Band[i] = height * times - y0[i];   
            }
            
        }
        
        
        newData.forEach(function(d, i) {
            d.set.forEach(function(ele, i) {
                ele.name = d.Group;
                ele.index = i;
            })
            eachGroup[d.Group] = d.set;
            yMap[d.Group] = d3.scale.ordinal()
                    .rangeRoundBands([0, y0Band[i]], 0.1, 0);
            yMap[d.Group].domain(d.set.sort(function(a, b) {
                    if (b.index == 0) {
                        return 1;
                    }
                    else if (a.index == 0) {
                        return -1;
                    }
                    return b.value - a.value;
                }).map(function(dat) {
                    return dat.key;
                }));
            
            if (i > 0) {
                if (fallDown[newData[i - 1].Group]) {
                    y1[i] = y1[i - 1] + y0Band[i - 1] + 20;
                }
                else {
                    y1[i] = y1[i - 1] + yMap[d.Group].rangeBand() + 20;
                }
            }
            else {
                y1[0] = y0[0];
            }
        });
        

        var group = svg.selectAll(".group")
                    .data(newData);
        group.enter().append("g")
                .attr("class", "group")
                .attr("id", function(d) { return d.Group;})
                .attr("transform", function(d, i) {
                    return "translate(0," + y1[i] + ")";
                });
        //console.log(group);
        var chartGroup = group.selectAll(".chartGroup")
            .data(function(d) { return d.set});
        var chartRow = chartGroup.enter().append("g")
            .attr("class", "chartGroup")
            .attr("transform", "translate(0," + height + margin.top + margin.bottom + ")");

        //console.log(chartGroup);
         chartRow.append("rect")
                .attr("class", "barRow")
                .attr("x", function(d, i) {
                    if (i != 0) {
                        return 10;
                    }
                    else {
                        return 0;
                    }
                })
                .attr("opacity", 0)
                .attr("height", function(d, i) {return yMap[d.name].rangeBand();})
                .attr("width", function(d) { return x(d.value);})
                .attr("text", function(d){return d.key;})
                .on("mouseover", function(d) {
                    d3.select(this).style("fill", "#ccc");
                })
                .on("mouseout", function(d) {
                    d3.select(this).style("fill", "#eaeaea")
                }).on("click", function(d, i) {
                    clickItem(newData, i, d.name, d3.select(this).attr("text"));
                });
        //Add value Label
 
        chartRow.append("text")
        .attr("class", "labelRow label")
        .attr("x", function(d, i) {
                    if (i != 0) {
                        return 10;
                    }
                    else {
                        return 0;
                    }
                })
        .attr("y", function(d, i) {return yMap[d.name].rangeBand()/2;})
        .attr("opacity", 0)
        .attr("dy",".35em")
        .attr("dx","0.5em")
        .text(function(d){return d.value;});

        // //Add Headlines
         chartRow.append("text")
         .attr("class","category categoryRow")
         .attr("text-overflow","ellipsis")
         .attr("y", function(d, i) {return yMap[d.name].rangeBand()/2;})
         .attr("x",categoryIndent)
         .attr("opacity",0)
         .attr("dy",".35em")
         .attr("dx","0.5em")
         .text(function(d){return d.key})
         .on("mouseover", function(d) {
            d3.select(this).style("fill", "#ccc")
        })
        .on("mouseout", function(d) {
            d3.select(this).style("fill", "#666666")
        })
        .on("click", function(d, i) {
            clickItem(newData, i, d.name, d3.select(this).text());
        });

        //  //////////
        // //UPDATE//
        // //////////


        // //Update bar widths
         chartGroup.select(".barRow").transition()
         .duration(100)
         .attr("width", function(d) { return x(d.value);})
         .attr("opacity",function(d, i) {
             if (fallDown[d.name] || i == 0) {
                 return 1;
             }
             else {
                 return 0;
             }
         });

        // //Update data labels
         chartGroup.select(".label").transition()
         .duration(100)
         .attr("opacity",function(d, i) {
             if (fallDown[d.name] || i == 0) {
                 return 1;
             }
             else{
                 return 0;
             }
         })
         .tween("text", function(d) { 
         var i = d3.interpolate(+this.textContent.replace(/\,/g,''), +d.value);
         return function(t) {
           this.textContent = Math.round(i(t));
         };
         });

        // //Fade in categories
         chartGroup.select(".category").transition()
         .duration(100)
         .attr("opacity",function(d, i) {
             if (fallDown[d.name] || i == 0) {
                 return 1;
             }
             else{
                 return 0;
             }
         });

        // ////////
        // //EXIT//
        // ////////

        // //Fade out and remove exit elements
         chartGroup.exit().transition()
         .style("opacity","0")
         .attr("transform", "translate(0," + (height + margin.top + margin.bottom) + ")")
         .remove();


        // ////////////////
        // //REORDER ROWS//
        // ////////////////

         var delay = function(d, i) { return i * 30; };

        chartGroup.transition()
            .delay(delay)
            .duration(400)
            .attr("transform", function(d, i){ 
            //console.log(d);
            return "translate(0," + yMap[d.name](d.key) + ")"; });
        group.transition()
            .delay(delay)
            .duration(400)
            .attr("transform", function(d, i) {
            return "translate(0," + y1[i] + ")";
            });
        //select first element
        for (var i = 0; i < chartGroup.length; i++) {
            var first = d3.select(chartGroup[i][0]);
            //console.log(first);
            var circle = first.append("circle")
            .attr("cx", 200)
            .attr("cy", yMap[newData[i].Group].rangeBand()/2)
            .attr("r", 8)
            .style("fill",  function(d) {
                    if (fallDown[newData[i].Group]) {
                        return "#404040";
                    }
                    else {
                        return "#cc6600";
                    }
                });
            circle.on("click", function(d, i) {
                var change = fallDown[d.name];
                fallDown[d.name] = !change;
                d3.select(this).style("fill",  function(d) {
                    if (fallDown[newData[i].Group]) {
                        return "#404040";
                    }
                    else {
                        return "#cc6600";
                    }
                });
                renderChart(settings, newData);
                change = null;
            })
        }
        
        margin = null;
        width = null;
        height = null;
        categoryIndent = null;
        svg = null;
        x = null;
        y = null;
        barMax = null;
        times = null;
        yMap = null;
        eachGroup = null;
        y1 = null;
        group = null;
        chartGroup = null;
        chartRow = null;
    };
        
    var formatData = function(newData) {
        newData.forEach(function(d, k) {
            d.set.sort(function(a, b) {
                if (b.index == 0) {
                        return 1;
                    }
                    else if (a.index == 0) {
                        return -1;
                    }
                return b.value - a.value; 
            });
        });
        return newData;
    }
        
    var pullData = function(settings,callback){

         $.ajax({
            url: '/updateKey',
            dataType: 'json',
            complete: function(data) {
                //jsonData = data.responseText;
                if (data.statusText == "OK") {
                    //console.log(data);
                    var newData = data.responseJSON;
                    //newData = formatData(newData);
                    callback(settings,newData);
                    newData = null;
                }
                
            }
        });

    };
    this.drawChart = function() {
        pullData(settings,renderChart);
    }        
    this.start = function(ID, times, height, rawkeyWordUpdate) {
        keyWordUpdate = rawkeyWordUpdate;
        var redraw = function(settings){
            pullData(settings,renderChart);
        }
        //setup (includes first draw)
        settings = setup(ID, times, height);
        redraw(settings)
        //Repeat every 1.5 seconds
        setInterval(function(){
            redraw(settings)
        }, 5000);    
    }
    function clickItem(newData, index, group, key) {
        message = {};
        message["set"] = [];
        filterSet = [];
        isFilter = true;
        if (index == 0) {
            newData.forEach(function(d) {
                if (d.Group == group) {
                    for (var i = 1; i < d.set.length; i++) {
                        filterSet[d.set[i].key] = 0;
                        message["set"].push(d.set[i].key);
                    }
                }
            });
            $(".Status-Live-content").html("Filter: "+ group);
            $(".Choose-content").html(group);
        }
        else {
            filterSet[key] = 0;
            message["set"].push(key);
            $(".Status-Live-content").html("Filter: " + key);
            $(".Choose-content").html(key);
        }
        sendClickData(message);
        setTimeout(function(d) {
            $.ajax({
            url: '/updateKeyWordBarChart',
            dataType: 'json',
            complete: function(data) {
                //jsonData = data.responseText;
                if (data.statusText == "OK") {
                    var newData = data.responseJSON;
                    keyWordUpdate.redrawNow(newData)
                }
                
            }
        });
        }, 500);
    }
    function sendClickData(message) {

        console.log(message);
        $.ajax({
            type: 'POST',
            data: message,
            url: '/barChartClick',
            complete: function(data) { 
                console.log(data);
            }
          });
    }
}