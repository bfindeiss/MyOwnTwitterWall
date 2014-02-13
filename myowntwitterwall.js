Tweets = new Meteor.Collection("tweets");

if (Meteor.isClient) {

    Template.tweetOverview.tweetList = function() {
        return  Tweets.find({}, {sort: {timestamp: -1}, limit: 10});
    };

    Template.tweetOverview.events({
        'click input': function() {
            // template data, if any, is available in 'this'
            if (typeof console !== 'undefined')
                console.log("You pressed the button");
        }
    });

    var twitterSearch = function(searchString) {

    };

    Template.tweetInput.events({
        'click input.saveTweet': function(value, tmpl) {
            var inputElem = tmpl.find("textarea#tweet-Text");
            var tweetText = inputElem.value;
            var date = new Date();
            var author = "Unknown author";
            var user = Meteor.user();
            if (user !== null) {
                author = Meteor.user().emails[0].address;
            } else {
                var authorNameElem = tmpl.find("input#authorName");
                var authorName = authorNameElem.value;
                if (authorName !== null && authorName.length > 0) {
                    author = authorName;
                }
            }

            Tweets.insert({text: tweetText, author: author, timestamp: date});
            inputElem.value = '';
        }

    });

    Template.tweetSearch.events({
        'click input.searchTwitter': function(value, tmpl) {
            var inputElem = tmpl.find("input#twitterSearchString");
            var twitterSearchString = inputElem.value;
            console.log("Starte Suche");
            Meteor.call("twit_get", twitterSearchString);
        }

    });


    Handlebars.registerHelper("prettifyDate", function(timestamp) {
        //var date = (new Date(timestamp)).format("dd.MM.yyyy HH:MM");
        var date = moment(timestamp);
        return date.lang("de").format("LLL");
    });
}

if (Meteor.isServer) {
    Meteor.startup(function() {
        if (Tweets.find().count() === 0) {
            var currentTime = new Date();
            Tweets.insert({text: "I'm a tweet!", author: "Some user", timestamp: currentTime});
        }
        if (Tweets.find().count() > 5) {
            Tweets.remove({});
            var currentTime = new Date();
            Tweets.insert({text: "I'm a tweet!", author: "Some user", timestamp: currentTime});
        }
    });

    Meteor.methods({
        twit_get: function(searchString) {
            check(searchString, String);
            Twit = new TwitMaker({
                consumer_key: 'h2NyGCZSByiUmQJaeZ86zA',
                consumer_secret: 'kuj7VcOE1KRFstsRo3GYoZHw67ckLZ0LU255DPukw',
                access_token: '14789981-Mis9LK5m6EPTGFQ6OfanpFMtDaN9m23s6opAMdCpe',
                access_token_secret: 'TLu4WnBX9MLpfncQcla1DrR0TxSvd8L5vT9SDCQZVvGMs'
            });

            if (searchString === null) {
                searchString = 'banana since:2013-12-11';
            }
            Twit.get(
                    'search/tweets',
                    {
                        q: searchString,
                        count: 25
                    },
            Meteor.bindEnvironment(function(err, reply) {
                console.log("Soviele Antworten wurden gefunden: " + reply.statuses.length);
                var i = reply.statuses.length;
                while (i--) {
                    var cur_tweet = reply.statuses[i];
                    console.log("Tweet ID:" + cur_tweet.id);
                    var tweetExists = Tweets.findOne({twitter_id: cur_tweet.id});
                    if (typeof tweetExists === 'undefined' && cur_tweet.retweet_count === 0 && cur_tweet.lang === 'de') {
                        console.log(cur_tweet);
                        Tweets.insert({text: cur_tweet.text, author: cur_tweet.user.screen_name, timestamp: parseTwitterDate(cur_tweet.created_at), twitter_id: cur_tweet.id});
                    } else {
                        console.log("Der Tweet war schon vorhanden");
                    }
                }
            }));
        }
    });

    function parseTwitterDate(text) {
        return new Date(Date.parse(text.replace(/( +)/, ' UTC$1')));
    }
}
