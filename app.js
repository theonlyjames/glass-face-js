/**
 * Module dependencies.
 */

var routes = require('./routes');
var user = require('./routes/user');

var express = require('express')
    , https = require('https')
    , http = require('http')
    , fs = require('fs')
    , googleapis = require('googleapis')
    , OAuth2Client = googleapis.OAuth2Client;

var privateKey = fs.readFileSync('keys/privatekey.pem').toString();
var certificate = fs.readFileSync('keys/certificate.pem').toString();

var options = {
	key: privateKey,
	cert: certificate
};

// from generated file 
var path = require('path');

// pubnub
var pubnub = require("pubnub").init({
    publish_key: 'pub-c-ffcc3163-7fa4-419e-b464-52fcefdd15d9',
    subscribe_key: 'sub-c-b2d0c1d8-952b-11e3-8d39-02ee2ddab7fe'
});

var pubnubInfo = "init info";
pubnub.subscribe({
    channel: 'control_channel',
    message: function(m){
        console.log(m)
        //res.write(m);
        //res.end();
        pubnubInfo = m;
        if(!oauth2Client.credentials) {
            return;
        }
        gotToken("updateActorCard");
    }
});

// Use environment variables to configure oauth client.
// That way, you never need to ship these values, or worry
// about accidentally committing them
var oauth2Client = new OAuth2Client('351258191267-0aipltcfjq2nt8ltr6uvis11k6pvnqhg.apps.googleusercontent.com',
    '_P-mmzG0zcmf6U3aeYKcQwgb', 'https://ec2-54-193-84-38.us-west-1.compute.amazonaws.com:8080/oauth2callback');

var app = express();

// all environments
//app.set('port', 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
//app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err, req, res, next){
  // if an error occurs Connect will pass it down
  // through these "error-handling" middleware
  // allowing you to respond however you like
  res.send(500, { error: 'Sorry something bad happened!' });
})


// development only
//if ('development' == app.get('env')) {
    //app.use(express.errorHandler());
//}

app.get('/', routes.index);
app.get('/signedin', routes.signedin);

var cardReplyId = "";
var jamesCardId = "";
var success = function (data) {
    console.log('success', data);
    console.log("JAMES CARD ID", jamesCardId);
};
var failure = function (data) {
    console.log('failure', data);
};
var gotToken = function (func) {
    //app.get('/signedin', routes.signedin);
    pubInfo = pubnubInfo;
    googleapis
        .discover('mirror', 'v1')
        .execute(function (err, client) {
            if (!!err) {
                failure();
                return;
            }
            console.log('mirror client', client);
            // run insertHello once to get credentials
            if(!oauth2Client.credentials) {
                return;
                consoe.log("FIRST INSERT HELLO", client);
            }
            func(client, failure, success);
        });
};

var testFunction = function (client, errorCallback, successCallback) {
    client
        .mirror.timeline.insert(
        {
            "html": "<article class=\"photo\">\n  <img src=\"http://www.androidnova.org/wp-content/uploads/2013/07/lg1.jpg\" width=\"100%\" height=\"100%\">\n  <div class=\"overlay-gradient-tall-dark\"/>\n  <section>\n    <p class=\"text-auto-size\">Welcome to the LG Glass Experience</p>\n  </section>\n</article>\n",
            "bundleId": "lgGlass",
            "isBundleCover": true,
            "notification": {
                "level": "DEFAULT"
            }
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
                coverId = data.id;
        });
};

// send a simple 'hello world' timeline card with a delete option
var coverId = "";
var insertHello = function (client, errorCallback, successCallback) {
    client
        .mirror.timeline.insert(
        {
            "html": "<article class=\"photo\">\n  <img src=\"http://www.androidnova.org/wp-content/uploads/2013/07/lg1.jpg\" width=\"100%\" height=\"100%\">\n  <div class=\"overlay-gradient-tall-dark\"/>\n  <section>\n    <p class=\"text-auto-size\">Welcome to the LG Glass Experience</p>\n  </section>\n</article>\n",
            "bundleId": "lgGlass",
            "isBundleCover": true,
            "notification": {
                "level": "DEFAULT"
            }
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
                coverId = data.id;
        });
};

var insertActorCard = function (client, pubnubInfo, errorCallback, successCallback) {
    client
        .mirror.timeline.insert(
        {
            "id": jamesCardId,
            "html": "<article class=\"photo\">\n  <ul class=\"mosaic mosaic3\">\n    <li style=\"background-image: url(https://mirror-api-playground.appspot.com/links/washington.jpg)\"></li>\n    <li style=\"background-image: url(https://mirror-api-playground.appspot.com/links/lincoln.png)\"></li>\n    <li style=\"background-image: url(https://mirror-api-playground.appspot.com/links/obama.jpg)\"></li>\n  </ul>\n  <div class=\"overlay-gradient-tall-dark\"/>\n  <section>\n    <p class=\"text-auto-size\">"+ pubnubInfo.message + "</p>\n  </section>\n</article>\n",
            "bundleId": "lgGlass",
            "bundleCover": false,
            "callbackUrl": "https://ec2-54-193-84-38.us-west-1.compute.amazonaws.com:8080/reply",
            "menuItems": [
                {"action": "REPLY"},
                {"action": "DELETE"},
                {"action": "CUSTOM",
                  "id": "complete",
                  "values": [{
                    "displayName": "Complete",
                    "iconUrl": "http://example.com/icons/complete.png"
                  }]
                }
            ],
            "notification": {
                "level": "DEFAULT"
            }
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
                jamesCardId = data.id;
        });
};

var updateActorCard = function (client, pubnubInfo, errorCallback, successCallback) {
    client
        .mirror.timeline.update(
        {
            "id": jamesCardId,
            "html": "<article class=\"photo\">\n  <ul class=\"mosaic mosaic3\">\n    <li style=\"background-image: url(https://mirror-api-playground.appspot.com/links/washington.jpg)\"></li>\n    <li style=\"background-image: url(https://mirror-api-playground.appspot.com/links/lincoln.png)\"></li>\n    <li style=\"background-image: url(https://mirror-api-playground.appspot.com/links/obama.jpg)\"></li>\n  </ul>\n  <div class=\"overlay-gradient-tall-dark\"/>\n  <section>\n    <p class=\"text-auto-size\">"+ pubnubInfo.message + "</p>\n  </section>\n</article>\n",
            "bundleId": "lgGlass",
            "bundleCover": false,
            "callbackUrl": "https://ec2-54-193-84-38.us-west-1.compute.amazonaws.com:8080/reply",
            "menuItems": [
                {"action": "REPLY"},
                {"action": "DELETE"},
                {"action": "CUSTOM",
                  "id": "complete",
                  "values": [{
                    "displayName": "Complete",
                    "iconUrl": "http://example.com/icons/complete.png"
                  }]
                }
            ],
            "notification": {
                "level": "DEFAULT"
            }
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                iscover = false;
                successCallback(data);
                coverId = data.id;
        });
};

// get card information 
var getReply = function (client, cardReplyId, errorCallback, successCallback) {
    client
        .mirror.timeline.get(
        {
            "id": cardReplyId
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};

// send a simple 'hello world' timeline card with a delete option
var insertSubscription = function (client, errorCallback, successCallback) {
    client
        .mirror.subscriptions.insert(
	{
	  "collection": "timeline",
	  "userToken": jamesCardId,
	  "callbackUrl": "https://ec2-54-193-84-38.us-west-1.compute.amazonaws.com:8080/reply"
	}
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
                jamesCardId = data.id
        });
};
// send a simple 'hello world' timeline card with a delete option
var insertLocation = function (client, errorCallback, successCallback) {
    console.log(client);
    client
        .mirror.timeline.insert(
        {
            "text": "Let's meet at the Hacker Dojo!",
            "callbackUrl": "https://mirrornotifications.appspot.com/forward?url=http://localhost:8080/reply",
            "location": {
                "kind": "mirror#location",
                "latitude": 37.4028344,
                "longitude": -122.0496017,
                "displayName": "Hacker Dojo",
                "address": "599 Fairchild Dr, Mountain View, CA"
            },
            "menuItems": [
                {"action":"NAVIGATE"},
                {"action": "REPLY"},
                {"action": "DELETE"}
            ]
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};


var insertContact = function (client, errorCallback, successCallback) {
    client
        .mirror.contacts.insert(
        {
            "id": "emil10001",
            "displayName": "emil10001",
            "iconUrl": "https://secure.gravatar.com/avatar/bc6e3312f288a4d00ba25500a2c8f6d9.png",
            "priority": 7,
            "acceptCommands": [
                {"type": "REPLY"},
                {"type": "POST_AN_UPDATE"},
                {"type": "TAKE_A_NOTE"}
            ]
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};
var listTimeline = function (client, errorCallback, successCallback) {
    client
        .mirror.timeline.list()
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
                console.log("LIST ITEMS", data.items.length); 
                for(var i = 0; i < data.items.length; i++) {
                    deleteTimeline(client, data.items[i].id, failure, success);
                    console.log("item id: ", data.items[i].id);
                    if(i === 0) {
                        gotToken("updateActorCard");
                    }
                }
        });
};

var deleteTimeline = function (client, item, errorCallback, successCallback) {
    client
        .mirror.timeline.delete({
            "id": item
        })
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
                //console.log("LIST ITEMS : POST DELETE", data); 
                //gotToken("insertHello");
        });
};


var grabToken = function (code, errorCallback, successCallback) {
    oauth2Client.getToken(code, function (err, tokens) {
        if (!!err) {
            errorCallback(err);
        } else {
            console.log('tokens', tokens);
            oauth2Client.credentials = tokens;
            successCallback();
        }
    });
};

app.get('/signin', function (req, res) {
    if (!oauth2Client.credentials) {
        // generates a url that allows offline access and asks permissions
        // for Mirror API scope.
        var url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/glass.timeline'
        });
        res.redirect(url);
    } else {
        res.redirect('/signedin'); // if you are already signed in 
        gotToken();
    }
    //res.write('Glass Mirror API with Node');
    res.end();
});
app.get('/oauth2callback', function (req, res) {
    // if we're able to grab the token, redirect the user back to the main page
    grabToken(req.query.code, failure, function () {
        res.redirect('/signedin');
        res.end();
    });
});
app.post('/reply', function(req, res){
    cardReplyId = req.body.itemId;
    console.log('replied', cardReplyId);
    console.log('replied full response', req.body);
    //gotToken("getReply");
    res.end();
});
//app.get('/reply', function(req, res){
//    console.log('replied using GET: ',req.body);
//    res.end();
//});
app.post('/location', function(req, res){
    console.log('location',req);
    res.end();
});
app.get('/send', function(req, res){
    //sendCard();
    gotToken(testFunction);
    //res.write('Glass Mirror API with Node');
    res.redirect('/signedin');
    res.end();
});
app.get('/sendupdate', function(req, res){
    //sendUpdate();
    console.log("/sendupdate,", res);
    //res.write('Glass Mirror API with Node');
    res.redirect('/signedin');
    res.end();
});
app.get('/listtimeline', function(req, res){
    //sendListTimeline();
    gotToken("listTimeline");
    //res.write('Glass Mirror API with Node');
    res.redirect('/signedin');
    res.end();
});
app.get('/subscribe', function(req, res){
    //sendListTimeline();
    //grabToken(req.query.code, failure, function () {
	gotToken("insertSubscription");
    //res.write('Glass Mirror API with Node');
    res.redirect('/signedin');
    res.end();
});
app.get('/location', function(req, res){
    //sendListTimeline();
    gotToken("insertLocation");
    //res.write('Glass Mirror API with Node');
    res.redirect('/signedin');
    res.end();
});

// https
//http.createServer(app).listen(app.get('port'), function() {
//	console.log('Express server listening on port 8080');
//});
// http
https.createServer(options, app).listen(8080, function() {
	console.log('Express server listening on port 443');
});
