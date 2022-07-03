serverless invoke local --function aggregator --path test/monit.json

serverless invoke local --function aggregator --path test/sns-autoscaling-event.json
serverless invoke local --function aggregator --path test/sns-cloudformation-event-create-compelete.json
serverless invoke local --function aggregator --path test/sns-cloudformation-event-create-inprogress.json
serverless invoke local --function aggregator --path test/sns-cloudformation-event-fail.json
serverless invoke local --function aggregator --path test/sns-cloudformation-event-update-compelete.json
serverless invoke local --function aggregator --path test/sns-cloudwatch-event.json
serverless invoke local --function aggregator --path test/sns-codedeploy-configuration.json
serverless invoke local --function aggregator --path test/sns-codedeploy-event.json
serverless invoke local --function aggregator --path test/sns-codepipeline-event-pipeline-manualapproval.json
serverless invoke local --function aggregator --path test/sns-codepipeline-event-pipeline-started.json
serverless invoke local --function aggregator --path test/sns-codepipeline-event-stage-failed.json
serverless invoke local --function aggregator --path test/sns-codepipeline-event-stage-started.json
serverless invoke local --function aggregator --path test/sns-codepipeline-event-stage-succeeded.json
serverless invoke local --function aggregator --path test/sns-elastic-beanstalk-event.json
serverless invoke local --function aggregator --path test/sns-elasticache-event.json
serverless invoke local --function aggregator --path test/sns-event.json
