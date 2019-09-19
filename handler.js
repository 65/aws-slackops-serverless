'use strict';

var AWS = require('aws-sdk');
var config = require('./config');
var processEvent = require('./processevent');
var _ = require('lodash');
var hookUrl;
var baseSlackMessage = {}
const querystring = require('querystring');

module.exports.aggregator = (event, context, callback) => {
  /*
    Receives a notification from an AWS service, and decides what to do with it
  */
  console.log("starting handler");
  if (hookUrl) {
    processEvent(event, context, hookUrl);
  } else if (config.unencryptedHookUrl) {
    hookUrl = config.unencryptedHookUrl;
    processEvent(event, context, hookUrl);
  } else if (config.kmsEncryptedHookUrl && config.kmsEncryptedHookUrl !== '<kmsEncryptedHookUrl>') {
    var encryptedBuf = new Buffer(config.kmsEncryptedHookUrl, 'base64');
    var cipherText = { CiphertextBlob: encryptedBuf };
    var kms = new AWS.KMS();

    kms.decrypt(cipherText, function(err, data) {
      if (err) {
        console.log("decrypt error: " + err);
        processEvent(event, context);
      } else {
        hookUrl = "https://" + data.Plaintext.toString('ascii');
        processEvent(event, context, hookUrl);
      }
    });
  } else {
    context.fail('hook url has not been set.');
  }

};

module.exports.incomingwebhook = (event, context, callback) => {
  console.log(event);
  
  var payload = JSON.parse(querystring.decode(event.body).payload);
  console.log(payload);
  var actionresult = JSON.parse(payload.actions[0].value);
  var actionstatus = actionresult.approve === true ? 'Approved' : 'Rejected'; 

  const codepipeline = new AWS.CodePipeline();
  var params = {
    actionName: payload.actions[0].name, /* required */
    pipelineName: actionresult.codePipelineName, /* required */
    result: { /* required */
      status: actionstatus, /*  Approved | Rejected // required */
      summary: 'STRING_VALUE' /* required */
    },
    stageName: actionresult.stageName, /* required */
    token: actionresult.codePipelineToken /* required */
  };

  codepipeline.putApprovalResult(params, function(err, data) {
    if (err){
      console.log(err, err.stack); // an error occurred
    } else {
      console.log(data);           // successful response

        if (actionresult.approve){
          var result =  {
            "isBase64Encoded": "false",
            "statusCode": 200,
            "body": {"text": "The approval has been processed"}
          }
        }else{
          var result =  {
            "isBase64Encoded": "false",
            "statusCode": 403,
            "body": {"error": "This request does not include a vailid verification token."}
          }
          return callback(null, {"statusCode": 200, "body": JSON.stringify(result) });
        }

    } 
  });
  


}