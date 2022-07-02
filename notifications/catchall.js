var _ = require('lodash');
var baseSlackMessage = {}

var handleCatchAll = function(event, context) {

    var record = event.Records[0]
    var subject = record.Sns.Subject
    var timestamp = Math.floor((new Date(record.Sns.Timestamp)).getTime()/1000);
    var message = JSON.parse(record.Sns.Message)
    var color = "warning";

    if (message.NewStateValue === "ALARM") {
        color = "danger";
    } else if (message.NewStateValue === "OK") {
        color = "good";
    }

    // Add all of the values from the event message to the Slack message description
    var description = ""
    for(key in message) {

        var renderedMessage = typeof message[key] === 'object'
                            ? JSON.stringify(message[key])
                            : message[key]

        description = description + "\n" + key + ": " + renderedMessage
    }

    var slackMessage = {
        text: "*" + subject + "*",
        attachments: [
          {
            "color": color,
            "fields": [],
            "ts": timestamp
          }
        ]
    }

    for(fields in message){
        slackMessage.attachments[0].fields.push({ "title": fields, "value": message[fields], "short": false })
    }

  return _.merge(slackMessage, baseSlackMessage);
}

module.exports = handleCatchAll;