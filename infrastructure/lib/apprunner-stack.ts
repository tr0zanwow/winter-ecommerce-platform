import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface AppRunnerStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  database: rds.DatabaseInstance;
  orderEventsTopic: sns.ITopic;
  inventoryUpdateQueue: sqs.IQueue;
  paymentProcessingQueue: sqs.IQueue;
}

export class WinterAppRunnerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppRunnerStackProps) {
    super(scope, id, props);

    const account = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;

    // STEP 1: Define the ECR access role for App Runner to pull service images
    const accessRole = new iam.Role(this, 'AppRunnerEcrAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'),
      ],
    });

    // STEP 2: Configure VPC Connector for private egress to database and services
    const connectorSg = new ec2.SecurityGroup(this, 'VpcConnectorSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'Security Group for App Runner VPC Connector',
    });

    // Security Boundary: Allow VPC Connector to reach database on PostgreSQL port
    new ec2.CfnSecurityGroupIngress(this, 'AppRunnerToDbIngressRule', {
      ipProtocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      groupId: props.database.connections.securityGroups[0].securityGroupId,
      sourceSecurityGroupId: connectorSg.securityGroupId,
      description: 'Allow App Runner VPC Connector to connect to DB',
    });

    const vpcConnector = new apprunner.CfnVpcConnector(this, 'WinterVpcConnector', {
      subnets: props.vpc.privateSubnets.map(s => s.subnetId),
      securityGroups: [connectorSg.securityGroupId],
      vpcConnectorName: 'WinterVpcConnector',
    });

    // STEP 3: Define Zero-Trust Instance Roles
    const defaultInstanceRole = new iam.Role(this, 'DefaultInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });

    const orderServiceInstanceRole = new iam.Role(this, 'OrderServiceInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });
    orderServiceInstanceRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [props.orderEventsTopic.topicArn],
    }));

    const inventoryServiceInstanceRole = new iam.Role(this, 'InventoryServiceInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });
    inventoryServiceInstanceRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:ChangeMessageVisibility'],
      resources: [props.inventoryUpdateQueue.queueArn],
    }));

    const paymentServiceInstanceRole = new iam.Role(this, 'PaymentServiceInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });
    paymentServiceInstanceRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:ChangeMessageVisibility'],
      resources: [props.paymentProcessingQueue.queueArn],
    }));

    // Import MongoDB URI secrets from Secrets Manager if present
    const secret = secretsmanager.Secret.fromSecretNameV2(this, 'ImportedSecrets', 'winter-core-secrets');

    // STEP 4: Define App Runner Services
    
    // Frontend BFF
    new apprunner.CfnService(this, 'FrontendService', {
      serviceName: 'winter-frontend-bff',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        imageRepository: {
          imageIdentifier: `${account}.dkr.ecr.${region}.amazonaws.com/winter-frontend-bff:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '3000',
          },
        },
        autoDeploymentsEnabled: false,
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
        },
      },
      instanceConfiguration: {
        instanceRoleArn: defaultInstanceRole.roleArn,
      },
    });

    // Catalog Service
    new apprunner.CfnService(this, 'CatalogService', {
      serviceName: 'winter-catalog-service',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        imageRepository: {
          imageIdentifier: `${account}.dkr.ecr.${region}.amazonaws.com/winter-catalog-service:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '3000',
            runtimeEnvironmentSecrets: [
              {
                name: 'DATABASE_URL',
                value: `${secret.secretArn}:MONGODB_URI::`,
              },
            ],
          },
        },
        autoDeploymentsEnabled: false,
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
        },
      },
      instanceConfiguration: {
        instanceRoleArn: defaultInstanceRole.roleArn,
      },
    });

    // Order Service
    new apprunner.CfnService(this, 'OrderService', {
      serviceName: 'winter-order-service',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        imageRepository: {
          imageIdentifier: `${account}.dkr.ecr.${region}.amazonaws.com/winter-order-service:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '8081',
            runtimeEnvironmentVariables: [
              {
                name: 'SPRING_DATASOURCE_URL',
                value: `jdbc:postgresql://${props.database.dbInstanceEndpointAddress}:${props.database.dbInstanceEndpointPort}/winter_core`,
              },
              {
                name: 'SPRING_DATASOURCE_USERNAME',
                value: 'postgres',
              },
              {
                name: 'SPRING_DATASOURCE_PASSWORD',
                value: props.database.secret?.secretValueFromJson('password').unsafeUnwrap() || '',
              },
            ],
          },
        },
        autoDeploymentsEnabled: false,
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
        },
      },
      instanceConfiguration: {
        instanceRoleArn: orderServiceInstanceRole.roleArn,
      },
    });

    // Inventory Service (Worker)
    new apprunner.CfnService(this, 'InventoryService', {
      serviceName: 'winter-inventory-service',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        imageRepository: {
          imageIdentifier: `${account}.dkr.ecr.${region}.amazonaws.com/winter-inventory-service:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '3000',
          },
        },
        autoDeploymentsEnabled: false,
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
        },
      },
      instanceConfiguration: {
        instanceRoleArn: inventoryServiceInstanceRole.roleArn,
      },
    });

    // Payment Service (Auditor)
    new apprunner.CfnService(this, 'PaymentService', {
      serviceName: 'winter-payment-service',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        imageRepository: {
          imageIdentifier: `${account}.dkr.ecr.${region}.amazonaws.com/winter-payment-service:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '3000',
          },
        },
        autoDeploymentsEnabled: false,
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
        },
      },
      instanceConfiguration: {
        instanceRoleArn: paymentServiceInstanceRole.roleArn,
      },
    });
  }
}
