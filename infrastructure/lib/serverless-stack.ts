import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as apigw2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigw2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface WinterServerlessStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  orderEventsTopic: sns.ITopic;
  inventoryUpdateQueue: sqs.IQueue;
  paymentProcessingQueue: sqs.IQueue;
}

export class WinterServerlessStack extends cdk.Stack {
  public readonly httpApi: apigw2.HttpApi;

  constructor(scope: Construct, id: string, props: WinterServerlessStackProps) {
    super(scope, id, props);

    // Import MongoDB URI secrets from Secrets Manager
    const secret = secretsmanager.Secret.fromSecretNameV2(this, 'ImportedSecrets', 'winter-core-secrets');

    // 1. Create HTTP API Gateway
    this.httpApi = new apigw2.HttpApi(this, 'WinterServerlessApi', {
      apiName: 'WinterServerlessApi',
      description: 'Zero-Cost Serverless API Gateway for Winter E-Commerce Platform',
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [
          apigw2.CorsHttpMethod.GET,
          apigw2.CorsHttpMethod.POST,
          apigw2.CorsHttpMethod.PUT,
          apigw2.CorsHttpMethod.DELETE,
          apigw2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['*'],
      },
    });

    // 3. Lambda Docker Image Functions

    // Frontend BFF Function
    const frontendFunction = new lambda.DockerImageFunction(this, 'FrontendLambda', {
      code: lambda.DockerImageCode.fromEcr(
        ecr.Repository.fromRepositoryName(this, 'FrontendEcrRepo', 'winter-frontend-bff'),
        { tagOrDigest: 'latest' }
      ),
      memorySize: 2048,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        CATALOG_SERVICE_URL: this.httpApi.apiEndpoint,
        ORDER_SERVICE_URL: this.httpApi.apiEndpoint,
      },
    });

    // Catalog Service Function
    const catalogFunction = new lambda.DockerImageFunction(this, 'CatalogLambda', {
      code: lambda.DockerImageCode.fromEcr(
        ecr.Repository.fromRepositoryName(this, 'CatalogEcrRepo', 'winter-catalog-service'),
        { tagOrDigest: 'latest' }
      ),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: secret.secretValueFromJson('MONGODB_URI').unsafeUnwrap(),
      },
    });
    secret.grantRead(catalogFunction);

    // Order Service Function (Reads NEON_DATABASE_URL from Secrets Manager)
    const orderFunction = new lambda.DockerImageFunction(this, 'OrderLambda', {
      code: lambda.DockerImageCode.fromEcr(
        ecr.Repository.fromRepositoryName(this, 'OrderEcrRepo', 'winter-order-service'),
        { tagOrDigest: 'latest' }
      ),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      environment: {
        PORT: '8081',
        AWS_LWA_PORT: '8081',
        SPRING_DATASOURCE_URL: secret.secretValueFromJson('NEON_DATABASE_URL').unsafeUnwrap(),
        SPRING_SNS_TOPIC_ARN: props.orderEventsTopic.topicArn,
      },
    });
    secret.grantRead(orderFunction);
    props.orderEventsTopic.grantPublish(orderFunction);

    // Inventory Service Function (SQS Consumer)
    const inventoryFunction = new lambda.DockerImageFunction(this, 'InventoryLambda', {
      code: lambda.DockerImageCode.fromEcr(
        ecr.Repository.fromRepositoryName(this, 'InventoryEcrRepo', 'winter-inventory-service'),
        { tagOrDigest: 'latest' }
      ),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
      },
    });
    inventoryFunction.addEventSource(new lambdaEventSources.SqsEventSource(props.inventoryUpdateQueue));

    // Payment Service Function (SQS Consumer)
    const paymentFunction = new lambda.DockerImageFunction(this, 'PaymentLambda', {
      code: lambda.DockerImageCode.fromEcr(
        ecr.Repository.fromRepositoryName(this, 'PaymentEcrRepo', 'winter-payment-service'),
        { tagOrDigest: 'latest' }
      ),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
      },
    });
    paymentFunction.addEventSource(new lambdaEventSources.SqsEventSource(props.paymentProcessingQueue));

    // 4. API Gateway Integrations & Routes
    const frontendIntegration = new apigw2Integrations.HttpLambdaIntegration('FrontendIntegration', frontendFunction);
    const catalogIntegration = new apigw2Integrations.HttpLambdaIntegration('CatalogIntegration', catalogFunction);
    const orderIntegration = new apigw2Integrations.HttpLambdaIntegration('OrderIntegration', orderFunction);

    // Catalog Service Routes
    this.httpApi.addRoutes({
      path: '/winter/api/products/{proxy+}',
      methods: [apigw2.HttpMethod.ANY],
      integration: catalogIntegration,
    });
    this.httpApi.addRoutes({
      path: '/winter/api/products',
      methods: [apigw2.HttpMethod.ANY],
      integration: catalogIntegration,
    });

    // Order Service Routes
    this.httpApi.addRoutes({
      path: '/winter/api/orders/{proxy+}',
      methods: [apigw2.HttpMethod.ANY],
      integration: orderIntegration,
    });
    this.httpApi.addRoutes({
      path: '/winter/api/orders',
      methods: [apigw2.HttpMethod.ANY],
      integration: orderIntegration,
    });

    // Frontend BFF Catch-All Routes
    this.httpApi.addRoutes({
      path: '/winter/{proxy+}',
      methods: [apigw2.HttpMethod.ANY],
      integration: frontendIntegration,
    });
    this.httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigw2.HttpMethod.ANY],
      integration: frontendIntegration,
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'ServerlessApiEndpoint', {
      value: this.httpApi.apiEndpoint,
      description: 'Zero-Cost Serverless HTTP API Gateway Endpoint URL',
    });
  }
}
