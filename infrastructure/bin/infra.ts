import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WinterVpcStack } from '../lib/vpc-stack';
import { WinterEksStack } from '../lib/eks-stack';
import { WinterEcsExpressStack } from '../lib/ecs-express-stack';
import { WinterServerlessStack } from '../lib/serverless-stack';

const app = new cdk.App();

const env = {
  region: 'us-east-1',
};

// Retrieve context toggle for deployment target (defaults to 'serverless')
const targetInfra = app.node.tryGetContext('targetInfra') || 'serverless';

// Instantiate the network stack first
const vpcStack = new WinterVpcStack(app, 'WinterVpcStack', { env });

if (targetInfra === 'serverless') {
  new WinterServerlessStack(app, 'WinterServerlessStack', {
    vpc: vpcStack.vpc,
    orderEventsTopic: vpcStack.orderEventsTopic,
    inventoryUpdateQueue: vpcStack.inventoryUpdateQueue,
    paymentProcessingQueue: vpcStack.paymentProcessingQueue,
    env,
  });
} else if (targetInfra === 'express' || targetInfra === 'apprunner') {
  new WinterEcsExpressStack(app, 'WinterEcsExpressStack', {
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
