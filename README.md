# aws-slackops-serverless

A [Serverless](https://serverless.com/framework/docs/providers/aws/guide/intro/) and [AWS Lambda](http://aws.amazon.com/lambda/) function for better Slack notifications, and slack operations. 

## Overview

Built on code from Assertible's [lambda-cloudwatch-slack](https://assertible.com/blog/npm-package-lambda-cloudwatch-slack) thanks to [@creichert](https://github.com/creichert) and team.
This function was originally derived from the
[AWS blueprint named `cloudwatch-alarm-to-slack`](https://aws.amazon.com/blogs/aws/new-slack-integration-blueprints-for-aws-lambda/). The
function in this repo improves on the default blueprint in several ways:

**Better default formatting for CloudWatch notifications:**

![AWS Cloud Notification for Slack](https://github.com/assertible/lambda-cloudwatch-slack/raw/master/images/cloudwatch.png)

**Support for notifications from Elastic Beanstalk:**

![Elastic Beanstalk Slack Notifications](https://github.com/assertible/lambda-cloudwatch-slack/raw/master/images/elastic-beanstalk.png)

**Support for notifications from Code Deploy:**

![AWS CodeDeploy Notifications](https://github.com/assertible/lambda-cloudwatch-slack/raw/master/images/code-deploy.png)

**Support for notifications from Code Pipeline and Manual Approval Actions:**

![AWS CodePipeline Manual Approvals](https://github.com/65/aws-slackops-serverless/raw/master/images/slack_codepipeline_manual_request.png)

**Basic support for notifications from ElastiCache:**

![AWS ElastiCache Notifications](https://github.com/assertible/lambda-cloudwatch-slack/raw/master/images/elasticache.png)

**Basic support for notifications from CloudFormation:**
![AWS CloudFormation Notifications](https://github.com/assertible/lambda-cloudwatch-slack/raw/master/images/elasticache.png)


**Support for encrypted and unencrypted Slack webhook url:**

We have also integrated the principlese from AWS DevOps blog [Use Slack ChatOps to Deploy Your Code – How to Integrate Your Pipeline in AWS CodePipeline with Your Slack Channel](https://aws.amazon.com/blogs/devops/use-slack-chatops-to-deploy-your-code-how-to-integrate-your-pipeline-in-aws-codepipeline-with-your-slack-channel/) to allow interaction from Slack to approve or reject manual approvals. 

## Operation

This works by a service in AWS generating a notification and sending it to SNS. SNS passes it to Lambda as its subscriber and Lambda does the work to decide how to handle the message. After parsing the incoming message, it then pushes a notification to the Slack Webhook URL. 

If it is a [codepipeline manual approval step](https://docs.aws.amazon.com/codepipeline/latest/userguide/approvals.html) that requires user feedback then it will add a set of Approve / Deny buttons to the message, and feed that to the Slack application. The reponse of these buttons is fed back to Lambda to complete the action in CodePipeline. 

![Architecture Diagram](https://github.com/65/aws-slackops-serverless/raw/master/images/architecture_diagram.jpg)


## Configuration
There's a few steps here, so bear with us. If you run actions in multiple regions, you will need a SlackApp for each (we didn't work out how to centralise the webhook responses for example to one region as a hub, and have them be distributed to another region). 
### 1. Create your slack app 

Start at [https://api.slack.com/apps ](https://api.slack.com/apps ) Add a name, (icon if you wish), and activate the `WebHooks` integration. 

![Activate Incoming Webhooks](https://github.com/65/aws-slackops-serverless/raw/master/images/activate_incoming_webhooks.png)

Secondly connect a webhook to the workspace, and decide on a channel to post the messages into. 

![Add webhook to workspace](https://github.com/65/aws-slackops-serverless/raw/master/images/add_new_webhook_to_workspace.png)

![Give permission](https://github.com/65/aws-slackops-serverless/raw/master/images/new_webhook_workspace_permissions.png)


### 2. Clone this repository and set up
```bash 
git clone https://github.com/65/aws-slackops-serverless
npm install 
```

#### Setup Serverless
In the `serverless.yml` change the `org` and `app` to your details in the first couple of lines. 

Find the `slackwebhook` section and add a line for each regions you operate within, and add the Slack WebHook URL for each 

```
slackwebhook:
  #############################################
  # Add each region you operate in 
  # Add the Slack Webhook URL here for each
  ############################################
  us-west-2: "https://hooks.slack.com/services/xxxxxxxxxxxxx/xxxxxxxxxxxxx/xxxxxxxxxxxxx"
  ap-southeast-2: "https://hooks.slack.com/services/xxxxxxxxxxxxx/xxxxxxxxxxxxx/xxxxxxxxxxxxx"
```
If you are using named profiles in your AWS CLI add that profile name to `profile`

### 3. Deploy the app to AWS
The final step is to deploy the integration to AWS:
```bash
serverless deploy --region=us-west-2
```
If you wish to deploy to a stage other than the default `dev` or a different `region`: 
```bash
serverless deploy --stage master --region=ap-southeast-2
```

### 4. Add your webhook URL to the Slack App 
Once deployed you will get a URL for the `SlackWebhookURL` in the output of the serverless deploy. This URL allows Slack to communicate back to our app after an interaction happens. 

For example, this one is for `ap-southeast-2` and `master`

```bash
endpoints:
  POST - https://xxxxxxxxxx.execute-api.ap-southeast-2.amazonaws.com/master/webhook
```
Go back to your [Slack App](https://api.slack.com/apps/) open the app and in Interactivty & Shortcuts > Interactivity, activate Interactive Components

![Activate Interactive Components](https://github.com/65/aws-slackops-serverless/raw/master/images/activate_interactive_components.png)

Then enter the `SlackWebhookURL` into the Request URL and save

![Add webhook URL](https://github.com/65/aws-slackops-serverless/raw/master/images/add_webhook_url.png)

At this point you can run a test and see some output in slack. 

```bash
serverless invoke local --function aggregator --path test/sns-codedeploy-event.json 
```

### 5. Configure AWS serices 

On your AWS Services you should use the `NotificationARN` displayed in the outputs of the CloudFormation stack. 

#### Elastic Beanstalk 
To set ElasticBeanstalk to push notifications, you need the ARN of the SNS Topic created in this project. In your ElasticBeanstalk code create an [.ebextensions](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/ebextensions.html) folder, and then create a file (something like `10-environment-config`) and pop this in, replacing your arn with the example:
```
option_settings:
   - namespace: aws:elasticbeanstalk:sns:topics
     option_name: NotificationTopicArn
     value: arn:aws:sns:ap-southeast-2:xxxxxxxxxxxxx:cloudwatch-slackops-serverless-aggregate-production
```
Full details on [aws:elasticbeanstalk:sns:topics](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/command-options-general.html#command-options-general-elasticbeanstalksnstopics) found here. 

#### Code Pipeline (and other services) 
To push in notifications from most services you can create an Event Rule in CloudWatch. 

Cloudwatch > Events > Rules > Create Rule

Select the `Service Name` and `Event Types` as you wish, or click `edit` next to `Event Pattern Preview` and enter a template below. 

![Add SNS to CodePipeline manual approval](https://github.com/65/aws-slackops-serverless/raw/master/images/cloudwatch_create_rule.png)

#### CodePipeline
```json 
{
  "source": [
    "aws.codepipeline"
  ],
  "detail-type": [
    "CodePipeline Pipeline Execution State Change",
    "CodePipeline Stage Execution State Change"
  ]
}
```
Then in the `Targets` section select the `SNS Topic` that contains `-aggregate`

![Select CloudWatch rule Target](https://github.com/65/aws-slackops-serverless/raw/master/images/cloudwatch_target.png)

On `Configure Details` - give the rule a meaningful name like `CodePipeline-to-Slack`

![CloudWatch configure rule details](https://github.com/65/aws-slackops-serverless/raw/master/images/cloudwatch_configure_rule_details.png)

Then save by clicking `Create Rule`. 


#### Code Pipeline Manual Approval
Edit the CodePipeline stage > Manual Approval. 
Use the comments wisely, as this will show up in the confirmation box, so indicate the result of the action here. 
![Add SNS to CodePipeline manual approval](https://github.com/65/aws-slackops-serverless/raw/master/images/add_sns_to_codepipeline_approval.png)

You can also do this via your CloudFormation templates, using a ManualApproval step. In this step we are passing in the `NotificationARN` as a parameter to the template: 
```json
{
  "Name": "BuildManualApproval",
  "Actions": [
    {
      "Name": "ManualApproval",
      "ActionTypeId": {
        "Category": "Approval",
        "Owner": "AWS",
        "Provider": "Manual",
        "Version": "1"
      },
      "Configuration": {
        "NotificationArn": { "Ref": "NotificationARN" },
        "CustomData": { "Fn::Join" : [" ", [ "Do you want to build this" ,{ "Ref" : "EnvironmentType" }, "version?"  ]]}
      },
      "RunOrder": 2
    }
  ]
}
```

## Testing 

On your command line you can test messages, by making them look like they have come out of CloudWatch, and send them to Slack. 

### Cloudwatch to Slack Messages

Choose your file from within test folder and insert below to generate a sample slack message. 

```bash 
serverless invoke local --function aggregator --path test/sns-codepipeline-event-pipeline-manualapproval.json --stage local
```

### Slack to Lambda 

An action item, such as the Approve / Reject approval action in Code Pipeline will trigger a request that goes back to AWS via Slack. 

You can test this with the following, but expect an error ` The security token included in the request is invalid.` This is because 

```bash
serverless invoke local --function slackincoming --path test/slack-webhook-response.json --stage local
``` 

