function updateLive() {
        var color = "odd";
        var hover = false;
        var isLive = true;
        function liveStreamUpdate(data) {
            var container = document.getElementById("container");
            var parent = document.getElementById("liveList");
            var newItem = createNewItem(data);
            newItem.style.visibility = "hidden";
            //------------------------//            
            var $firstElement = $(parent).find('li:first');
            $(newItem).insertBefore($firstElement);
            var orginHeight = $(newItem).height();
            var color = $(newItem).css("background");
            $(newItem).mouseover(function() {
                newItem.style.background = "rgba(90,79,109,.3)";
                hover = true;
            });
            $(newItem).mouseleave(function() {
                newItem.style.background = color;
                hover = false;
            });




            newItem.style.height = "0px";
            newItem.style.visibility = "visible";
            $(newItem).animate({
                height : orginHeight
            }, 40, function(){});



            var totalHeight = 0;
            $(parent).children().each(function(i, d) {
                if (i != $(parent).find('li:last').index) {
                    totalHeight += $(d).height();    
                }
            });
            var $lastElement = $(parent).find('li:last');
            if (totalHeight >= $(container).height()) {
                $lastElement.remove();
            }



            
        }
        this.backToLive = function() {
            var parent = document.getElementById("liveList");
            $(parent).empty();
            var newItem = createNewItem();
            $(parent).append(newItem);
            isLive = true;
            isFilter = false;
            $(".Status-Live-content").html("Live");
        }
        function createNewItem(data) {
            var user;
            var text;
            var keywordSet = [];
            if (data == undefined) {
                user = "";
                text = "";
            }
            else {
                user = data.user;
                text = data.text;
                keywordSet = data.keyWordSet;
            }
            var newItem = document.createElement("li");
            var spanPart1 = document.createElement("p");
            spanPart1.innerHTML = user;
            
            var spanPart2 = document.createElement("p");
            spanPart2.innerHTML = text;
            
            newItem.appendChild(spanPart1);
            newItem.appendChild(spanPart2);
            
            newItem.className = decideColor();
            keywordSet.forEach(function(d) {
                highlightSearch(newItem, d);
            });

            return newItem;
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
        this.update = function() {
            setInterval(function() {
                if (isLive) {    
                    if (!hover) {
                        $.ajax({
                            url: '/updateLive',
                            dataType: 'json',
                            complete: function(data) {
                                //jsonData = data.responseText;
                                if (data.statusText == "OK") {
                                    if (isFilter) {
                                        if (checkFilter(data.responseJSON.keyWordSet)) {
                                            liveStreamUpdate(data.responseJSON);        
                                        }
                                    }
                                    else {
                                        liveStreamUpdate(data.responseJSON);
                                    }
                                }
                            }
                        });
                    }
                }
            }, 1500);
        }
        function highlightSearch(id, text) {
            var query = new RegExp("(\\b" + text + "\\b)", "gim");
            var e = $(id).children()[1].innerHTML;
            var enew = e.replace(/(<span>|<\/span>)/igm, "");
            $(id).children()[1].innerHTML = enew;
            var newe = enew.replace(query, "<span>$1</span>");
            $(id).children()[1].innerHTML = newe;
        }
        function checkFilter(data) {
            for (var i = 0; i < data.length; i++) {
                if (data[i] in filterSet) {
                    return true;
                }
            }
            return false;
        }
    }