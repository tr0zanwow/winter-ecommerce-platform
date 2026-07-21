import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as snsSub from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class WinterVpcStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly database: rds.DatabaseInstance;
  public readonly orderEventsTopic: sns.Topic;
  public readonly inventoryUpdateQueue: sqs.Queue;
  public readonly paymentProcessingQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'WinterCoreVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Shared RDS PostgreSQL Construct
    this.database = new rds.DatabaseInstance(this, 'WinterSharedDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      allocatedStorage: 20,
      maxAllocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      multiAz: false,
      databaseName: 'winter_core',
    });

    // Shared SNS & SQS Constructs
    this.orderEventsTopic = new sns.Topic(this, 'WinterOrderEventsTopic', {
      topicName: 'WinterOrderEventsTopic',
      displayName: 'Winter Order Events Messaging Hub',
    });

    const inventoryUpdateDlq = new sqs.Queue(this, 'WinterInventoryUpdateDlq', {
      queueName: 'WinterInventoryUpdateDlq',
    });

    this.inventoryUpdateQueue = new sqs.Queue(this, 'WinterInventoryUpdateQueue', {
      queueName: 'WinterInventoryUpdateQueue',
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: inventoryUpdateDlq,
      },
    });

    this.orderEventsTopic.addSubscription(new snsSub.SqsSubscription(this.inventoryUpdateQueue));

    const paymentProcessingDlq = new sqs.Queue(this, 'WinterPaymentProcessingDlq', {
      queueName: 'WinterPaymentProcessingDlq',
    });

    this.paymentProcessingQueue = new sqs.Queue(this, 'WinterPaymentProcessingQueue', {
      queueName: 'WinterPaymentProcessingQueue',
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: paymentProcessingDlq,
      },
    });

    this.orderEventsTopic.addSubscription(new snsSub.SqsSubscription(this.paymentProcessingQueue));
  }
}

