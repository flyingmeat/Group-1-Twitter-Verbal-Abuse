function UserBarChartUpdate(){
    var color = "odd";
    var setup = function (targetID, times, rawHeight) {
        var margin = {top: 0, right: 0, bottom: 0, left: 0},
            width = 220 - margin.left - margin.right,
            height = rawHeight - margin.top - margin.bottom,
            categoryIndent = 6*15 + 5,
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
        .append("g")
        .attr("transform", "translate(" + margin.left + "," +       margin.top + ")");
        var settings = {
            margin:margin, width:width, height:height, categoryIndent:categoryIndent,
            svg:svg, x:x, y:y
        }
        return settings;
    };
    var renderChart = function(settings, newData) {
        var margin = settings.margin, width = settings.width, height = settings.height, categoryIndent = settings.categoryIndent, svg = settings.svg, x = settings.x, y = settings.y;
        y.domain(newData.sort(function(a, b) {
            return b.value - a.value;
        }).map(function(data) {
            return data.key;
        }));
        var barMax = d3.max(newData, function(e) {
            return e.value;
        });
        x.domain([0, barMax]);

        /////////
        //ENTER//
        /////////
        
        
        var chartRow = svg.selectAll("g.chartRow")
        .data(newData, function(ele) { return ele.key;});
        
        var newRow = chartRow
                .enter()
                .append("g")
                .attr("class", "chartRow")
                .attr("transform", "translate(0," + height + margin.top + margin.bottom + ")");
        
        newRow.insert("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("opacity", 0)
        .attr("text", function(d){return d.key;})
        .attr("height", y.rangeBand())
        .attr("width", function(d) { return x(d.value);})
        .on("mouseover", function(d) {
            d3.select(this).style("fill", "#ccc");
        })
        .on("mouseout", function(d) {
            d3.select(this).style("fill", "#eaeaea")
        }).on("click", function(d, i) {
            clickItem(newData, d3.select(this).attr("text"));
        });
        //Add value Label
        newRow.append("text")
        .attr("class","label")
        .attr("y", y.rangeBand()/2)
        .attr("x",0)
        .attr("opacity",0)
        .attr("dy",".35em")
        .attr("dx","0.5em")
        .text(function(d){return d.value;}); 
        
        //Add Headlines
        newRow.append("text")
        .attr("class","category")
        .attr("text-overflow","ellipsis")
        .attr("y", y.rangeBand()/2)
        .attr("x",categoryIndent)
        .attr("opacity",0)
        .attr("dy",".35em")
        .attr("dx","0.5em")
        .attr("text", function(d){return d.key;})
        .text(function(d){return ("@" + d.key)})
        .on("mouseover", function(d) {
            d3.select(this).style("fill", "#ccc");
        })
        .on("mouseout", function(d) {
            d3.select(this).style("fill", "#666666")
        }).on("click", function(d, i) {
            clickItem(newData, d3.select(this).attr("text"));
        });
        
        //////////
        //UPDATE//
        //////////
        
        
        //Update bar widths
        chartRow.select(".bar").transition()
        .duration(100)
        .attr("width", function(d) { return x(d.value);})
        .attr("opacity",1);

        //Update data labels
        chartRow.select(".label").transition()
        .duration(100)
        .attr("opacity",1)
        .tween("text", function(d) { 
        var i = d3.interpolate(+this.textContent.replace(/\,/g,''), +d.value);
        return function(t) {
          this.textContent = Math.round(i(t));
        };
        });

        //Fade in categories
        chartRow.select(".category").transition()
        .duration(100)
        .attr("opacity",1);
        
        ////////
        //EXIT//
        ////////

        //Fade out and remove exit elements
        chartRow.exit().transition()
        .style("opacity","0")
        .attr("transform", "translate(0," + (height + margin.top + margin.bottom) + ")")
        .remove();

        
	////////////////
	//REORDER ROWS//
	////////////////

	var delay = function(d, i) { return i * 30; };

	chartRow.transition()
		.delay(delay)
		.duration(400)
		.attr("transform", function(d){ return "translate(0," + y(d.key) + ")"; });

    };
    
    var pullData = function(settings,callback, number){
        /*d3.json("/Json/abusiveWords.json", function (err, data){
            if (err) return console.warn(err);

            var newData = data;

            newData = formatData(newData, number);

            callback(settings,newData);
        })*/

        $.ajax({
            url: '/updateTopUser',
            dataType: 'json',
            complete: function(data) {
                //jsonData = data.responseText;
                if (data.statusText == "OK") {
                    var newData = data.responseJSON;
                    newData = formatData(newData, number);
                    callback(settings,newData);
                }
                
            }
        });


    }    
    //Sort data in descending order and take the top 10 values
    var formatData = function(data, number){
        return data.sort(function (a, b) {
            return b.value - a.value;
          })
        .slice(0, number);
          
    }
    this.start = function(ID, number, times, height) {
        var redraw = function(settings){
            pullData(settings,renderChart, number);
        }
        //setup (includes first draw)
        var settings = setup(ID, times, height);
        redraw(settings)
        //Repeat every 1.5 seconds
        setInterval(function(){
            redraw(settings)
        }, 30000);    
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



}