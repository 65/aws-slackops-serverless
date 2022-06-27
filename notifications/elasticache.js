var _ = require('lodash');
var baseSlackMessage = {}

var handleElasticache = function(event, context) {
  var subject = "AWS ElastiCache Notification"
  var message = JSON.parse(event.Records[0].Sns.Message);
  var timestamp = Math.floor((new Date(event.Records[0].Sns.Timestamp)).getTime()/1000);
  var region = event.Records[0].EventSubscriptionArn.split(":")[3];
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
          { "title": "Event", "value": eventname.split(":")[1], "short": true },
          { "title": "Node", "value": nodename, "short": true },
          {
            "title": "Link to cache node",
            "value": "https://console.aws.amazon.com/elasticache/home?region=" + region + "#cache-nodes:id=" + nodename + ";nodes",
            "short": false
          }
        ],
        "ts": timestamp
      }
    ]
  };
  return _.merge(slackMessage, baseSlackMessage);
};

module.exports = handleElasticache;