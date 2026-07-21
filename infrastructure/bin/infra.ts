import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WinterVpcStack } from '../lib/vpc-stack';
import { WinterEksStack } from '../lib/eks-stack';
import { WinterAppRunnerStack } from '../lib/apprunner-stack';

const app = new cdk.App();

const env = {
  region: 'us-east-1',
};

// Retrieve context toggle for deployment target
const targetInfra = app.node.tryGetContext('targetInfra') || 'eks';

// Instantiate the network stack first, which now also contains the DB, SNS, and SQS queues
const vpcStack = new WinterVpcStack(app, 'WinterVpcStack', { env });

if (targetInfra === 'apprunner') {
  new WinterAppRunnerStack(app, 'WinterAppRunnerStack', {
    vpc: vpcStack.vpc,
    database: vpcStack.database,
    orderEventsTopic: vpcStack.orderEventsTopic,
    inventoryUpdateQueue: vpcStack.inventoryUpdateQueue,
    paymentProcessingQueue: vpcStack.paymentProcessingQueue,
    env,
  });
} else {
  new WinterEksStack(app, 'WinterEksStackV2', {
    vpc: vpcStack.vpc,
    database: vpcStack.database,
    orderEventsTopic: vpcStack.orderEventsTopic,
    inventoryUpdateQueue: vpcStack.inventoryUpdateQueue,
    paymentProcessingQueue: vpcStack.paymentProcessingQueue,
    env,
  });
}

