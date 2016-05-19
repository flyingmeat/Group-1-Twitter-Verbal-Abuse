
var twitter         = require('twitter'),
    sentiment       = require('sentiment'),
    mysql           = require('mysql'),
    credentials     = require('./credentials.js');

var express = require('express')
    , app = module.exports = express();
var path = require('path');
var bodyPaser = require('body-parser');

var consume = require('./consume.js');
var keywords = require('./keywordUpdate.js');
var updateGroupTotal = require('./updateGroupTotal.js');
var init = require('./init.js');
var elasticSearch = require('./elasticSearch.js');

app.engine('.html', require('ejs').__express);


    app.set( 'x-powered-by', false);
    app.set( 'views', __dirname + '/views' );
    app.set( 'view engine', 'html' );
    app.use( express.static( path.join( __dirname, 'public' ) ) );
    app.use(bodyPaser.urlencoded({
            extended: true
        }));
    
process.on('uncaughtException', function(err) {
  console.log(err);
});

app.get('/', function(req, res){
	consume.connectSQL();
	consume.getTweets();
  	res.render('TwitterTest2', {});
});

app.get('/updateLive', function(req, res, next) {
	res.send(consume.jsonLive);
});

app.get('/updateKey', function(req, res, next) {
	res.send(keywords.jsonKey);
    updateGroupTotal.updateGroupTotal(keywords.jsonKey);
    keywords.setZero();
});

app.get('/updateLine', function(req, res, next) {
    res.send(init.groupLine);
});
app.get('/updateKeyWordBarChart', function(req, res, next) {
    res.send(elasticSearch.relativekeyWord);
});
app.get('/updateHashtags', function(req, res, next) {
    res.send(elasticSearch.topHash);
});
app.get('/updateTopUser', function(req, res, next) {
    res.send(elasticSearch.topUser);
});

app.get('/historyData', function(req, res, next) {
    res.send(elasticSearch.history);
});



app.post('/lineChartClick', function(req, res, next) {
    var timeStamp = new Date(Date.parse(req.body["message"]));
    console.log(timeStamp);
    var stamp = new Date(Date.parse(timeStamp.toString()));
    console.log(stamp);
    elasticSearch.getHistory(stamp.getTime());
    res.send("sucess");
    //res.send(init.groupLine);
});

app.post('/setTimeButton', function(req, res, next) {
    console.log(req.body);
    init.setTimeInterval(req.body["small"], req.body["big"]);
    res.send("sucess");
});


app.post('/barChartClick', function(req, res, next) {
    elasticSearch.updateNow(req.body.set);
    res.send("sucess");
});

app.listen(process.env.PORT || 4000);
