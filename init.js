var updateGroup = require('./updateGroupTotal.js');
var elasticSearch = require('./elasticSearch.js');
var keywords = require('./keywordUpdate.js');
var groupLine = JSON.stringify(
		{
			"start" : 0, "end" : 0, "step" : 0,
			"Groups" :[
		        {
		            "Group" : "Women",
		            "data" : []
		        },
		        {
		            "Group" : "Black",
		            "data" : []
		        },
		        {
		            "Group" : "Homosexual",
		            "data" : []
		        },
		        {
		            "Group" : "Different_regions",
		            "data" : []
		        },
		        {
		            "Group" : "Body_form",
		            "data" : []
		        },
		        {
		            "Group" : "General",
		            "data" : []
		        }
		    ]}
);
var step;
var bigTimeInterval;
function init(startDate, endDate, rawStep, newbigTimeInterval) {
	step = rawStep;
	bigTimeInterval = newbigTimeInterval;
	var json = JSON.parse(groupLine);
	json["start"] = startDate;
	json["end"] = endDate;
	json["step"] = step;
	for (var i = 0; i < json["Groups"].length; i++) {
		json["Groups"][i]["data"] = initData(bigTimeInterval * 60 / step + 1);
	}
	groupLine = JSON.stringify(json);
	exports.groupLine = groupLine;
	json = null;
	setInterval(function() {
		var endDate = pushNewData();
		var endTime = new Date(Date.parse(endDate.toString())); 
		elasticSearch.updateBigInterval(endTime.getTime(), updateGroup.historyKey, elasticSearch.topHash, elasticSearch.topUser, bigTimeInterval);


		updateGroup.setHistoryGroupZero();
		updateGroup.setGroupZero();
		elasticSearch.deleteIndex();
		var endDate = null;
		var endTime = null;
	}, step * 1000);
	setInterval(function() {
		updateGroup.updateGroupTotal(keywords.jsonKey);
    	keywords.setZero();
	}, 15000);
}

function initData(number) {
	var data = [];
	for (var i = 0; i < number; i++) {
		data.push(0.1);
	}
	return data;
}

function pushNewData() {
	var groups = JSON.parse(updateGroup.groupTotal);
	var json = JSON.parse(groupLine);

	var startDate = new Date(Date.parse(json["start"]));
	var endDate = new Date(Date.parse(json["end"]));

	for (var i = 0; i < json["Groups"].length; i++) {
		json["Groups"][i]["data"].shift();
		json["Groups"][i]["data"].push(groups[i]["value"]);
	}
	startDate.setSeconds(startDate.getSeconds() + json["step"]);
	endDate.setSeconds(endDate.getSeconds() + json["step"]);
	json["start"] = startDate.toString();
	json["end"] = endDate.toString();
	groupLine = JSON.stringify(json);
	exports.groupLine = groupLine;
	return json["end"];
}

function setSmallTime(time) {
	step = time;
}


function setTimeInterval(newStep, newbigTimeInterval) {
	if (newStep == undefined || bigTimeInterval == undefined) {
		return;
	}
	step = newStep * 60;
	bigTimeInterval = newbigTimeInterval;
	var number = bigTimeInterval * 3600 / step + 1;
	var json = JSON.parse(groupLine);
	json["step"] = step;
	var endDate = new Date(Date.parse(json["end"]));
	var newStartDate = new Date(Date.parse(json["end"]));
	newStartDate.setHours(newStartDate.getHours() - bigTimeInterval);
	json["start"] = newStartDate.toString();
	json["end"] = endDate.toString();
	for (var i = 0; i < json["Groups"].length; i++) {
		while (json["Groups"][i]["data"].length < number) {
			json["Groups"][i]["data"].unshift(0.1);
		}
		while (json["Groups"][i]["data"].length > number) {
			json["Groups"][i]["data"].shift();
		}
	}
	groupLine = JSON.stringify(json);
	exports.groupLine = groupLine;
}

exports.setTimeInterval = setTimeInterval;
exports.groupLine;
exports.init = init;
exports.setSmallTime = setSmallTime;