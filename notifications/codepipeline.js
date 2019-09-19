var _ = require('lodash');
var baseSlackMessage = {}

var handleCodePipeline = function(event, context) {
  var subject = "AWS CodePipeline Notification";
  var timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000;
  var snsSubject = event.Records[0].Sns.Subject;
  var message;
  var fields = [];
  var actions = [];
  var color = "warning";
  var changeType = "";

  try {
    message = JSON.parse(event.Records[0].Sns.Message);
    
    // blank if approval message
    detailType = message['detail-type'];
    // contains an object if its an approval request
    approvalDetail = message['approval'];

    if(detailType === "CodePipeline Pipeline Execution State Change"){
      changeType = "";
    } else if(detailType === "CodePipeline Stage Execution State Change"){
      changeType = "STAGE " + message.detail.stage;
    } else if(detailType === "CodePipeline Action Execution State Change"){
      changeType = "ACTION";
    } else if(approvalDetail){
      changeType = "ACTION";
      message.detail = {}; // fudge this for use below to avoid errors
      message.detail.state = "ACTION";
    }


    if(message.detail.state === "SUCCEEDED"){
      color = "good";
    } else if(message.detail.state === "FAILED"){
      color = "danger";
    } else if(message.detail.state === "ACTION"){
      color = "#3AA3E3";
    }

    

    if(approvalDetail){

      header = "APPROVAL REQUIRED: " + approvalDetail.stageName;
      subject = "AWS CodePipeline needs your attention";
      fields.push({ "title": "Message", "value": header, "short": false });
      fields.push({ "title": "Pipeline", "value": approvalDetail.pipelineName, "short": true });
      fields.push({ "title": "Region", "value": message.region, "short": true });
      fields.push({
        "title": "Review Pipeline in Console",
        "value": approvalDetail.approvalReviewLink,
        "short": false
      });

      var actions = [];

      actions.push({
          "name":approvalDetail.actionName,
          "text": "Review Request",
          "style": "danger",
          "type": "button",
          "value": JSON.stringify({"approve": true, "stageName": approvalDetail.stageName, "codePipelineToken": approvalDetail.token, "codePipelineName": approvalDetail.pipelineName}),
          "confirm": {
              "title": "Are you sure?",
              "text": approvalDetail.customData,
              "ok_text": "Approve",
              "dismiss_text": "Cancel"
          }
        },
        {
              "name":approvalDetail.actionName,
              "text": "Reject",
              "type": "button",
              "value": JSON.stringify({"approve": false, "stageName": approvalDetail.stageName, "codePipelineToken": approvalDetail.token, "codePipelineName": approvalDetail.pipelineName})
          }  
        );

    }else{

      header = message.detail.state + ": CodePipeline " + changeType;
      fields.push({ "title": "Message", "value": header, "short": false });
      fields.push({ "title": "Pipeline", "value": message.detail.pipeline, "short": true });
      fields.push({ "title": "Region", "value": message.region, "short": true });
      fields.push({
        "title": "Status Link",
        "value": "https://console.aws.amazon.com/codepipeline/home?region=" + message.region + "#/view/" + message.detail.pipeline,
        "short": false
      });

    }
  }
  catch(e) {
    console.log(e);
    color = "good";
    message = event.Records[0].Sns.Message;
    header = message.detail.state + ": CodePipeline " + message.detail.pipeline;
    fields.push({ "title": "Message", "value": header, "short": false });
    fields.push({ "title": "Detail", "value": message, "short": false });
  }


  var slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": fields,
        "callback_id": "slack_sns_" + event.Records[0].Sns.MessageId,
        "actions" : actions,
        "ts": timestamp
      }
    ]
  };
  console.log(JSON.stringify(slackMessage));
  return _.merge(slackMessage, baseSlackMessage);
};

module.exports = handleCodePipeline;