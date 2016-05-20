var relativekeyWord = JSON.stringify([]);
var topHash = JSON.stringify([]);
var topUser = JSON.stringify([]);
var history = JSON.stringify({});
var keyWordSet = ["bitch"];
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'https://search-myelasticsearch-imrb3khz2ybmb4m3nazqmphv4i.us-west-2.es.amazonaws.com/'
  //log: 'trace'
});




function update(tweet) {
	var text = tweet.text;
	var user = tweet.user.name;
	var followers = tweet.user.followers_count;
	var tweet_id = tweet.id_str;
	var createDate = new Date(Date.parse(tweet.created_at));
	client.index({
	    index:'my_index',
	    type:'tweet',
	    id: tweet_id,
	    body:{
	      user: user,
	      content: text,
	      time: createDate.toString(),
	      user_followers: followers
	    }
	  }, function(err, respon) {
	});
	updateHashtag(tweet);
	storeUser(tweet);
}

function updateHashtag(tweet){
  if(tweet.entities.hashtags.length != 0){
    var hashtag = tweet.entities.hashtags;
    for(var h in hashtag){
      client.index({
        index:'my_index',
        type:'hashtags',
        body:{
            text:hashtag[h].text
        }
      });
    }
  }
}

function searchKeyWord(dataSet) {
	var hashMap = formatHashSet(dataSet);
	client.search({
	  index: 'my_index',
	  type: 'tweet',
	  body: {
	        "query": {
	          "filtered": {
	            "filter": {
	              "terms": {
	                "content": dataSet
	              }
	            }
	          }
	        },
	        "aggs": {
	          "most_sig": {
	            "significant_terms": {
	              "field": "content",
	              "size": 50
	        }
	      }
	    }
	  }
	}).then(function (resp) {
		relativekeyWord = JSON.stringify([]);
		var json = JSON.parse(relativekeyWord);
	    var hits = resp.aggregations.most_sig.buckets;
	    var biggest = 0;
		for (var i = 0; i < hits.length; i++) {
			if (i == 0) {
			  biggest = hits[i].score;
			}
			if (hits[i].key in hashMap) {
			  continue;
			}
			var key = hits[i].key;
			var value = hits[i].score / biggest;
			json.push({key: key, value: value});
			key = null;
			value = null;
		}
		relativekeyWord = JSON.stringify(json);
	  	exports.relativekeyWord = relativekeyWord;
	  	json = null;
	  	hits = null;
	}, function (err) {
	    console.trace(err.message);
	});
}

function formatHashSet(data) {
	var hashMap = {};
	data.forEach(function(d) {
		hashMap[d] = 0;
	})
	return hashMap;
}


function getTopHash() {
	client.search({
	    index: 'my_index',
	    type: 'hashtags',
	    body: {
	         "size":0,
	         "aggs":{
	            "top":{
	               "terms":{
	                  "field":"text",
	                  "size":15
	               }
	            }
	        }
	    }
	}).then(function(resp) {
		var hits = resp.aggregations.top.buckets;
		topHash = JSON.stringify([]);
		var json = JSON.parse(topHash);
		for (var i = 0; i < hits.length; i++) {
			var key = hits[i].key;
			var value = hits[i].doc_count;
			json.push({key: key, value: value});
		}
		topHash = JSON.stringify(json);
		exports.topHash = topHash;
		hits = null;
		json = null;

	}, function (err) {
	    console.trace(err.message);
	});
}


function storeUser(tweet){
  var user_id = tweet.user.id_str;
  var tweets = tweet.text;
  var screen_name = tweet.user.screen_name;
  var followerCount = tweet.user.followers_count;
  var content = [tweets];

  client.exists({
    index: 'my_index',
    type: 'users',
    id: user_id
  }, function (error, exists) {
    if (exists === true) {
      client.search({
        index: 'my_index',
        type: 'users',
        id:user_id,
        body: {
          query: {
            "match_all": {}
          }
        }
      }).then(function(d){
        var result = d.hits.hits[0]["_source"].content;
        result.push(tweets);
        client.update({
          index: 'my_index',
          type: 'users',
          id: user_id,
          body: {
              // ut the partial document under the `doc` key
              doc: {
                content: result,
                contentlength: result.length
              }
          }});
        result = null;
      });
    } else {
      client.index({
        index:'my_index',
        type:'users',
        id: user_id,
        body:{
          user:screen_name,
          content:[tweets],
          contentlength:content.length // 存的时候也带上数组长度
        }
      });
    }
  });
}

function getTopUser() {

  client.search({
    index: 'my_index',
    type: 'users',
    body: {
      "query" : {
          "match_all": {}
      },
      "sort": [
        {"follower":{"order" : "desc" , "ignore_unmapped" : true}}
    ]
    }
  	}).then(function(resp) {
  		var hits = resp.hits.hits;
  		topUser = JSON.stringify([]);
  		var json = JSON.parse(topUser);
	    for (var variable in hits) {
	      var user = hits[variable]["_source"].user;
	      var number = hits[variable]["_source"].contentlength;
	      var tweets = hits[variable]["_source"].content;
	      json.push({key: user, value: number, tweets: tweets});
	    }
	    topUser = JSON.stringify(json);
	    exports.topUser = topUser;
	    hits = null;
	    json = null;
  	}, function (err) {
	    console.trace(err.message);
	});
}



function updateBigInterval(dateTime, abusiveWord, topHashtag, topUser, bigInterval) {
	var deleteDate = new Date(Date.parse(dateTime));
	deleteDate.setSeconds(deleteDate.getSeconds() - bigInterval * 60);


	client.index({
		index:'another_index',
		type:'BigInterval',
		id: dateTime,//1000就是每秒存一次，60000就是每一分钟存一次了
		body:{
		  abusiveWord:abusiveWord,    //这里换成这一分钟之内统计的结果的json
		  topHashtag:topHashtag,                                //这里换成这一分钟之内统计的结果的json
		  topUser:topUser                                    //这里换成这一分钟之内统计的结果的json
		}
	});
	client.delete({
		index:'another_index',
		type:'BigInterval',
		id: deleteDate.getTime() //这里是分钟数减去20分钟，意思就是删除20min以前的数据
	});
}

function getHistory(dateTime) {
	client.get({
      index:'another_index',
      type:'BigInterval',
      id: dateTime
    }, function(error, resp) {
    	history = formatJson(resp["_source"]);
    	exports.history = history;
    });
}




function formatJson(data) {
    var json = JSON.stringify([]);
    jsonObj = JSON.parse(json);
    var abusive = JSON.parse(data["abusiveWord"]);
    var hashtag = JSON.parse(data["topHashtag"]);
    var topUser = JSON.parse(data["topUser"]);
    jsonObj.push({abusiveWord: abusive});
    jsonObj.push({topHashtag: hashtag});
    jsonObj.push({topUser: topUser});
    return JSON.stringify(jsonObj);
    
}




function deleteIndex(){
  client.indices.delete({
    index: 'my_index',
    body: {
      query: {
        "match_all":{}
      }
    }
  });
}



function updateJson() {
	setInterval(function() {
		getTopHash();
		searchKeyWord(keyWordSet);
		getTopUser();
	}, 10000);
}

function updateNow(dataSet) {
	keyWordSet = [];
	dataSet.forEach(function(d) {
		keyWordSet.push(d);
	});
	searchKeyWord(keyWordSet);
}

exports.deleteIndex = deleteIndex;
exports.updateBigInterval = updateBigInterval;
exports.getHistory = getHistory;

exports.relativekeyWord = relativekeyWord;
exports.history = history;
exports.topHash = topHash;
exports.topUser = topUser;
exports.update = update;
exports.updateJson = updateJson;
exports.updateNow = updateNow;
exports.keyWordSet = keyWordSet;