var _ = require('lodash');
var baseSlackMessage = {}

var handleAutoScaling = function(event, context) {
  var subject = "AWS AutoScaling Notification"
  var message = JSON.parse(event.Records[0].Sns.Message);
  var timestamp = Math.floor((new Date(event.Records[0].Sns.Timestamp)).getTime()/1000);
  var eventname, nodename;
  var color = "good";

  for(key in message){
    eventname = key;
    nodename = message[key];
    break;
  }
  var slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": [
          { "title": "Message", "value": event.Records[0].Sns.Subject, "short": false },
          { "title": "Description", "value": message.Description, "short": false },
          { "title": "Event", "value": message.Event, "short": false },
          { "title": "Cause", "value": message.Cause, "short": false }

        ],
        "ts": timestamp
      }
    ]
  };
  return _.merge(slackMessage, baseSlackMessage);
};

module.exports = handleAutoScaling;