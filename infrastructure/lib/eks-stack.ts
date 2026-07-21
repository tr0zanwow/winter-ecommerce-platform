import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as snsSub from 'aws-cdk-lib/aws-sns-subscriptions';
import { KubectlV30Layer } from '@aws-cdk/lambda-layer-kubectl-v30';
import { Construct } from 'constructs';

export interface EksStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  database: rds.DatabaseInstance;
  orderEventsTopic: sns.Topic;
  inventoryUpdateQueue: sqs.Queue;
  paymentProcessingQueue: sqs.Queue;
}

export class WinterEksStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EksStackProps) {
    super(scope, id, props);

    // Instantiate Amazon EKS Cluster with the required kubectlLayer for ALB Controller support
    const cluster = new eks.Cluster(this, 'WinterCluster', {
      vpc: props.vpc,
      version: eks.KubernetesVersion.V1_35,
      defaultCapacity: 0,
      authenticationMode: eks.AuthenticationMode.API_AND_CONFIG_MAP,
      albController: {
        version: eks.AlbControllerVersion.V2_8_2,
        additionalHelmChartValues: {
          replicaCount: 1,
          resources: {
            requests: {
              cpu: '50m',
              memory: '100Mi',
            },
            limits: {
              cpu: '100m',
              memory: '200Mi',
            },
          },
        } as any,
      },
      kubectlLayer: new KubectlV30Layer(this, 'KubectlV30Layer'),
    });

    // Grant admin access to our local AWS root account session using EKS Access Entry
    new eks.AccessEntry(this, 'RootAccessEntry', {
      cluster: cluster,
      principal: 'arn:aws:iam::880252974759:root',
      accessPolicies: [
        eks.AccessPolicy.fromAccessPolicyName('AmazonEKSClusterAdminPolicy', {
          accessScopeType: eks.AccessScopeType.CLUSTER,
        }),
      ],
    });

    // Grant admin access to our GitHub Actions runner using EKS Access Entry
    new eks.AccessEntry(this, 'GitHubActionsRunnerAccessEntry', {
      cluster: cluster,
      principal: 'arn:aws:iam::880252974759:user/winter-github-actions-runner',
      accessPolicies: [
        eks.AccessPolicy.fromAccessPolicyName('AmazonEKSClusterAdminPolicy', {
          accessScopeType: eks.AccessScopeType.CLUSTER,
        }),
      ],
    });

    // Scale down coredns deployment replicas to 1 to fit in small t3.micro nodes
    new eks.KubernetesPatch(this, 'ScaleCoreDnsReplicas', {
      cluster,
      resourceName: 'deployment/coredns',
      resourceNamespace: 'kube-system',
      applyPatch: { spec: { replicas: 1 } },
      restorePatch: { spec: { replicas: 2 } },
    });

    // Add EC2 Compute Group named FrontendComputeGroup in HA configuration across private subnets
    // We use t3.micro for Free Tier compliance, but run 9 nodes to have sufficient total memory (9GB) and pod slots for loki/promtail monitoring
    cluster.addNodegroupCapacity('FrontendComputeGroup', {
      instanceTypes: [new ec2.InstanceType('t3.micro')],
      minSize: 9,
      maxSize: 10,
      desiredSize: 9,
      diskSize: 30,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Security Boundary: Allow TCP 5432 ingress from EKS cluster worker nodes to database
    new ec2.CfnSecurityGroupIngress(this, 'EksToDbIngressRule', {
      ipProtocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      groupId: props.database.connections.securityGroups[0].securityGroupId,
      sourceSecurityGroupId: cluster.connections.securityGroups[0].securityGroupId,
      description: 'Allow EKS worker nodes to connect to DB',
    });

    // STEP 3: Implement Zero-Trust IAM Roles for Service Accounts (IRSA)
    const orderServiceSA = cluster.addServiceAccount('OrderServiceSA', {
      name: 'order-service-sa',
      namespace: 'default'
    });

    orderServiceSA.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [props.orderEventsTopic.topicArn]
    }));

    const inventoryServiceSA = cluster.addServiceAccount('InventoryServiceSA', {
      name: 'inventory-service-sa',
      namespace: 'default'
    });

    inventoryServiceSA.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:ChangeMessageVisibility'],
      resources: [
        props.inventoryUpdateQueue.queueArn
      ]
    }));

    const paymentServiceSA = cluster.addServiceAccount('PaymentServiceSA', {
      name: 'payment-service-sa',
      namespace: 'default'
    });

    paymentServiceSA.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:ChangeMessageVisibility'],
      resources: [
        props.paymentProcessingQueue.queueArn
      ]
    }));
  }
}
