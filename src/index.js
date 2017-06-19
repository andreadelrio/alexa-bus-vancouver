require('dotenv').load();

var http       = require('http')
  , AlexaSkill = require('./AlexaSkill')
  , APP_ID     = process.env.APP_ID
  , TRANSLINK_KEY    = process.env.TRANSLINK_KEY;


var getJsonFromMta = function(stopId, callback){
  var config = {
      host: 'api.translink.ca',
      path: '/rttiapi/v1/stops/' + stopId + '/estimates?apikey=' + TRANSLINK_KEY,
      headers:{
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
  }

  http.get(config, function(res){
    var body = '';

    res.on('data', function(data){
      body += data;
    });

    res.on('end', function(){
      var result = JSON.parse(body);
      callback(result);
    });

  }).on('error', function(e){
    console.log('Error: ' + e);
  });
};

var handleNextBusRequest = function(intent, session, response){
  getJsonFromMta(intent.slots.bus.value,function(data){
      if(data[0] && data[0].Schedules[0].ExpectedCountdown){
        var text = data[0].Schedules[0].ExpectedCountdown;
        var cardText = 'The next bus is in ' + text + ' minutes';
      } else {
        var text = data['Message'];
        var cardText = text;
      }
      var heading = 'Next bus for stop: ' + intent.slots.bus.value;
      // console.log(text, heading, cardText);
      response.tellWithCard(cardText, heading, cardText);
    });
};

var TransLink = function(){
  AlexaSkill.call(this, APP_ID);
};

TransLink.prototype = Object.create(AlexaSkill.prototype);
TransLink.prototype.constructor = TransLink;

TransLink.prototype.eventHandlers.onSessionStarted = function(sessionStartedRequest, session){
  // What happens when the session starts? Optional
  console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
      + ", sessionId: " + session.sessionId);
};

TransLink.prototype.eventHandlers.onLaunch = function(launchRequest, session, response){
  // This is when they launch the skill but don't specify what they want. Prompt
  // them for their bus stop
  var output = 'Welcome to Translink Bus Schedule. ' +
    'Say the number of a bus stop to get how far the next bus is away.';

  var reprompt = 'Which bus stop do you want to find more about?';

  response.ask(output, reprompt);

  console.log("onLaunch requestId: " + launchRequest.requestId
      + ", sessionId: " + session.sessionId);
};

TransLink.prototype.intentHandlers = {
  GetNextBusIntent: function(intent, session, response){
    handleNextBusRequest(intent, session, response);
  },

  HelpIntent: function(intent, session, response){
    var speechOutput = 'Get the distance from arrival for any Vancouver bus stop ID. ' +
      'Which bus stop would you like?';
    response.ask(speechOutput);
  }
};

exports.handler = function(event, context) {
    var skill = new TransLink();
    skill.execute(event, context);
};
