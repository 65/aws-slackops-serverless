var config = require('./config');
var postMessage = require('./postmessage');
// change 8 
var processEvent = function(event, context, hookURL) {
  console.log("sns received:" + JSON.stringify(event, null, 2));
  var slackMessage = null;
  var eventSubscriptionArn = event.Records[0].EventSubscriptionArn;
  var eventSnsSubject = event.Records[0].Sns.Subject || 'no subject';
  var eventSnsMessageRaw = event.Records[0].Sns.Message;
  var eventSnsMessage = null;

  try {
    eventSnsMessage = JSON.parse(eventSnsMessageRaw);
  }
  catch (e) {    
  }

  if(eventSubscriptionArn.indexOf(config.services.cloudformation.match_text) > -1 || eventSnsSubject.indexOf(config.services.cloudformation.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.cloudformation.match_text) > -1){
    console.log("processing cloudformation notification");
    var handleAutoScaling = require('./notifications/cloudformation.js');
    slackMessage = handleAutoScaling(event, context);
  }
  else if(eventSubscriptionArn.indexOf(config.services.codepipeline.match_text) > -1 || eventSnsSubject.indexOf(config.services.codepipeline.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.codepipeline.match_text) > -1){
    console.log("processing codepipeline notification");
    var handleCodePipeline = require('./notifications/codepipeline.js');
    slackMessage = handleCodePipeline(event,context)
  }
  else if(eventSubscriptionArn.indexOf(config.services.elasticbeanstalk.match_text) > -1 || eventSnsSubject.indexOf(config.services.elasticbeanstalk.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.elasticbeanstalk.match_text) > -1){
    console.log("processing elasticbeanstalk notification");
    var handleElasticBeanstalk = require('./notifications/elasticbeanstalk.js');
    slackMessage = handleElasticBeanstalk(event,context)
  }
  else if(eventSnsMessage && 'AlarmName' in eventSnsMessage && 'AlarmDescription' in eventSnsMessage){
    console.log("processing cloudwatch notification");
    var handleCloudWatch = require('./notifications/cloudwatch.js');
    slackMessage = handleCloudWatch(event,context);
  }
  else if(eventSubscriptionArn.indexOf(config.services.codedeploy.match_text) > -1 || eventSnsSubject.indexOf(config.services.codedeploy.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.codedeploy.match_text) > -1){
    console.log("processing codedeploy notification");
    var handleCodeDeploy = require('./notifications/codedeploy.js');
    slackMessage = handleCodeDeploy(event,context);
  }
  else if(eventSubscriptionArn.indexOf(config.services.elasticache.match_text) > -1 || eventSnsSubject.indexOf(config.services.elasticache.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.elasticache.match_text) > -1){
    console.log("processing elasticache notification");
    var handleElasticache = require('./notifications/elasticache.js');
    slackMessage = handleElasticache(event,context);
  }
  else if(eventSubscriptionArn.indexOf(config.services.autoscaling.match_text) > -1 || eventSnsSubject.indexOf(config.services.autoscaling.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.autoscaling.match_text) > -1){
    console.log("processing autoscaling notification");
    var handleAutoScaling = require('./notifications/autoscaling.js');
    slackMessage = handleAutoScaling(event, context);
  }
  else{
    var handleCatchAll = require('./notifications/catchall.js');
    slackMessage = handleCatchAll(event, context);
  }

  console.log("sns sending to:" + hookURL);

  // console.log("slack message" + JSON.parse(slackMessage));

  postMessage(slackMessage, hookURL, function(response) {
    if (response.statusCode < 400) {
      console.info('message posted successfully');
      context.succeed();
    } else if (response.statusCode < 500) {
      console.error("error posting message to slack API: " + response.statusCode + " - " + response.statusMessage);
      // Don't retry because the error is due to a problem with the request
      context.succeed();
    } else {
      // Let Lambda retry
      context.fail("server error when processing message: " + response.statusCode + " - " + response.statusMessage);
    }
  });
};

module.exports = processEvent;