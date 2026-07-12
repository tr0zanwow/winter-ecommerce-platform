import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import { KubectlV30Layer } from '@aws-cdk/lambda-layer-kubectl-v30';
import { Construct } from 'constructs';

export interface EksStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class WinterEksStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EksStackProps) {
    super(scope, id, props);

    // Instantiate Amazon EKS Cluster with the required kubectlLayer for ALB Controller support
    const cluster = new eks.Cluster(this, 'WinterCluster', {
      vpc: props.vpc,
      version: eks.KubernetesVersion.V1_30,
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

    // Scale down coredns deployment replicas to 1 to fit in small t3.micro nodes
    new eks.KubernetesPatch(this, 'ScaleCoreDnsReplicas', {
      cluster,
      resourceName: 'deployment/coredns',
      resourceNamespace: 'kube-system',
      applyPatch: { spec: { replicas: 1 } },
      restorePatch: { spec: { replicas: 2 } },
    });

    // Add EC2 Compute Group named FrontendComputeGroup in HA configuration across private subnets
    // We use t3.micro for Free Tier compliance, but run 4 nodes to have sufficient total memory (4GB)
    cluster.addNodegroupCapacity('FrontendComputeGroup', {
      instanceTypes: [new ec2.InstanceType('t3.micro')],
      minSize: 4,
      maxSize: 5,
      desiredSize: 4,
      diskSize: 30,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // STEP 1: Implement the RDS PostgreSQL Construct
    const database = new rds.DatabaseInstance(this, 'WinterSharedDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      allocatedStorage: 20,
      maxAllocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      multiAz: false,
      databaseName: 'winter_core',
    });

    // Security Boundary: Allow TCP 5432 ingress from EKS cluster worker nodes to database
    database.connections.allowFrom(cluster.connections, ec2.Port.tcp(5432));
  }
}
