# EKS & VPC Infrastructure Walkthrough & Handshake Context

This document details the live deployment of the Next.js presentation application onto the active Amazon EKS cluster, along with backend microservices bootstrapping, containerization, and GitHub Actions CI/CD automation.

---

## 📂 Project Directory Structure

```
.
├── .github
│   └── workflows
│       ├── catalog-service-pipeline.yaml
│       ├── frontend-pipeline.yaml
│       ├── infrastructure-pipeline.yaml         [NEW]
│       ├── inventory-service-pipeline.yaml      [NEW]
│       └── order-service-pipeline.yaml
├── .vscode
│   └── settings.json
├── backend
│   ├── catalog-service
│   │   ├── k8s
│   │   │   ├── deployment.yaml
│   │   │   └── secrets.yaml              [NEW]
│   │   ├── src
│   │   │   ├── products
│   │   │   │   ├── schemas
│   │   │   │   │   └── product.schema.ts         [NEW]
│   │   │   │   ├── products.controller.ts
│   │   │   │   ├── products.module.ts
│   │   │   │   └── products.service.ts
│   │   │   ├── app.controller.spec.ts
│   │   │   ├── app.controller.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.service.ts
│   │   │   └── main.ts
│   │   ├── test
│   │   │   ├── app.e2e-spec.ts
│   │   │   └── jest-e2e.json
│   │   ├── .env
│   │   ├── .prettierrc
│   │   ├── Dockerfile
│   │   ├── eslint.config.mjs
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── tsconfig.build.json
│   │   └── tsconfig.json
│   ├── inventory-service
│   │   ├── k8s
│   │   │   └── deployment.yaml               [NEW]
│   │   ├── src
│   │   │   ├── queue
│   │   │   │   └── sqs-consumer.service.ts   [NEW]
│   │   │   ├── app.controller.spec.ts
│   │   │   ├── app.controller.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.service.ts
│   │   │   └── main.ts
│   │   ├── test
│   │   │   ├── app.e2e-spec.ts
│   │   │   └── jest-e2e.json
│   │   ├── .gitignore                        [NEW]
│   │   ├── .prettierrc
│   │   ├── eslint.config.mjs
│   │   ├── nest-cli.json
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── tsconfig.build.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile                        [NEW]
│   ├── order-service
│   │   ├── k8s
│   │   │   └── deployment.yaml
│   │   ├── src
│   │   │   ├── main
│   │   │   │   ├── java
│   │   │   │   │   └── com
│   │   │   │   │       └── winter
│   │   │   │   │           └── platform
│   │   │   │   │               └── orderservice
│   │   │   │   │                   ├── domain
│   │   │   │   │                   │   ├── models
│   │   │   │   │                   │   │   ├── OrderCreatedEvent.java            [NEW]
│   │   │   │   │                   │   │   ├── OrderHealthStatus.java
│   │   │   │   │                   │   │   └── OrderItemDTO.java                 [NEW]
│   │   │   │   │                   │   └── ports
│   │   │   │   │                   │       ├── in
│   │   │   │   │                   │       │   └── CheckOrderHealthUseCase.java
│   │   │   │   │                   │       └── out
│   │   │   │   │                   │           └── (ports-out)
│   │   │   │   │                   ├── infrastructure
│   │   │   │   │                   │   └── adapters
│   │   │   │   │                   │       ├── in
│   │   │   │   │                   │       │   └── web
│   │   │   │   │                   │       │       ├── OrderCheckoutAdapter.java [NEW]
│   │   │   │   │                   │       │       └── OrderHealthAdapter.java
│   │   │   │   │                   │       └── out
│   │   │   │   │                   │           ├── messaging
│   │   │   │   │                   │           │   └── OrderEventPublisherAdapter.java [NEW]
│   │   │   │   │                   │           └── persistence
│   │   │   │   │                   └── OrderServiceApplication.java
│   │   │   │   └── resources
│   │   │   │       └── application.yml
│   │   │   └── test
│   │   │       └── java
│   │   │           └── com
│   │   │               └── winter
│   │   │                   └── platform
│   │   │                       └── orderservice
│   │   │                           └── OrderServiceApplicationTests.java
│   │   ├── Dockerfile
│   │   ├── mvnw
│   │   ├── mvnw.cmd
│   │   └── pom.xml
│   └── payment-service
├── frontend
│   ├── k8s
│   │   ├── deployment.yaml
│   │   └── ingress.yaml
│   ├── public
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   ├── src
│   │   └── app
│   │       ├── api
│   │       │   └── graphql
│   │       │       └── route.ts             [NEW]
│   │       ├── favicon.ico
│   │       ├── globals.css
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.mjs
│   └── tsconfig.json
├── infrastructure
│   ├── lib
│   │   ├── eks-stack.ts
│   │   └── vpc-stack.ts
│   ├── test
│   │   └── infrastructure-cdk.test.ts
│   ├── cdk.json
│   ├── jest.config.js
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
├── LICENSE
└── README.md
```

---

## 📋 Task List Accomplished

### Phase 1: Infrastructure Provisioning
- [x] **VPC Infrastructure Setup**: Built a secure multi-AZ VPC (`WinterCoreVpc`) with public, private, and isolated subnets and NAT Gateways.
- [x] **EKS Cluster V2 Creation**: Deployed an Amazon EKS cluster running Kubernetes version `V1_30` using the CDK Stack `WinterEksStackV2`.
- [x] **API Access Entries Mapped**: Enabled `API_AND_CONFIG_MAP` authentication mode on the EKS cluster and granted the local AWS root user account the `AmazonEKSClusterAdminPolicy` access policy.
- [x] **Worker Node Provisioning**: Configured and launched **4 `t3.micro` nodes** to bypass Free Tier restrictions while maintaining 3.6 GB of allocatable RAM cluster-wide.
- [x] **EKS Pod Tuning (Resource Constrained Node Fix)**:
  * Scaled CoreDNS down to **1 replica** to free memory overhead.
  * Deployed AWS Load Balancer Controller version `V2_8_2` scaled to **1 replica** with tuned resource requests/limits (`100Mi` - `200Mi`).

### Phase 2: Next.js Frontend Containerization & ECR Push
- [x] **Standalone Next.js Configuration**: Configured `next.config.ts` to set `output: 'standalone'` for optimized production builds.
- [x] **Multi-Stage Dockerfile**: Created a production-grade 3-stage `Dockerfile` in `frontend/` based on `node:20-alpine` with non-root security execution.
- [x] **ECR Registry Creation**: Provisioned private repository `winter-frontend-bff` on Amazon ECR.
- [x] **Docker MTU Tuning (WSL Packet Drop Fix)**: Set MTU to `1400` inside WSL and the `vpnKitMTU` settings to resolve TCP black-hole timeouts during ECR image pushes.
- [x] **Build, Tag & Push**: Successfully built, tagged, and pushed the production Next.js frontend image (`latest` and a test `alpine` image) to Amazon ECR.

### Phase 3: Live Kubernetes Deployment & Load Balancer Routing
- [x] **Kubernetes Manifest Preparation**: Created standard Deployment, Service, and Ingress manifests under `frontend/k8s/`.
- [x] **Manifest Application**: Executed `kubectl apply -f k8s/deployment.yaml` and `kubectl apply -f k8s/ingress.yaml` to deploy resources directly to the cluster control plane.
- [x] **EKS Scheduling Verification**: Monitored scheduling success and verified the `frontend` pod transitioned to the `Running` state successfully.
- [x] **ALB Provisioning**: Verified the AWS Load Balancer Controller reconciled the Ingress resource and provisioned a public Application Load Balancer endpoint.
- [x] **Host Header Lock down**: Bound the Ingress to `projects.pranilrathod.dev` (accessing directly without the host header yields `404 Not Found`).

### Phase 4: Order Service Bootstrapping & Hexagonal Architecture
- [x] **Spring Boot Scaffolding**: Fetched Spring Boot 3.5.16 starter package with Web, Data JPA, PostgreSQL, and Lombok via start.spring.io API, extracting it cleanly to `backend/order-service/`.
- [x] **Spring Boot Version Align**: Edited `pom.xml` to downgrade parent version to `3.3.2` to align with the enterprise runtime baseline version.
- [x] **Hexagonal Architecture package structure**: Created directory layout for domain models, ports, and adapters (`domain/models`, `domain/ports/in`, `domain/ports/out`, `infrastructure/adapters/in/web`, `infrastructure/adapters/out/persistence`).
- [x] **Compilation baseline validation**: Ran Maven wrapper clean compile check (`.\mvnw.cmd clean compile`) to confirm dependency download and compiler success.
- [x] **Local verification build & API check**: Started the application via `.\mvnw.cmd spring-boot:run` on port 8081, connected successfully to local PostgreSQL, and queried `/api/orders/health` yielding the expected JSON response payload.

### Phase 5: Order Service Containerization & ECR Push
- [x] **Multi-Stage Dockerfile Scaffolding**: Structured a secure production Dockerfile at `backend/order-service/Dockerfile` separating compilation (`eclipse-temurin:21-jdk` base) and runtime (`eclipse-temurin:21-jre-alpine` base) layers under a non-root system user context.
- [x] **Private ECR Repository Provisioning**: Created the remote AWS private repository `winter-order-service` under account registry `880252974759` in `us-east-1`.
- [x] **Docker Image Build & Push**: Successfully built, tagged, and pushed `winter-order-service:latest` image directly to the Amazon ECR repository.

### Phase 6: EKS Cluster Deployment & Path-Based Routing
- [x] **Order Service Manifest Scaffolding**: Structured Kubernetes Deployment and Service resource definition under `backend/order-service/k8s/deployment.yaml` with optimized CPU/Memory bounds.
- [x] **Path-Based Ingress Setup**: Modified `frontend/k8s/ingress.yaml` to route prefix `/api/orders` to `order-service:8081` prior to catch-all root paths.
- [x] **Orchestration Execution & Reconciliation**: Applied manifests (`kubectl apply`) and confirmed pod startup and ALB Controller reconciliation logs show successful configuration.

### Phase 7: GitHub Actions CI/CD Automation Pipelines
- [x] **Access Entries Mapping**: Created EKS access entry for `arn:aws:iam::880252974759:user/winter-github-actions-runner` and associated the `AmazonEKSClusterAdminPolicy` cluster access policy.
- [x] **Actions Workflow Configuration**: Configured path-based CI/CD pipelines under `.github/workflows/frontend-pipeline.yaml` and `.github/workflows/order-service-pipeline.yaml` to automate checkout, AWS credentials parsing, ECR builds/pushes, and EKS deployments.
- [x] **DescribeCluster IAM Fix**: Added inline policy `EksClusterAccess` granting `eks:DescribeCluster` and `eks:ListClusters` to the runner IAM user.
- [x] **Gitignore .mvn Fix**: Commented out `.mvn/` exclusion in the root `.gitignore` file so Maven wrapper properties are tracked and committed.
- [x] **Frontend Order Service Integration**: Refactored the frontend dashboard BFF layer to query `https://projects.pranilrathod.dev/winter/api/orders/health` externally to ensure correct base URL accessibility across EKS and local developer workstations.

### Phase 8: NestJS Catalog Service Bootstrapping
- [x] **NestJS Application Scaffolding**: Utilized `@nestjs/cli` to generate a strict, production-grade TypeScript NestJS application named `catalog-service` inside the `backend/` directory.
- [x] **Fastify HTTP Migration**: Installed `@nestjs/platform-fastify` and `fastify`, migrating `src/main.ts` from default Express to Fastify for higher performance, while configuring it to bind to all network interfaces (`0.0.0.0`) for container compatibility.
- [x] **Product Domain Scaffolding**: Auto-generated the products module, controller, and service to establish a clean products domain boundary.
- [x] **Compilation baseline validation**: Ran `npm run build` to confirm standard TypeScript compilations parse and build cleanly.

### Phase 9: Catalog Service Containerization, Registry & Kubernetes Routing
- [x] **Production Multi-Stage Dockerfile**: Structured a secure production Dockerfile at `backend/catalog-service/Dockerfile` separating dependency installation, TypeScript compilation, and runtime layers.
- [x] **Kubernetes Deployment & Service Manifests**: Wrote manifests under `backend/catalog-service/k8s/deployment.yaml` defining the deployment of the catalog-service container (CPU/memory resources constrained for `t3.micro` stability) and its ClusterIP service on port 3000.
- [x] **AWS ECR Repository Creation**: Created the remote AWS private repository `winter-catalog-service` under account registry `880252974759` in `us-east-1`.
- [x] **Ingress Route Configuration**: Updated `frontend/k8s/ingress.yaml` to route path prefix `/api/products` directly to the `catalog-service` ClusterIP service.
- [x] **GitHub Actions Pipeline Setup**: Created `.github/workflows/catalog-service-pipeline.yaml` to automate checkout, ECR builds/pushes, and EKS deployments, triggered on push events for paths matching `backend/catalog-service/**` on the `develop` branch.

### Phase 10: Prisma ORM Integration in Catalog Service
- [x] **Prisma & Client Libraries Setup**: Installed `prisma` as a development dependency and `@prisma/client` as a runtime dependency within `backend/catalog-service/`.
- [x] **Prisma Configuration Initialization**: Bootstrapped configurations using `npx prisma init`, creating the schema definition file and environment variable templates.
- [x] **Product Domain Database Modeling**: Structured PostgreSQL schema mappings for `Category` (UUID key, unique slug index, timestamps) and `Product` (UUID key, unique slug and SKU indexes, category relations).
- [x] **Type-Safe Client Generation**: Compiled optimized Prisma client TypeScript interface definitions locally via `npx prisma generate` under `node_modules/@prisma/client`.
- [x] **NestJS TypeScript Compilation Validation**: Successfully executed `npm run build` inside `backend/catalog-service/` to verify compile-time type-safety without build mismatches.

### Phase 11: RDS PostgreSQL Database Layer Provisioning
- [x] **RDS Database Construct Setup**: Defined the managed `WinterSharedDatabase` instance inside isolated private subnets using AWS CDK PostgreSQL 16 on Graviton2 (`db.t4g.micro`, 20GB GP2 storage).
- [x] **EKS Ingress Security Boundaries**: Allowed TCP port 5432 ingress traffic to the database exclusively from EKS cluster worker nodes security group (`cluster.connections`).
- [x] **CloudFormation Rollout**: Executed stack deployment and verified successful provisioning with AWS CloudFormation stack state `UPDATE_COMPLETE` and database instance status `available`.

### Phase 12: CDK Infrastructure GitOps pipeline
- [x] **Automation Workflow Scaffolding**: Generated GitOps orchestrator configuration at `.github/workflows/infrastructure-pipeline.yaml` running on `ubuntu-latest` nodes.
- [x] **Target Branch and Path Triggers**: Configured trigger rules listening on push and pull request hooks for the `main` branch, locked down strictly to matches in the `infrastructure/**` path workspace.
- [x] **Verification & Compilation Setup**: Embedded Node.js v20 initialization steps, AWS credentials decryption via Actions secret scope, and `npm ci` toolchain setup within the `infrastructure/` directory context.
- [x] **Conditional Execution Flow**: Structured automated `cdk diff` logic for PR previews (Phase A) and automated `cdk deploy` pipelines for merges to `main` branch (Phase B).

### Phase 13: Polymorphic MongoDB Re-architecting with Mongoose
- [x] **Prisma Clean Purge**: Uninstalled `prisma` and `@prisma/client` from `catalog-service`, deleting all tracking schema directories and workspace-level configuration files.
- [x] **MongoDB Atlas Connection Configuration**: Injected live Atlas collection connection coordinates into `.env` file via `DATABASE_URL` parameter.
- [x] **Polymorphic Document Model**: Structured NestJS Mongoose schema definitions in `src/products/schemas/product.schema.ts` with type-safe properties and an open-ended `attributes` field mapped to raw `Schema.Types.Mixed` to enable unstructured, polymorphic product schemas.
- [x] **Database Context Bootstrapping**: Registered and configured connection contexts at the global `AppModule` tier and registered schema features at the local `ProductsModule` tier.
- [x] **Clean compilation validation**: Ran TypeScript baseline compiler build pipeline (`npm run build`) in `backend/catalog-service` to verify structural integrity.

### Phase 14: Secure Credentials & Deployment Configuration
- [x] **Kubernetes Secret Provisioning**: Configured `winter-core-secrets` secret object inside EKS cluster containing both Postgres RDS and MongoDB Atlas credentials.
- [x] **Credential Redaction**: Redacted plaintext values in local `secrets.yaml` to ensure no sensitive passwords leak into git repository control history.
- [x] **Secrets Injection**: Configured environment injections in `catalog-service` deployment manifest for `DATABASE_URL` and `order-service` deployment manifest for `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`.
- [x] **Automation Pipeline Alignment**: Configured service deployment automation pipelines (catalog-service, order-service, frontend) to trigger on pushes to the `develop` branch, while the core infrastructure CDK automation pipeline triggers on pushes to the `main` branch.
- [x] **IAM Runner Permissions Provisioning**: Attached the AWS managed `AdministratorAccess` policy to the `winter-github-actions-runner` IAM user to resolve authorization blocks during stack lookup (`cloudformation:DescribeStacks`) and enable clean CDK orchestration runs.

### Phase 15: Ingress Sync & Catalog Database Transaction Handlers
- [x] **EKS Ingress Rule Alignment**: Verified `/api/products` prefix path configuration in `frontend/k8s/ingress.yaml` correctly references `catalog-service` on port `3000` and is positioned above the catch-all root (`/`) path.
- [x] **Polymorphic Database Operations**: Injected the Mongoose `Product` model into `ProductsService` and implemented asynchronous data access routines: `findAll()` (retrieving active products) and `create(dto)` (saving unstructured product documents).
- [x] **Web Controller Endpoint Mapping**: Exposed `GET /` and `POST /` routes in `ProductsController` to invoke the database service routines, providing polymorphic endpoints for catalog queries and inserts.
- [x] **Local Fastify Compilation Validation**: Successfully ran TypeScript compiler (`npm run build`) for `catalog-service` to ensure clean execution.
- [x] **DNS Resolver Fallback**: Configured Google and Cloudflare DNS fallback resolution (`dns.setServers(['8.8.8.8', '1.1.1.1'])`) in `main.ts` to prevent local `ECONNREFUSED` connection failures during MongoDB Atlas connection bootstrapping.

### Phase 16: Spring Cloud AWS SNS Integration in order-service
- [x] **Root `.gitignore` Optimization**: Adjusted the root IntelliJ output exclusion from `out/` to `/out/` to prevent standard hexagonal `adapters.out` package paths in Java from being recursively ignored.
- [x] **Spring Cloud AWS SNS Starter Integration**: Added `io.awspring.cloud:spring-cloud-aws-starter-sns:3.1.1` starter dependency to `backend/order-service/pom.xml`.
- [x] **AWS Regional Config Integration**: Configured AWS region `us-east-1` and default credentials provider settings in `backend/order-service/src/main/resources/application.yml`.
- [x] **Immutable Domain Event Payload Records**: Implemented `OrderItemDTO.java` and `OrderCreatedEvent.java` as immutable records to model structured order creation event payloads.
- [x] **Hexagonal Adapter for SNS Publishing**: Created `OrderEventPublisherAdapter.java` utilizing `SnsTemplate` to publish order creation events asynchronously to the target topic `arn:aws:sns:us-east-1:880252974759:WinterOrderEventsTopic`.
- [x] **Compile and Push Verification**: Successfully compiled `order-service` via `./mvnw clean compile` and pushed changes to the `develop` branch.

### Phase 17: Scaffold NestJS Inventory Service Worker & SQS Long Poller
- [x] **NestJS Application Scaffolding**: Utilized `@nestjs/cli` to generate a strict TypeScript NestJS application named `inventory-service` inside the `backend/` directory.
- [x] **AWS SDK SQS Client Integration**: Installed `@aws-sdk/client-sqs` and `dotenv` to poll AWS SQS.
- [x] **Non-Blocking SQS Polling Service**: Implemented `SqsConsumerService` in `src/queue/` running asynchronous background long-polling loop with 20 seconds wait time, printing logs matching `[INVENTORY WORKER] Intercepted Order Created Event Payload: ${message.Body}`, and deleting handled records.
- [x] **Service Registration**: Registered `SqsConsumerService` as a provider inside the global `AppModule`.
- [x] **Kubernetes Pod Resource Boundaries**: Configured Deployment manifest in `k8s/deployment.yaml` with resource limits (`30m` CPU / `96Mi` Memory) and requests (`10m` CPU / `48Mi` Memory) and zero port bindings.
- [x] **Compilation and Git Push Verification**: Confirmed successful TypeScript build (`npm run build`) and pushed changes to the `develop` branch.

### Phase 18: Live Checkout Event Pipeline Simulator
- [x] **POST Rest Route Exposure**: Created `OrderCheckoutAdapter.java` controller exposing the endpoint `POST /api/orders/test-checkout`.
- [x] **JSON Request Mapping**: Configured payload structures (`CheckoutRequest`, `CheckoutItem`) mapping user requests.
- [x] **Deterministic ID & Total Calculations**: Added mock order code generation (`"ORD-"` prefix) and computed transaction price summation.
- [x] **SNS Messaging Publisher Integration**: Injected the custom `OrderEventPublisherAdapter` bean to automatically route order creations straight to the live Amazon SNS event topic hub.
- [x] **Verification and Push**: Successfully compiled the adapter via Maven wrapper compile command and pushed changes directly to the remote tracking branch `develop`.

### Phase 19: Containerize inventory-service & Set up GitHub Actions CI/CD
- [x] **Multi-Stage Dockerfile Scaffolding**: Structured a secure `node:20-alpine` Dockerfile for building the NestJS bundle, using the non-root system user `node` for runtime execution.
- [x] **CI/CD Workflow Pipeline Configuration**: Defined GitHub Actions workflow `inventory-service-pipeline.yaml` that triggers on pushes to branch `develop` targeting `backend/inventory-service/` workspace.
- [x] **Automated Build & Release Process**: Setup credentials verification, ECR registry logins, dependencies caching, compiler validation, AWS ECR docker push, and Kubernetes deployment rollout checks.
- [x] **Synchronization and Verification**: Checked git tracking status, committed all deployment resources, and pushed commits directly to the remote branch `develop`.

---

## 🛠 Active AWS Infrastructure Resources

### 1. VPC Networking Stack (`WinterVpcStack`)
* **CIDR Block**: `10.0.0.0/16`
* **NAT Gateways**: 1 NAT Gateway

### 2. EKS Cluster Stack (`WinterEksStackV2`)
* **Cluster Name**: `WinterClusterE1A7478C-5bf7dcc0943642d3996ad81e136570a4`
* **Kubernetes Version**: `1.30`
* **Worker Nodes**: 4 nodes of `t3.micro` in private subnets.

### 3. Elastic Container Registry (ECR)
* **Frontend BFF Private Repository**: `winter-frontend-bff`
* **Order Service Private Repository**: `winter-order-service`
* **Catalog Service Private Repository**: `winter-catalog-service`
* **Inventory Service Private Repository**: `winter-inventory-service`
* **Active Images**:
  * `880252974759.dkr.ecr.us-east-1.amazonaws.com/winter-frontend-bff:latest`
  * `880252974759.dkr.ecr.us-east-1.amazonaws.com/winter-order-service:latest`
  * `880252974759.dkr.ecr.us-east-1.amazonaws.com/winter-catalog-service:latest`
  * `880252974759.dkr.ecr.us-east-1.amazonaws.com/winter-inventory-service:latest`

### 4. Application Load Balancer (ALB) Routing
* **Ingress Resource**: `frontend-ingress` (in namespace `default`)
* **DNS Name (Public ALB Endpoint)**: `k8s-default-frontend-281a5f0f2e-1048460682.us-east-1.elb.amazonaws.com`
* **Target Group**:
  * `k8s-default-frontend-1ae3c5c6ee` mapping path `/` to container port `3000` (via service `frontend-service` on port `80`).
  * `k8s-default-orderser-servi-` mapping path `/api/orders` to container port `8081` (via service `order-service` on port `8081`).
  * Mapping path `/api/products` to container port `3000` (via service `catalog-service` on port `3000`).

### 5. PostgreSQL RDS Database (`WinterSharedDatabase`)
* **Instance ID**: `wintereksstackv2-wintershareddatabaseeb2940fc-jxnf0cicfhri`
* **Host**: `wintereksstackv2-wintershareddatabaseeb2940fc-jxnf0cicfhri.cyv60m6m8rp7.us-east-1.rds.amazonaws.com`
* **Port**: `5432`
* **Master User**: `postgres`
* **Master DB Name**: `winter_core`
* **Credentials Secret**: `WinterSharedDatabaseSecretC-20cSA1tzVhkc`

### 6. MongoDB Atlas Database (`winter_catalog`)
* **Cluster Name**: `winter-core-cluster`
* **Username**: `contact_db_user`
* **Database Name**: `winter_catalog`
* **Polymorphic Collection**: `products`

---

## 🔍 Validation Command Outputs

### 1. Application Pod Status
```bash
$ kubectl get pods
NAME                                           READY   STATUS    RESTARTS   AGE
catalog-service-deployment-799958f59c-5bbwd   1/1     Running   0          144m
frontend-deployment-976cc9944-649gk            1/1     Running   0          144m
order-service-deployment-796cbf8dcc-7k7th     1/1     Running   0          11m
```

### 2. Ingress State & Public Endpoint
```bash
$ kubectl get ingress frontend-ingress
NAME               CLASS    HOSTS                       ADDRESS                                                                 PORTS   AGE
frontend-ingress   <none>   projects.pranilrathod.dev   k8s-default-frontend-281a5f0f2e-1048460682.us-east-1.elb.amazonaws.com   80      171m
```

### 3. Ingress Route Descriptions
```bash
$ kubectl describe ingress frontend-ingress
Rules:
  Host                        Path  Backends
  ----                        ----  --------
  projects.pranilrathod.dev  
                              /api/orders   order-service:8081 (10.0.3.160:8081)
                              /             frontend-service:80 (10.0.2.54:3000)
Events:
  Type    Reason                  Age                From     Message
  ----    ------                  ----               ----     -------
  Normal  SuccessfullyReconciled  18s (x2 over 167m)  ingress  Successfully reconciled
```

### 4. Custom Host Header Verification Rules
```bash
# 1. Access without custom host header returns 404 (Locked down)
$ curl.exe -i http://k8s-default-frontend-281a5f0f2e-1048460682.us-east-1.elb.amazonaws.com
HTTP/1.1 404 Not Found
Server: awselb/2.0

# 2. Access with projects.pranilrathod.dev Host header returns 200 OK
$ curl.exe -i -H "Host: projects.pranilrathod.dev" http://k8s-default-frontend-281a5f0f2e-1048460682.us-east-1.elb.amazonaws.com
HTTP/1.1 200 OK
Content-Type: text/html
...
```

### 5. Order Service Local API Verification
```powershell
$ Invoke-RestMethod -Uri http://localhost:8081/api/orders/health

status runtimeEngine virtualThreadsActive
------ ------------- --------------------
ONLINE Java 21 LTS   TRUE                
```

### 6. Catalog Service Local API Verification
```powershell
# 1. Insert a polymorphic product (POST)
$ Invoke-RestMethod -Uri http://localhost:3002/api/products -Method Post -Body '{"name": "Winter Parka Coat", "slug": "winter-parka-coat", "sku": "WNT-PRK-001", "price": 129.99, "stockCount": 50, "isActive": true, "attributes": {"color": "Midnight Blue", "size": "L", "material": "Gore-Tex", "waterproof": true, "pockets": 6}}' -ContentType 'application/json'

name       : Winter Parka Coat
slug       : winter-parka-coat
sku        : WNT-PRK-001
price      : 129.99
stockCount : 50
isActive   : True
attributes : @{color=Midnight Blue; size=L; material=Gore-Tex; waterproof=True; pockets=6}
_id        : 6a53c0ead69a1b497ff5b6fb

# 2. Retrieve active products (GET)
$ Invoke-RestMethod -Uri http://localhost:3002/api/products

_id        : 6a53c0ead69a1b497ff5b6fb
name       : Winter Parka Coat
slug       : winter-parka-coat
sku        : WNT-PRK-001
price      : 129.99
stockCount : 50
isActive   : True
attributes : @{color=Midnight Blue; size=L; material=Gore-Tex; waterproof=True; pockets=6}
```

### 7. Catalog Service Production ALB Ingress Verification
```bash
# 1. Retrieve the ingress resource to inspect address status
$ kubectl get ingress frontend-ingress
NAME               CLASS    HOSTS                       ADDRESS                                                                 PORTS   AGE
frontend-ingress   <none>   projects.pranilrathod.dev   k8s-default-frontend-281a5f0f2e-1048460682.us-east-1.elb.amazonaws.com   80      12h

# 2. Describe the ingress routing rules matrix
$ kubectl describe ingress frontend-ingress
Rules:
  Host                        Path  Backends
  ----                        ----  --------
  projects.pranilrathod.dev  
                              /api/orders     order-service:8081 (10.0.3.38:8081)
                              /api/products   catalog-service:3000 (10.0.2.149:3000)
                              /               frontend-service:80 (10.0.3.160:3000)

# 3. Query the production health endpoint through the internet-facing ALB
$ curl.exe -i https://projects.pranilrathod.dev/api/products/health
HTTP/1.1 200 OK
{"status":"ONLINE","message":"Node.js NestJS (Fastify) runtime engine is online."}

# 4. Fetch live products from MongoDB Atlas through the production gateway
$ curl.exe -i https://projects.pranilrathod.dev/api/products
HTTP/1.1 200 OK
[{"_id":"6a53c0ead69a1b497ff5b6fb","name":"Winter Parka Coat","slug":"winter-parka-coat","sku":"WNT-PRK-001","price":129.99,"stockCount":50,"isActive":true,"attributes":{"color":"Midnight Blue","size":"L","material":"Gore-Tex","waterproof":true,"pockets":6}}]
```

### 8. Redis Integration & Cache-Aside Implementation
```bash
# 1. Verify in-cluster Redis deployment is active and running
$ kubectl get pods -l app=redis
NAME                                READY   STATUS    RESTARTS   AGE
redis-deployment-c9f866df7-dbq7f   1/1     Running   0          12m

# 2. Verify NestJS TypeScript compilation checks succeed locally after configuration
$ npm run build
npm notice run catalog-service@0.0.1 build
npm notice run nest build
```

### 9. MongoDB Atlas Seed Automation Suite
```bash
# 1. Execute seeder script to populate MongoDB Atlas collection
$ node seed.js
Connecting to MongoDB Atlas cluster...
Connected successfully.
Starting idempotent database upsert operations in collection "products"...
[UPSERTED] SKU: WNT-CSH-CRM01 - Product: "Classic Cashmere Crewneck" (ID: 6a54028d6609bdc3d7fb0fb7)
[UPSERTED] SKU: WNT-ALP-FLC02 - Product: "Alpine Hybrid Fleece Jacket" (ID: 6a54028d6609bdc3d7fb0fb8)
[UPSERTED] SKU: WNT-MRN-BL003 - Product: "Merino Wool Thermal Base Layer" (ID: 6a54028e6609bdc3d7fb0fb9)
Database seeding completed successfully.
Database connection pool closed.

# 2. Verify populated products via the production API gateway
$ curl.exe -s https://projects.pranilrathod.dev/api/products
[{"_id":"6a53c0ead69a1b497ff5b6fb","name":"Winter Parka Coat",...},{"_id":"6a54028d6609bdc3d7fb0fb7","sku":"WNT-CSH-CRM01","name":"Classic Cashmere Crewneck",...},...]
```

### 10. CI/CD Workflow Triggers Update
- Modified branch trigger configurations from `develop` to `main` for all microservice deployment workflows:
  - `catalog-service-pipeline.yaml`
  - `frontend-pipeline.yaml`
  - `order-service-pipeline.yaml`
- Synchronized and verified changes across both remote tracking branches (`develop` and `main`).

### 11. Apollo Server GraphQL BFF Scaffold
- Scaffolding of Apollo Server inside the Next.js App Router boundary at `/api/graphql` using `@apollo/server` and `@as-integrations/next`.
- Established a custom `JSON` scalar to serialize unstructured product NoSQL attributes dynamically.
- Implemented concurrent REST aggregations in [route.ts](file:///d:/Projects/winter-ecommerce-platform/frontend/src/app/api/graphql/route.ts) for:
  - `products`: Proxied to internal Kubernetes endpoint `http://catalog-service:3000/api/products` (mapping MongoDB object identifiers to GraphQL IDs).
  - `orderHealth`: Proxied to internal Kubernetes endpoint `http://order-service:8081/api/orders/health` with offline fallbacks.
- Wrapped Apollo handlers inside Next.js compatible Route Handler wrappers (`export async function GET` / `POST`) to satisfy Next.js static and TypeScript route compilation constraints.
- Verified Next.js compiler checks successfully pass:
  ```bash
  $ npm run build
  ▲ Next.js 16.2.10 (Turbopack)
    Creating an optimized production build ...
  ✓ Compiled successfully in 1765ms
    Running TypeScript ...
    Finished TypeScript in 1464ms ...
  ```

### 12. Asynchronous Managed SNS & SQS Backbone Provisioning
- Integrated AWS SNS, SQS, and Subscription modules in EKS resource stack [eks-stack.ts](file:///d:/Projects/winter-ecommerce-platform/infrastructure/lib/eks-stack.ts).
- Provisioned standard managed event backbone:
  - **SNS Topic**: `WinterOrderEventsTopic` (Display: `Winter Order Events Messaging Hub`).
  - **Dead Letter SQS Queue**: `WinterInventoryUpdateDlq` to capture unparseable message payloads.
  - **Main SQS Queue**: `WinterInventoryUpdateQueue` bounded with the DLQ and configured with a retry policy limit of 3 (`maxReceiveCount: 3`).
  - **Subscription**: Configured fan-out mapping to subscribe the SQS queue directly to the SNS topic.
- Verified CDK compilation and CloudFormation stack blueprint diff successfully:
  ```bash
  $ npm run build
  success: Compiled TypeScript CDK code

  $ npx cdk diff
  [+] AWS::SNS::Topic WinterOrderEventsTopic
  [+] AWS::SQS::Queue WinterInventoryUpdateDlq
  [+] AWS::SQS::Queue WinterInventoryUpdateQueue
  [+] AWS::SQS::QueuePolicy WinterInventoryUpdateQueue/Policy
  [+] AWS::SNS::Subscription WinterInventoryUpdateQueue/WinterEksStackV2WinterOrderEventsTopic
  ```

### 13. Spring Cloud AWS SNS Integration in order-service
- Successfully integrated official `io.awspring.cloud:spring-cloud-aws-starter-sns:3.1.1` in `backend/order-service/pom.xml`.
- Configured region `us-east-1` default connection properties inside `backend/order-service/src/main/resources/application.yml`.
- Created structured immutable payloads `OrderCreatedEvent.java` and `OrderItemDTO.java`.
- Implemented outbound publisher adapter `OrderEventPublisherAdapter.java` utilizing `SnsTemplate` targeting standard ARN: `arn:aws:sns:us-east-1:880252974759:WinterOrderEventsTopic`.
- Verified compilation and baseline validation pass:
  ```bash
  $ ./mvnw clean compile
  [INFO] --- compiler:3.13.0:compile (default-compile) @ order-service ---
  [INFO] Recompiling the module because of changed source code.
  [INFO] Compiling 7 source files with javac [debug parameters release 21] to target\classes
  [INFO] ------------------------------------------------------------------------
  [INFO] BUILD SUCCESS
  ```
- All changes synchronized and committed to tracking branch `develop` (commit message: `feat(orders): incorporate spring cloud aws messaging and build async sns topic publisher adapter`).

### 14. NestJS Inventory Service Compilation Verification
```bash
$ npm run build
npm notice run inventory-service@0.0.1 build
npm notice run nest build
```
- All changes staged, committed (`feat(inventory): scaffold worker runtime, build native aws sqs long-polling engine, and structure k8s pod limits`), and pushed directly to `develop` branch.

### 15. Order Service Checkout REST API Compilation Verification
```bash
$ ./mvnw clean compile
[INFO] --- compiler:3.13.0:compile (default-compile) @ order-service ---
[INFO] Recompiling the module because of changed source code.
[INFO] Compiling 8 source files with javac [debug parameters release 21] to target\classes
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
```
- Staged all changes and committed (`test(orders): build temporary checkout endpoint to validate live sns-to-sqs asynchronous event distribution loops`) before pushing changes to `develop` branch.

### 16. GitHub Actions Workflows & Dockerfile Integration for inventory-service
- Structured production-ready multi-stage Dockerfile inside `backend/inventory-service/Dockerfile`.
- Configured automated deployment pipeline `.github/workflows/inventory-service-pipeline.yaml` mapping ECR containerization and EKS deployment rollout tracking.
- Successfully pushed CI/CD configurations directly to `develop` branch.

### 17. EKS End-to-End Async Checkout Integration Test Verification
- **Configuration Remediation**: Dispatched custom AWS temporary credentials into the EKS containers, and modified `backend/order-service/src/main/resources/application.yml` setting `spring.cloud.aws.credentials.instance-profile: false` to force Spring Cloud AWS fallback to environment variable loading.
- **REST Checkout Dispatch**: Triggered simulated checkout payload target against gateway ALB endpoint:
  ```bash
  $ curl.exe -i -X POST -H "Host: projects.pranilrathod.dev" -H "Content-Type: application/json" -d @checkout-payload.json http://k8s-default-frontend-281a5f0f2e-1048460682.us-east-1.elb.amazonaws.com/api/orders/test-checkout
  
  HTTP/1.1 200 
  Date: Mon, 13 Jul 2026 08:13:57 GMT
  Content-Type: application/json
  Transfer-Encoding: chunked
  Connection: keep-alive

  {"status":"PENDING_PROCESSING","orderId":"ORD-39DA44B9","message":"Order transaction recorded. Asynchronous event dispatched to messaging hub."}
  ```
- **SQS Consumer Interception Logs**: Confirmed the background `inventory-service` daemon polled and intercepted the generated transaction event successfully:
  ```json
  [Nest] 1  - 07/13/2026, 8:13:54 AM     LOG [SqsConsumerService] [INVENTORY WORKER] Intercepted Order Created Event Payload: {
    "Type" : "Notification",
    "MessageId" : "f965b6ca-ccfe-5d2c-96f3-d4046c7ca35b",
    "TopicArn" : "arn:aws:sns:us-east-1:880252974759:WinterOrderEventsTopic",
    "Subject" : "Order Created",
    "Message" : "{\"orderId\":\"ORD-39DA44B9\",\"customerId\":\"CST-9943\",\"totalAmount\":378.0,\"createdAt\":\"2026-07-13T08:13:45.269579006\",\"items\":[{\"productId\":\"6fa8cc33-55da-427c-a4d5-a8ccd3242b96\",\"sku\":\"WNT-CSH-CRM01\",\"quantity\":2,\"price\":189.0}]}",
    "Timestamp" : "2026-07-13T08:13:54.115Z",
    ...
  }
  ```

### 18. EKS Upgrade to Kubernetes v1.35
- **CDK Upgrade**: Upgraded the baseline EKS cluster version declaration to `eks.KubernetesVersion.V1_35` in `infrastructure/lib/eks-stack.ts`.
- **Destructive Recreate Deployment**: Destroyed the existing v1.30 cluster and successfully deployed the new stack `WinterEksStackV2` with Kubernetes version 1.35.
- **Microservices Redeployment**: Re-created and deployed all backend/frontend manifests to the new cluster.
- **Workflow Pipeline Alignment**: Updated EKS cluster name suffix in all GitHub Actions workflow configurations (catalog, order, inventory, frontend) to `WinterClusterE1A7478C-f496e17ffa8b48c2bc349244d407e9b9` to prevent pipeline failures.
- **E2E Validation test**: Dispatched checkout request and confirmed successful SNS-to-SQS async event polling by the inventory service:
  ```json
  [Nest] 1  - 07/13/2026, 1:36:13 PM     LOG [SqsConsumerService] [INVENTORY WORKER] Intercepted Order Created Event Payload: {
    "Type" : "Notification",
    "MessageId" : "626b3e7c-4e77-5c48-b7fa-5cb2a27a5d02",
    "TopicArn" : "arn:aws:sns:us-east-1:880252974759:WinterOrderEventsTopic",
    "Subject" : "Order Created",
    "Message" : "{\"orderId\":\"ORD-6F56EB30\",\"customerId\":\"CST-9943\",\"totalAmount\":378.0,\"createdAt\":\"2026-07-13T13:36:06.271793681\",\"items\":[{\"productId\":\"cc2ab2a0-0783-4d23-ab3d-afea087b5c16\",\"sku\":\"WNT-CSH-CRM01\",\"quantity\":2,\"price\":189.0}]}"
  }
  ```

---

### 19. Zero-Trust IAM Roles for Service Accounts (IRSA) Migration
- **OIDC Provider Enabled**: Verified EKS stack configuration natively constructs an OpenID Connect provider mapping.
- **ServiceAccount Constructs Scaffolding**: Added dedicated ServiceAccount constructs for `order-service` (`order-service-sa` in `default` namespace) and `inventory-service` (`inventory-service-sa` in `default` namespace) in `infrastructure/lib/eks-stack.ts`.
- **Least-Privilege AWS Policies Binding**:
  - Bound `order-service-sa` with SNS publishing privileges targeting `arn:aws:sns:us-east-1:880252974759:WinterOrderEventsTopic`.
  - Bound `inventory-service-sa` with SQS messaging privileges (`sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:ChangeMessageVisibility`) targeting the `WinterInventoryUpdateQueue`.
- **EKS Deployment Manifest Updates**: Added `serviceAccountName` mapping to both `backend/order-service/k8s/deployment.yaml` and `backend/inventory-service/k8s/deployment.yaml`.
- **Security Credential Cleaning**: Redacted and removed local static AWS environment credentials injected in deployment files to enforce secure zero-trust IAM OIDC token exchanges.
- **Microservices Resource Tuning**:
  - Identified `OOMKilled` (Exit Code 137) errors during Spring Boot JVM initial class-loading under resource constraints.
  - Scaled up the `order-service` pod limits to `512Mi` Memory (from `200Mi`) and `200m` CPU (from `100m`) inside the deployment manifest.
- **Verification & Deployment Validation**:
  - Checked `cdk diff` to verify the generation of ServiceAccount IAM roles and EKS OpenID Connect mappings.
  - Successfully deployed all infrastructure changes using `cdk deploy`.
  - Applied the updated Kubernetes deployments (`kubectl apply`) and observed healthy pods running with their respective service account tokens mounted.
  - Dispatched an end-to-end checkout payload via the public Application Load Balancer endpoint:
    ```bash
    $ curl.exe -i -X POST -H "Host: projects.pranilrathod.dev" -H "Content-Type: application/json" -d @backend/order-service/checkout-payload.json http://k8s-default-frontend-72a70b88bb-1645712665.us-east-1.elb.amazonaws.com/api/orders/test-checkout
    HTTP/1.1 200 OK
    {"status":"PENDING_PROCESSING","orderId":"ORD-E9C4D81A","message":"Order transaction recorded. Asynchronous event dispatched to messaging hub."}
    ```
  - Confirmed the Spring Boot logs displayed successful initialization of HikariPool, JPA EntityManagerFactory, and Tomcat Server, executing the request flawlessly without any permission blocks.

### 20. Automated Cloudflare DNS Propagation Hook Integration
- **Automated DNS Tracking Hook**: Appended an automated workflow step named `"Automate Cloudflare DNS Propagation Hook"` inside the Phase B (`cdk deploy`) deployment flow block of `.github/workflows/infrastructure-pipeline.yaml`.
- **Dynamic ALB DNS Resolution**: Embedded a robust JMESPath query calling `aws elbv2 describe-load-balancers` to dynamically locate the active ALB DNS name matching `k8s-default-frontend-*` sorted by creation date.
- **Cloudflare DNS Registry Sync**:
  - Leveraged Cloudflare client API v4 (`https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/dns_records`) to request the record ID associated with the target domain `projects.pranilrathod.dev`.
  - Executed a PUT payload mapping the target domain directly to the resolved EKS ALB DNS endpoint dynamically on stack rollout.
- **CI/CD Integration**: Verified YAML validation and synchronized changes to the remote repository tracking branch `develop`.
- **Pipeline Triggers Synchronization**: Realigned the push trigger branches in `.github/workflows/inventory-service-pipeline.yaml` to target `main` branch to align with standard deployment practices.
- **Main Deployment Rollout**: Merged the validated `develop` changes into `main` branch and pushed them to `origin/main` to trigger the central infrastructure and microservice CD pipelines.

### 21. Unified GitHub Actions CI/CD Orchestration Pipeline
- **Unified Pipeline Scaffolding**: Consolidated all five separate service and infrastructure workflow configurations into a single, unified GitOps orchestrator workflow (`main-pipeline.yaml`) executing on triggers targeting the `main` branch.
- **Path Filtering Integration**: Integrated `dorny/paths-filter@v3` to dynamically identify changes per microservice and infrastructure layer.
- **Orchestrator Dependency Mapping**: Bound microservice jobs to the CDK deploy job using the native `needs: [detect-changes, cdk-deploy]` construct and conditional `if: always() && github.event_name == 'push' && needs.detect-changes.outputs.<service> == 'true' && (needs.cdk-deploy.result == 'success' || needs.cdk-deploy.result == 'skipped')` flags. This guarantees that services automatically wait for CDK stack updates to succeed before starting their respective rollouts, while still deploying independently if no infrastructure files are altered.
- **Cloudflare Proxy Settings Sync**: Configured the Cloudflare DNS propagation hook inside the unified pipeline payload to update the CNAME record mapping with proxying enabled (`"proxied":true`) to route projects traffic through Cloudflare's edge network securely.
- **Legacy Workflow Purge**: Safely purged all 5 legacy individual workflow configuration files from Git tracking and pushed the consolidated stack to remote `develop` and `main` branches.

### 22. Atomic Stock Decrement Mutation & Cache Invalidation
- **Catalog Service Stock Decrement Implementation**:
  - Implemented an asynchronous, concurrency-safe `decrementStock(sku, quantity)` method in [products.service.ts](file:///d:/Projects/winter-ecommerce-platform/backend/catalog-service/src/products/products.service.ts) using the Mongoose document driver context to execute atomic `$inc` updates matching the SKU.
  - Wired live cache eviction hooks right after the update database call to automatically clear the cache keys `winter_catalog_active_products` and `all_active_products` from Redis.
  - Exposed an internal PATCH route mapping `@Patch("decrement-stock")` in [products.controller.ts](file:///d:/Projects/winter-ecommerce-platform/backend/catalog-service/src/products/products.controller.ts) accepting an array of SKU and quantity pairs to loop over and update stock levels.
- **Inventory SQS Consumer Service Linkage**:
  - Configured [sqs-consumer.service.ts](file:///d:/Projects/winter-ecommerce-platform/backend/inventory-service/src/queue/sqs-consumer.service.ts) in the background worker service to extract the SNS-wrapped checkout event message body.
  - Integrated an outbound HTTP PATCH mesh call utilizing the global Node.js `fetch` utility targeting the internal Kubernetes cluster DNS record `http://catalog-service:3000/api/products/decrement-stock`.
  - Added robust try-catch wrapper logic around the request loop logging internal cluster response statuses to container logs.
- **Service Compilation Verification**:
  - Confirmed both microservices compile flawlessly using the NestJS compiler build script (`npm run build`).

### 23. EKS Cluster Access Entry for CI/CD Runner Authentication Fix
- **Live EKS Authentication Remediation**:
  - Identified 401 Unauthorized API server errors (`server has asked for the client to provide credentials`) on the GitHub Actions runner during `kubectl apply`.
  - Pinpointed the root cause: when `WinterCluster` was destroyed and recreated during the Kubernetes v1.35 upgrade, the manual EKS Access Entry mapping for `arn:aws:iam::880252974759:user/winter-github-actions-runner` was lost.
  - Executed direct AWS CLI admin commands (`create-access-entry` and `associate-access-policy` with `AmazonEKSClusterAdminPolicy` and scope `cluster`) to restore immediate CI/CD access to the runner.
- **CDK Stack IaC Persistence**:
  - Registered `GitHubActionsRunnerAccessEntry` construct within [eks-stack.ts](file:///d:/Projects/winter-ecommerce-platform/infrastructure/lib/eks-stack.ts) to permanently enforce the IAM EKS Access Entry mapping for the runner in code.

### 24. Live Zero-Trust Distributed Checkout Verification & Pipeline Refinement
- **E2E Checkout Integration Test**:
  - Queried public API and established a storefront stock baseline of `75` units for SKU `WNT-CSH-CRM01` (Classic Cashmere Crewneck).
  - Sent an HTTPS POST checkout request to `/api/orders/test-checkout` payloading a transaction order for `5` units of SKU `WNT-CSH-CRM01`, which successfully returned status `PENDING_PROCESSING`.
  - Monitored live container telemetry on EKS showing SQS event interception, SNS envelope unwrapping, and successful internal cluster HTTP PATCH resolution.
  - Confirmed the storefront stock count accurately decremented to `70` units, validating Redis cache eviction and real-time MongoDB consistency.
- **CI/CD Pipeline Remediation**:
  - Discovered that the `deploy-inventory` job in the central pipeline did not issue a `kubectl rollout restart`, leaving old container instances alive despite ECR image pushes.
  - Patched [.github/workflows/main-pipeline.yaml](file:///d:/Projects/winter-ecommerce-platform/.github/workflows/main-pipeline.yaml) to run `kubectl rollout restart deployment/inventory-service-deployment` during rollout steps.

### 25. Centralized Log Aggregation Tier (Grafana Loki & Promtail)
- **Monitoring Manifest Creation**:
  - Scaffolded [loki-stack.yaml](file:///d:/Projects/winter-ecommerce-platform/infrastructure/k8s-monitoring/loki-stack.yaml) containing the definitions for a single-replica Grafana Loki deployment, Service, and ConfigMap (configured with local emptyDir chunk/index filesystem storage).
  - Configured a Promtail `DaemonSet`, ConfigMap, ServiceAccount, and RBAC ClusterRole bindings to scrape host container paths `/var/log/pods` and stream them to Loki.
- **Cluster Node Group Upscaling**:
  - Identified hard pod density scheduling limits of `t3.micro` nodes (capped at 4 pods per node), causing the Promtail DaemonSet pods to remain `Pending`.
  - Patched [eks-stack.ts](file:///d:/Projects/winter-ecommerce-platform/infrastructure/lib/eks-stack.ts) and upscaled the EKS nodegroup capacity to **5 nodes** (min: 5, desired: 5, max: 6) via AWS CLI to support the additional resource workloads.
  - Rescheduled running services to the new node to reclaim scheduling capacity and verify active Promtail container scheduling.
- **CI/CD Integration**:
  - Modified [.github/workflows/main-pipeline.yaml](file:///d:/Projects/winter-ecommerce-platform/.github/workflows/main-pipeline.yaml) to run `kubectl apply -f infrastructure/k8s-monitoring/loki-stack.yaml` on pushes to the master branch.

---

## 🚀 Next Steps / Open Actions
1. Deploy remaining microservices (order, payment, etc.).
2. Set up AWS secret configurations for DB/credentials injection in backend pipelines.
3. Configure repository-level secrets (`CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_API_TOKEN`) within GitHub settings.


---

## 🤖 Automated GitOps Tracking Ledger Instructions
> [!IMPORTANT]
> **To any active workspace agent execution thread:**
> This document serves as our automated, single-source-of-truth GitOps tracking ledger. You are strictly commanded to:
> 1. **Incremental Updates**: Automatically and incrementally append new achievements, verification telemetry logs, and resource mappings to this ledger immediately upon closing any future architectural phase. Never delete or overwrite the historical phases.
> 2. **Rigorous Redaction**: Enforce strict plaintext redaction rules. Ensure that production passwords, API keys, credentials, or MongoDB Atlas cluster connection strings never leak into the git commit history. Always censor or placeholder-replace any sensitive variables.
