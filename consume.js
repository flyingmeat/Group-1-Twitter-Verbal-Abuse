var credentials = require('./credentials.js');
var twitter = require('twitter');
var sentiment = require('sentiment');
var mysql = require('mysql');
var fs = require('fs');
var path = require('path');
var updateKeyword = require('./keywordUpdate.js')
var init = require('./init.js');
var elasticSearch = require('./elasticSearch.js');

var jsonLive = {};
var isInit = false;


process.on('uncaughtException', function(err) {
  console.log(err);
});

var client = mysql.createConnection({
  host: 'us-cdbr-iron-east-03.cleardb.net',
  user: credentials.mysql_username,
  password: credentials.mysql_password,
  database: credentials.mysql_database,
  charset: 'utf8mb4'
});

function connectSQL() {
  //client.connect();
  //client.query('DELETE FROM tweet WHERE 1');
}

var t = new twitter({
  consumer_key: credentials.consumer_key,
  consumer_secret: credentials.consumer_secret,
  access_token_key: credentials.access_token_key,
  access_token_secret: credentials.access_token_secret
});


function parseTwitterDate($stamp) {    
  var date = new Date(Date.parse($stamp));
  var output = date.getUTCFullYear() + '-' + ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' + date.getUTCDate() + ' ' + ('00' + date.getUTCHours()).slice(-2) + ':' + ('00' + date.getUTCMinutes()).slice(-2) + ':' + ('00' + date.getUTCSeconds()).slice(-2);
  return output;
}


function parseTweet(tweet) {

  if ( tweet.lang == 'en' )  { // sentiment module only works on English
  var tweet_id = tweet.id_str;

  var tweet_text = tweet.text;
  var created_at = parseTwitterDate(tweet.created_at);

  var user_id = tweet.user.id_str;
  var screen_name = tweet.user.screen_name;
  var name = tweet.user.name;
  var profile_image_url = tweet.user.profile_image_url;
  var retweets = 0;
  if (tweet.retweeted_status) {
    retweets = tweet.retweeted_status.retweet_count;
  }
  //----------------------------------------------------------------//
  /* 
  sentiment(tweet.text, function (err, result) { 
    // console.log(tweet.text);
    // console.log(result.score);
    var sentiment_score = result.score
    client.query(
      'INSERT INTO tweet ' +
      'SET tweet_id = ?, tweet_text = ?, created_at = ?, user_id = ?, screen_name = ?, name = ?, profile_image_url = ?, sentiment_score = ?, retweets = ?',
      [tweet_id, tweet_text, created_at, user_id, screen_name, name, profile_image_url, sentiment_score, retweets]
    );
  });

  //  delete old tweets
  client.query( 'DELETE FROM tweet WHERE created_at <  (NOW() + interval 24 hour )' );
*/
//-------------------------------------------------------------//
  elasticSearch.update(tweet);
  if (!isInit) {
    var step = 60 * 10;
    var startDate = new Date(Date.parse(tweet.created_at));
    var endDate = new Date(Date.parse(tweet.created_at));
    startDate.setSeconds(startDate.getSeconds() - step);
    endDate.setSeconds(endDate.getSeconds() - step);
    startDate.setMinutes(startDate.getMinutes() - 120);
    init.init(startDate.toString(), endDate.toString(), step, 120);
    elasticSearch.updateJson();
    isInit = true;
  }
  updateKeyword.keywordUpdate(tweet_text);
  updateLive(tweet);


  }
}


function updateLive(data) {
  jsonLive = JSON.stringify({
    user : data.user.name,
    text : data.text,
    keyWordSet : updateKeyword.keywordSet
  });

  exports.jsonLive = jsonLive;
}


function getTweets() {
  t.stream('statuses/filter', 
    {track: "beeyotch,biatch,bitch,chinaman,chinamen,chink,crip,cunt,dago,daygo,dego,dick,douchebag,dyke,fag,fatass,fatso,gash,gimp,golliwog,gook,gyp,homo,hooker,jap,kike,kraut,lame,lardass,lesbo,negro,nigga,nigger,paki,pickaninny,pussy,raghead,retard,shemale,skank,slut,spade,spic,spook,tard,tits,titt,trannies,tranny,twat,wetback,whore,wop"},
     function(stream) {
//  t.stream('statuses/sample', function(stream) {
    stream.on('data', function (tweet) {
      parseTweet(tweet);
    });
    stream.on('error', function(tweet) {
      parseTweet(tweet);
    });
    stream.on('end', function(response) {
      console.error("End:");
      //console.error(response);
      stream.destroy();
      getTweets();
    });
  });
}

exports.connectSQL = connectSQL;
exports.getTweets = getTweets;

