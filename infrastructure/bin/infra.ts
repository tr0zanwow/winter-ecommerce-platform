import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WinterVpcStack } from '../lib/vpc-stack';
import { WinterEksStack } from '../lib/eks-stack';

const app = new cdk.App();

const env = {
  region: 'us-east-1',
};

// Instantiate the network stack first
const vpcStack = new WinterVpcStack(app, 'WinterVpcStack', { env });

// Instantiate the EKS cluster stack, passing the vpc reference
new WinterEksStack(app, 'WinterEksStackV2', {
  vpc: vpcStack.vpc,
  env,
});
