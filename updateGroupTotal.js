
var groupTotal = JSON.stringify(
	[
		{"Group": "Women", "value": 0},
		{"Group": "Black", "value": 0},
		{"Group": "Homosexual", "value": 0},
		{"Group": "Different_regions", "value": 0},
		{"Group": "Body_form", "value": 0},
		{"Group": "General", "value": 0}
	]
);


var historyKey = JSON.stringify(
	[	
		{
			"Group" : "Women", 
			"set" : [
			{"key":"Women", "value":0},
			{"key":"beeyotch","value":0},
			{"key":"biatch","value":0},
			{"key":"bitch","value":0},
			{"key":"cunt","value":0},
			{"key":"dyke","value":0},
			{"key":"gash","value":0},
			{"key":"lesbo","value":0},
			{"key":"pussy","value":0},
			{"key":"shemale","value":0},
			{"key":"skank","value":0},
			{"key":"slut","value":0},
			{"key":"tits","value":0},
			{"key":"titt","value":0},
			{"key":"whore","value":0}
			]
		},
		{
			"Group" : "Black", 
			"set" : [
			{"key":"Black","value":0},
			{"key":"golliwog","value":0},
			{"key":"negro","value":0},
			{"key":"nigga","value":0},
			{"key":"nigger","value":0},
			{"key":"pickaninny","value":0},
			{"key":"spade","value":0},
			{"key":"spook","value":0}
			]
		},
		{
			"Group" : "Homosexual", 
			"set" : [
			{"key":"Homosexual","value":0},
			{"key":"dyke","value":0},
			{"key":"fag","value":0},
			{"key":"lesbo","value":0},
			{"key":"homo","value":0}
			]
		},
		{
			"Group" : "Different_regions", 
			"set" : [
			{"key":"Different_regions","value":0},
			{"key":"chinaman","value":0},
			{"key":"chinamen","value":0},
			{"key":"dago","value":0},
			{"key":"daygo","value":0},
			{"key":"dego","value":0},
			{"key":"gook","value":0},
			{"key":"jap","value":0},
			{"key":"kike","value":0},
			{"key":"kraut","value":0},
			{"key":"paki","value":0},
			{"key":"raghead","value":0},
			{"key":"spic","value":0},
			{"key":"wetback","value":0},
			{"key":"wop","value":0}
			]
		},
		{
			"Group" : "Body_form", 
			"set" : [
			{"key":"Body_form","value":0},
			{"key":"crip","value":0},
			{"key":"fatass","value":0},
			{"key":"gimp","value":0},
			{"key":"fatso","value":0},
			{"key":"lame","value":0},
			{"key":"lardass","value":0},
			{"key":"trannies","value":0},
			{"key":"tranny","value":0}
				]
		},
		{
			"Group" : "General",
			"set" : [
			{"key":"General","value":0},
			{"key":"dick","value":0},
			{"key":"douchebag","value":0},
			{"key":"gyp","value":0},
			{"key":"hooker","value":0},
			{"key":"retard","value":0},
			{"key":"tard","value":0},
			{"key":"twat","value":0},
			{"key":"wetback","value":0},
			{"key":"wop","value":0}
			]
		}
	]
	);


function updateGroupTotal(data) {
	historyAbusiveWords(data);
	var keyData = JSON.parse(data);
	var json = JSON.parse(groupTotal);
	for (var i = 0; i < keyData.length; i++) {
		json[i]["value"] += keyData[i]["set"][0]["value"];
	}
	groupTotal = JSON.stringify(json);
	exports.groupTotal = groupTotal;
}

function historyAbusiveWords(data) {
	var keyData = JSON.parse(data);
	var json = JSON.parse(historyKey);
	for (var i = 0; i < keyData.length; i++) {
		for (var j = 0; j < keyData[i]["set"].length; j++) {
			json[i]["set"][j]["value"] += keyData[i]["set"][j]["value"];
		}
	}
	historyKey = JSON.stringify(json);
	exports.historyKey = historyKey;
}


function setHistoryGroupZero() {
	var json = JSON.parse(historyKey);
	for (var i = 0; i < json.length; i++) {
		for (var j = 0; j < json[i]["set"].length; j++) {
			json[i]["set"][j]["value"] = 0;
		}
	}
	historyKey = JSON.stringify(json);
}


function setGroupZero() {
	var json = JSON.parse(groupTotal);
	for (var i = 0; i < json.length; i++) {
		json[i]["value"] = 0;
	}
	groupTotal = JSON.stringify(json);
}

exports.setHistoryGroupZero = setHistoryGroupZero;
exports.historyAbusiveWords = historyAbusiveWords;
exports.updateGroupTotal = updateGroupTotal;
exports.setGroupZero = setGroupZero;