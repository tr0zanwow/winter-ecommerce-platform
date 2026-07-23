import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface EcsExpressStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  database: rds.DatabaseInstance;
  orderEventsTopic: sns.ITopic;
  inventoryUpdateQueue: sqs.IQueue;
  paymentProcessingQueue: sqs.IQueue;
}

export class WinterEcsExpressStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsExpressStackProps) {
    super(scope, id, props);

    const account = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;

    // STEP 1: ECS Cluster
    const cluster = new ecs.Cluster(this, 'WinterEcsCluster', {
      vpc: props.vpc,
      clusterName: 'WinterEcsCluster',
    });

    // CloudWatch Log Group for centralized logs
    const logGroup = new logs.LogGroup(this, 'WinterEcsLogGroup', {
      logGroupName: '/ecs/winter-express',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // STEP 2: Application Load Balancer
    const albSg = new ec2.SecurityGroup(this, 'WinterEcsAlbSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'Security Group for Winter ECS ALB',
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP public traffic');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS public traffic');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3000), 'Allow catalog-service internal ingress');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8081), 'Allow order-service internal ingress');

    const alb = new elbv2.ApplicationLoadBalancer(this, 'WinterEcsAlb', {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      internetFacing: true,
      loadBalancerName: 'WinterEcsAlb',
      securityGroup: albSg,
    });

    // ALB Listeners
    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    const catalogListener = alb.addListener('CatalogListener', {
      port: 3000,
      open: true,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    const orderListener = alb.addListener('OrderListener', {
      port: 8081,
      open: true,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    // STEP 3: Task Security Groups & Ingress rules
    const taskSg = new ec2.SecurityGroup(this, 'TaskSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'Security Group for ECS Fargate Tasks',
    });
    taskSg.addIngressRule(albSg, ec2.Port.tcp(3000), 'Allow traffic from ALB on port 3000');
    taskSg.addIngressRule(albSg, ec2.Port.tcp(8081), 'Allow traffic from ALB on port 8081');

    // Security Boundary: Ingress rule on Database SG to allow ECS Task SG access
    new ec2.CfnSecurityGroupIngress(this, 'EcsToDbIngressRule', {
      ipProtocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      groupId: props.database.connections.securityGroups[0].securityGroupId,
      sourceSecurityGroupId: taskSg.securityGroupId,
      description: 'Allow ECS tasks to connect to DB',
    });

    // STEP 4: IAM Task Roles
    const executionRole = new iam.Role(this, 'EcsExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    executionRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: [
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'ecr:GetAuthorizationToken',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }));

    const defaultTaskRole = new iam.Role(this, 'DefaultTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    const orderServiceTaskRole = new iam.Role(this, 'OrderServiceTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    orderServiceTaskRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [props.orderEventsTopic.topicArn],
    }));

    const inventoryServiceTaskRole = new iam.Role(this, 'InventoryServiceTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    inventoryServiceTaskRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:ChangeMessageVisibility'],
      resources: [props.inventoryUpdateQueue.queueArn],
    }));

    const paymentServiceTaskRole = new iam.Role(this, 'PaymentServiceTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    paymentServiceTaskRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:ChangeMessageVisibility'],
      resources: [props.paymentProcessingQueue.queueArn],
    }));

    // Import MongoDB URI secrets from Secrets Manager
    const secret = secretsmanager.Secret.fromSecretNameV2(this, 'ImportedSecrets', 'winter-core-secrets');

    // STEP 5: Route 53 Private Hosted Zones for VPC-Internal Resolution
    const catalogZone = new route53.PrivateHostedZone(this, 'CatalogZone', {
      vpc: props.vpc,
      zoneName: 'catalog-service',
    });
    new route53.ARecord(this, 'CatalogAliasRecord', {
      zone: catalogZone,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(alb)),
    });

    const orderZone = new route53.PrivateHostedZone(this, 'OrderZone', {
      vpc: props.vpc,
      zoneName: 'order-service',
    });
    new route53.ARecord(this, 'OrderAliasRecord', {
      zone: orderZone,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(alb)),
    });

    const redisZone = new route53.PrivateHostedZone(this, 'RedisZone', {
      vpc: props.vpc,
      zoneName: 'redis-service',
    });
    new route53.ARecord(this, 'RedisLocalhostRecord', {
      zone: redisZone,
      target: route53.RecordTarget.fromValues('127.0.0.1'),
    });

    // STEP 6: Fargate Service Instantiations

    // 1. Frontend BFF Service
    const frontendTaskDef = new ecs.FargateTaskDefinition(this, 'FrontendTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole,
      taskRole: defaultTaskRole,
    });
    frontendTaskDef.addContainer('frontend', {
      image: ecs.ContainerImage.fromRegistry(`${account}.dkr.ecr.${region}.amazonaws.com/winter-frontend-bff:latest`),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'frontend-bff',
      }),
      portMappings: [{ containerPort: 3000 }],
    });

    const frontendService = new ecs.FargateService(this, 'FrontendService', {
      cluster,
      taskDefinition: frontendTaskDef,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [taskSg],
      desiredCount: 1,
      serviceName: 'winter-frontend-bff',
    });

    const frontendTargetGroup = new elbv2.ApplicationTargetGroup(this, 'FrontendTargetGroup', {
      vpc: props.vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/winter',
        healthyHttpCodes: '200-499',
      },
    });
    frontendTargetGroup.addTarget(frontendService);

    // Route public port 80 to Frontend BFF path `/winter*`
    httpListener.addTargetGroups('FrontendTargetRule', {
      priority: 30,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/winter*'])],
      targetGroups: [frontendTargetGroup],
    });

    // Default ALB path routes to Frontend BFF
    httpListener.addAction('DefaultHttpAction', {
      action: elbv2.ListenerAction.forward([frontendTargetGroup]),
    });

    // 2. Catalog Service
    const catalogTaskDef = new ecs.FargateTaskDefinition(this, 'CatalogTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole,
      taskRole: defaultTaskRole,
    });
    catalogTaskDef.addContainer('catalog', {
      image: ecs.ContainerImage.fromRegistry(`${account}.dkr.ecr.${region}.amazonaws.com/winter-catalog-service:latest`),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'catalog-service',
      }),
      portMappings: [{ containerPort: 3000 }],
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(secret, 'MONGODB_URI'),
      },
    });
    catalogTaskDef.addContainer('redis', {
      image: ecs.ContainerImage.fromRegistry('redis:7-alpine'),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'catalog-redis',
      }),
      portMappings: [{ containerPort: 6379 }],
    });

    const catalogService = new ecs.FargateService(this, 'CatalogService', {
      cluster,
      taskDefinition: catalogTaskDef,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [taskSg],
      desiredCount: 1,
      serviceName: 'winter-catalog-service',
    });

    const catalogTargetGroup = new elbv2.ApplicationTargetGroup(this, 'CatalogTargetGroup', {
      vpc: props.vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/winter/api/products/health',
        healthyHttpCodes: '200-499',
      },
    });
    catalogTargetGroup.addTarget(catalogService);

    // Route public port 80 to Catalog Service path `/winter/api/products*`
    httpListener.addTargetGroups('CatalogTargetRule', {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/winter/api/products*'])],
      targetGroups: [catalogTargetGroup],
    });

    // Default action on port 3000 listener goes directly to Catalog Service
    catalogListener.addAction('DefaultCatalogAction', {
      action: elbv2.ListenerAction.forward([catalogTargetGroup]),
    });

    // 3. Order Service
    const orderTaskDef = new ecs.FargateTaskDefinition(this, 'OrderTaskDef', {
      memoryLimitMiB: 1024,
      cpu: 512,
      executionRole,
      taskRole: orderServiceTaskRole,
    });
    orderTaskDef.addContainer('order', {
      image: ecs.ContainerImage.fromRegistry(`${account}.dkr.ecr.${region}.amazonaws.com/winter-order-service:latest`),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'order-service',
      }),
      portMappings: [{ containerPort: 8081 }],
      environment: {
        SPRING_DATASOURCE_URL: `jdbc:postgresql://${props.database.dbInstanceEndpointAddress}:${props.database.dbInstanceEndpointPort}/winter_core`,
        SPRING_DATASOURCE_USERNAME: 'postgres',
      },
      secrets: {
        SPRING_DATASOURCE_PASSWORD: ecs.Secret.fromSecretsManager(props.database.secret!, 'password'),
      },
    });

    const orderService = new ecs.FargateService(this, 'OrderService', {
      cluster,
      taskDefinition: orderTaskDef,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [taskSg],
      desiredCount: 1,
      serviceName: 'winter-order-service',
    });

    const orderTargetGroup = new elbv2.ApplicationTargetGroup(this, 'OrderTargetGroup', {
      vpc: props.vpc,
      port: 8081,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/winter/api/orders/health',
        healthyHttpCodes: '200-499',
      },
    });
    orderTargetGroup.addTarget(orderService);

    // Route public port 80 to Order Service path `/winter/api/orders*`
    httpListener.addTargetGroups('OrderTargetRule', {
      priority: 20,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/winter/api/orders*'])],
      targetGroups: [orderTargetGroup],
    });

    // Default action on port 8081 listener goes directly to Order Service
    orderListener.addAction('DefaultOrderAction', {
      action: elbv2.ListenerAction.forward([orderTargetGroup]),
    });

    // 4. Inventory Worker (Non-HTTP consumer)
    const inventoryTaskDef = new ecs.FargateTaskDefinition(this, 'InventoryTaskDef', {
      memoryLimitMiB: 512, // Minimum compatible memory with cpu: 256 for Fargate
      cpu: 256,
      executionRole,
      taskRole: inventoryServiceTaskRole,
    });
    inventoryTaskDef.addContainer('inventory', {
      image: ecs.ContainerImage.fromRegistry(`${account}.dkr.ecr.${region}.amazonaws.com/winter-inventory-service:latest`),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'inventory-service',
      }),
    });

    new ecs.FargateService(this, 'InventoryService', {
      cluster,
      taskDefinition: inventoryTaskDef,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [taskSg],
      desiredCount: 1,
      serviceName: 'winter-inventory-service',
    });

    // 5. Payment Auditor (Non-HTTP consumer)
    const paymentTaskDef = new ecs.FargateTaskDefinition(this, 'PaymentTaskDef', {
      memoryLimitMiB: 512, // Minimum compatible memory with cpu: 256 for Fargate
      cpu: 256,
      executionRole,
      taskRole: paymentServiceTaskRole,
    });
    paymentTaskDef.addContainer('payment', {
      image: ecs.ContainerImage.fromRegistry(`${account}.dkr.ecr.${region}.amazonaws.com/winter-payment-service:latest`),
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'payment-service',
      }),
    });

    new ecs.FargateService(this, 'PaymentService', {
      cluster,
      taskDefinition: paymentTaskDef,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [taskSg],
      desiredCount: 1,
      serviceName: 'winter-payment-service',
    });
  }
}
