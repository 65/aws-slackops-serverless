var _ = require('lodash');
var baseSlackMessage = {}

var handleCloudFormation = function(event, context) {
  var timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000;
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
  var region = message.StackId.split(':')[4];

  var slackMessage = {"blocks":[
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*AWS CloudFormation Notification*\nStack `" + message.StackName + "` is *" + message.ResourceStatus + "* on component *"+ message.LogicalResourceId + "* " + "\n<https://" + region + ".console.aws.amazon.com/cloudformation/home?region=" + region + "#/stacks/stackinfo?stackId=" + message.StackId + "|Open in AWS Console>"
      }
    }
  ]};
  if (message.ResourceStatusReason.length) slackMessage.blocks.push({ "type": "section", "text":{"type": "mrkdwn","text": "*More Information:* " + message.ResourceStatusReason}});

  if (message.ResourceStatus.includes('FAIL')) {
    slackMessage.blocks[0].accessory = {
      "type": "image",
      "image_url": "https://github.com/65/aws-slackops-serverless/raw/master/images/fail/fail-" + Math.floor(Math.random() * 4) + ".jpg",
      "alt_text": "It didn't work out"
    }
  }
  if (message.ResourceStatus.includes('COMPLETE')) {
    slackMessage.blocks[0].accessory = {
      "type": "image",
      "image_url": "https://github.com/65/aws-slackops-serverless/raw/master/images/success/success-" + Math.floor(Math.random() * 4) + ".jpg",
      "alt_text": "Well done you!"
    }
  }
//console.log(slackMessage.blocks)
return slackMessage;




  
};

module.exports = handleCloudFormation;