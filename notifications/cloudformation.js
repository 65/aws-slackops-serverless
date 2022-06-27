var _ = require('lodash');
var baseSlackMessage = {}

var handleCloudFormation = function(event, context) {
  var timestamp = Math.floor((new Date(event.Records[0].Sns.Timestamp)).getTime()/1000);
  var color = "good";

  // split by the \n string first
  var baseMessage = event.Records[0].Sns.Message.split(/\r?\n/);

  // now parse the elements into a JSON format
  // "LogicalResourceId='CodePipelineSetup'"
  // {"LogicalResourceId":'CodePipelineSetup'}
  var message = {}
  for (var property in baseMessage) {
    if(baseMessage[property].length){
      var tmp = baseMessage[property].split('=');
      message[tmp[0]] = tmp[1].replace(/'/g,"");
    }
  }
  console.log(message);
  var region = message.StackId.split(':')[3];

  var emoji = ":stopwatch:";
  if (message.ResourceStatus.includes('FAIL')) {
    emoji = ":warning:"
  }else if (message.ResourceStatus.includes('COMPLETE')) {
    emoji = ":partying_face:"
  }

  var flag = ":us:";
  if (message.StackId.includes('ap-')) {
    flag = ":flag-au:"
  }else if (message.StackId.includes('eu-')) {
    flag = ":flag-eu:"
  }


  var slackMessage = {
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "This is a header block",
          "emoji": true
        }
      }
    ]
  };

  var slackMessage = {"blocks":[
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "AWS CloudFormation Notification",
        "emoji": true
      }
    },
    {
      "type": "section",
      "fields":[
        {
          "type": "mrkdwn",
          "text": "*Status:*\n" + emoji + " " + message.ResourceStatus
        },
        {
          "type": "mrkdwn",
          "text": "*Info:*\n" + message.ResourceStatusReason 
        }
      ]
    },
    {
      "type": "section",
      "fields":[
        {
          "type": "mrkdwn",
          "text": "*Region:*\n" + flag + " " + region
        },
        {
          "type": "mrkdwn",
          "text": "*Stack:*\n" + message.StackName 
        }
      ]
    },
    {
      "type": "section",
      "fields":[
        {
          "type": "mrkdwn",
          "text": "*Resource:*\n" + message.LogicalResourceId
        },
        {
          "type": "mrkdwn",
          "text": "*View in Console:*\n<https://" + region + ".console.aws.amazon.com/cloudformation/home?region=" + region + "#/stacks/stackinfo?stackId=" + message.StackId + "|Open Stack in CloudFormation>"
        }
      ]
    }
    

  ]};

  // Add the date and time
  slackMessage.blocks.push({
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "<!date^" + timestamp + "^{date_short_pretty} at {time_secs}|" + event.Records[0].Sns.Timestamp + ">"
        }
      ]
    });

  console.log(slackMessage.blocks)
  
  return slackMessage;
  
  
};

module.exports = handleCloudFormation;


