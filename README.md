<div align="center">
  <h1>❄️ Winter E-Commerce Platform</h1>
  
  <p>
    <img src="https://img.shields.io/badge/Kubernetes-v1.35-blue?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes" />
    <img src="https://img.shields.io/badge/Node.js-v24--alpine-green?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Java-21--LTS-orange?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java OpenJDK" />
    <img src="https://img.shields.io/badge/AWS-EKS%20%7C%20RDS-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="Amazon AWS" />
    <img src="https://img.shields.io/badge/Cloudflare-Proxied-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  </p>

  <p>
    A high-performance, production-grade distributed retail platform created for PeerIsland/Winter as an assignment, running on an upscale 9-node <strong>Amazon EKS (v1.35)</strong> cluster. Features a decoupled microservices framework, asynchronous fanning event backbones, zero-trust cloud network security isolation, and local Redis cache coordination grids.
  </p>

  <div style="margin-top: 15px; margin-bottom: 20px;">
    <strong>👉 Live Production Gateway Link:</strong> 
    <a href="https://projects.pranilrathod.dev/winter" target="_blank">projects.pranilrathod.dev/winter</a>
  </div>
</div>

> [!TIP]
> ### 🚀 Key Engineering Highlights & Metrics (KPIs)
> - ⚡ **Main Branch CD Speed:** Any push to `main` is automatically built, verified, and deployed to EKS within **2 minutes**.
> - 🔧 **Infra Provisioning SLA:** Complete infrastructure setup/teardown via the AWS CDK pipeline is fully completed in **20 minutes**.
> - 🌐 **Zero-Touch Edge Routing:** DNS CNAME records and Cloudflare proxy mappings targeting `projects.pranilrathod.dev/winter` are 100% automated (no manual work).


<hr />

<h2>⚡ Tech Stack Architecture</h2>

<table width="100%">
  <thead>
    <tr>
      <th align="center" width="20%"><strong>Frontend Layer</strong></th>
      <th align="center" width="20%"><strong>Backend Layer</strong></th>
      <th align="center" width="20%"><strong>Messaging Grid</strong></th>
      <th align="center" width="20%"><strong>Datastores</strong></th>
      <th align="center" width="20%"><strong>DevOps &amp; Infra</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td valign="top">
        • Next.js 15 (Standalone)<br/>
        • Zustand Persistent Store<br/>
        • Apollo Server BFF<br/>
        • Tailwind CSS (Light Overhaul)
      </td>
      <td valign="top">
        • Java 21 / Spring Boot 3.3.2<br/>
        • Project Loom Virtual Threads<br/>
        • NestJS / Fastify Core Engine<br/>
        • TypeScript Runtimes
      </td>
      <td valign="top">
        • Amazon SNS Topic Hub<br/>
        • Amazon SQS long-polling daemons<br/>
        • Asynchronous event fanning
      </td>
      <td valign="top">
        • Amazon RDS PostgreSQL 16<br/>
        • MongoDB Atlas NoSQL<br/>
        • In-Cluster Redis Pod Grid<br/>
        • Cache-Aside Engine
      </td>
      <td valign="top">
        • AWS CDK (IaC blueprints)<br/>
        • Cloudflare Proxy Engine<br/>
        • Path-Filtered GitOps pipelines<br/>
        • Grafana Loki / Promtail
      </td>
    </tr>
  </tbody>
</table>

<hr />

<h2>🧭 System Topology &amp; Distributed Handshake</h2>

<p>
  All platform runtimes are isolated securely within a multi-AZ custom Amazon VPC (<code>WinterCoreVpc</code>). Client traffic lands on Cloudflare edges, proxies through an Application Load Balancer (ALB), and routes internally to pods using a unified base path namespace.
</p>

<pre>
                               ┌──────────────────────────────────┐
                               │ projects.pranilrathod.dev/winter │
                               └────────────────┬─────────────────┘
                                                │ (Cloudflare CDN Edge)
                                                ▼
                               ┌──────────────────────────────────┐
                               │   AWS ALB Ingress Router Grid    │
                               └────────────────┬─────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         │ /winter                              │ /winter/api/products                 │ /winter/api/orders
         ▼                                      ▼                                      ▼
┌───────────────────┐                  ┌───────────────────┐                  ┌───────────────────┐
│  Next.js Web App  │                  │  Catalog Service  │                  │   Order Service   │
│ (Node 24 / SSR)   ├─(Apollo GraphQL)►│(NestJS + Fastify) │                  │(Spring Boot/Java) │
└───────────────────┘                  └────────┬──────────┘                  └────────┬──────────┘
                                                │                                      │
                                                ▼                                      ▼
                                       📦 Redis Cache Pod                     🐘 Amazon RDS Postgres
                                                │ (Cache-Aside)                        │ (Dispatches Event)
                                                ▼                                      ▼
                                      🍃 MongoDB Atlas Cluster               📢 Amazon SNS Topic Hub
                                                                                       │
                                                ┌──────────────────────────────────────┘
                                                │ (Asynchronous Event Fan-Out)
                                                ▼
                                   ┌──────────────────────────┐
                                   │ SQS Message Queue Buffers│
                                   └────────────┬─────────────┘
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        ▼                                               ▼
            ┌───────────────────────┐                       ┌───────────────────────┐
            │   Inventory Worker    │                       │   Payment Auditor     │
            │  (NestJS SQS Daemon)  │                       │  (NestJS SQS Consumer)│
            └───────────────────────┘                       └───────────────────────┘
</pre>

<hr />

<h2>🔀 Gateway Ingress Routing Blueprint</h2>

<p>
  The cluster controller utilizes standard prefix path patterns mounted under the <code>/winter</code> base namespace configuration. Accessing target routing contexts directly bypassing specified headers yields standard <code>404 Not Found</code> network protection footprints.
</p>

<table width="100%">
  <thead>
    <tr>
      <th align="left" width="30%">External Endpoint Ingress Path</th>
      <th align="left" width="25%">Cluster Target Service Namespace</th>
      <th align="left" width="45%">Core Operations &amp; Flow Context</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong><code>GET /winter</code></strong></td>
      <td><code>frontend-service:80</code></td>
      <td>Serves request-time dynamically rendered SSR home catalog view grids.</td>
    </tr>
    <tr>
      <td><strong><code>GET /winter/products/[slug]</code></strong></td>
      <td><code>frontend-service:80</code></td>
      <td>Evaluates parameters promise hooks and pulls detailed specifications page.</td>
    </tr>
    <tr>
      <td><strong><code>GET /winter/cart</code></strong></td>
      <td><code>frontend-service:80</code></td>
      <td>Pulls hydration-safe Zustand persistent shopping cart summaries ledger drawer.</td>
    </tr>
    <tr>
      <td><strong><code>GET /winter/checkout</code></strong></td>
      <td><code>frontend-service:80</code></td>
      <td>Serves dual-panel SSL address intake and dynamic monetized calculations screens.</td>
    </tr>
    <tr>
      <td><strong><code>GET /winter/orders</code></strong></td>
      <td><code>frontend-service:80</code></td>
      <td>Displays interactive tracking panels with server-driven layout filter selectors.</td>
    </tr>
    <tr>
      <td><strong><code>POST /winter/api/graphql</code></strong></td>
      <td><code>frontend-service:80</code></td>
      <td>Apollo BFF proxy gateway converting concurrent REST requests into domain payloads.</td>
    </tr>
    <tr>
      <td><strong><code>GET /winter/api/products</code></strong></td>
      <td><code>catalog-service:3000</code></td>
      <td>Fetches unstructured catalog product data using Redis cache-aside queries.</td>
    </tr>
    <tr>
      <td><strong><code>GET /winter/api/products/slug/:slug</code></strong></td>
      <td><code>catalog-service:3000</code></td>
      <td>In-database find-by-slug microservice resolver bypasses filtering arrays.</td>
    </tr>
    <tr>
      <td><strong><code>PATCH /winter/api/products/decrement-stock</code></strong></td>
      <td><code>catalog-service:3000</code></td>
      <td>Concurrency-safe, atomic <code>$inc</code> stock adjustments with real-time Redis invalidations.</td>
    </tr>
    <tr>
      <td><strong><code>POST /winter/api/orders/checkout</code></strong></td>
      <td><code>order-service:8081</code></td>
      <td>Order checkout registry capturing multi-item arrays onto PostgreSQL RDS clusters.</td>
    </tr>
    <tr>
      <td><strong><code>GET /winter/api/orders</code></strong></td>
      <td><code>order-service:8081</code></td>
      <td>Server-paginated listing records with optional string param tracking selectors (<code>?status=</code>).</td>
    </tr>
    <tr>
      <td><strong><code>GET /winter/api/orders/{orderId}</code></strong></td>
      <td><code>order-service:8081</code></td>
      <td>Primary key index query search to fetch full immutable tracking logs.</td>
    </tr>
    <tr>
      <td><strong><code>PATCH /winter/api/orders/{orderId}/cancel</code></strong></td>
      <td><code>order-service:8081</code></td>
      <td>Relational query state-guarded transaction path to cancel active <code>PENDING</code> rows.</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>🛡️ Enterprise Engineering Standards Enforced</h2>



<ul>
  <li><strong>Zero-Trust Identity Access (IRSA):</strong> All database drivers, message lines, and queue collectors connect using OpenID Connect (OIDC) trust tokens mapped natively to Kubernetes <code>ServiceAccount</code> configurations.</li>
  <li><strong>State-Guarded Transaction Invariants:</strong> Hardened down to relational row states. Order cancellations explicitly block updates via Spring Boot query check models if a record has transitioned to <code>PROCESSING</code> or beyond, flashing a <code>400 Bad Request</code> execution exception.</li>
  <li><strong>Real-Time Guard Validation:</strong> The checkout panels perform quick lazy GraphQL pre-checkout validation loops against the MongoDB collection counts. If a user accumulates more units of an item than currently available, the UI blocks triggers and clamps quantities instantly on the fly.</li>
</ul>

<hr />

<h2>📂 Project Directory Architecture</h2>

<details>
  <summary>🔍 <strong>Click to expand complete repository directory tree map</strong></summary>
  <br/>
  <pre>
.
├── .github/
│   └── workflows/
│       └── main-pipeline.yaml          ◄── Consolidated GitOps Orchestrator Workflow
├── backend/
│   ├── catalog-service/
│   │   ├── k8s/
│   │   │   ├── deployment.yaml         ◄── NestJS Fastify Web Container Pod Manifests
│   │   │   └── secrets.yaml
│   │   ├── src/
│   │   │   ├── products/
│   │   │   │   ├── schemas/
│   │   │   │   │   └── product.schema.ts ◄── Polymorphic Mixed Mongoose Schemas
│   │   │   │   ├── products.controller.ts
│   │   │   │   ├── products.module.ts
│   │   │   │   └── products.service.ts ◄── Redis Cache-Aside & Stock Decrement Hooks
│   │   │   └── main.ts                 ◄── Fastify Runtime Engine Baseline Setup
│   │   ├── Dockerfile                  ◄── Node 24 Alpine Multi-Stage Builder
│   │   └── package.json
│   ├── inventory-service/
│   │   ├── k8s/
│   │   │   └── deployment.yaml
│   │   ├── src/
│   │   │   ├── queue/
│   │   │   │   └── sqs-consumer.service.ts ◄── Non-Blocking SQS Stock Decrement Poller
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── order-service/
│   │   ├── k8s/
│   │   │   └── deployment.yaml         ◄── Spring Boot Java Virtual Thread Pod Manifests
│   │   ├── src/main/java/com/winter/platform/orderservice/
│   │   │   ├── domain/
│   │   │   │   └── models/             ◄── OrderStatus Enums and Immutable Record Events
│   │   │   ├── infrastructure/
│   │   │   │   └── adapters/
│   │   │   │       ├── in/
│   │   │   │       │   ├── cron/       ◄── 5-Minute In-Memory Scheduling Sweep Jobs
│   │   │   │       │   └── web/        ◄── REST Controller Ports (Lookups & Filter Routes)
│   │   │   │       └── out/
│   │   │   │           ├── messaging/  ◄── Spring Cloud AWS SNS Topic Publishers
│   │   │   │           └── persistence/◄── JPA PostgreSQL Relational Repositories
│   │   │   └── OrderServiceApplication.java
│   │   ├── src/main/resources/
│   │   │   └── application.yml         ◄── Tomcat Context Path Config (/winter)
│   │   ├── Dockerfile                  ◄── JRE 21 Eclipse-Temurin Secure Base Image
│   │   └── pom.xml
│   └── payment-service/
│       ├── k8s/
│       │   └── deployment.yaml
│       ├── src/
│       │   ├── queue/
│       │   │   └── payment-consumer.service.ts ◄── SQS Compliance Audit Log Writer
│       │   └── main.ts
│       ├── Dockerfile
│       └── package.json
├── frontend/
│   ├── k8s/
│   │   ├── deployment.yaml             ◄── Standalone Node Next.js Pod manifests
│   │   └── ingress.yaml                ◄── Host Header Lock & Path Rewrite Ingress Actions
│   ├── src/app/
│   │   ├── api/graphql/
│   │   │   └── route.ts                ◄── Apollo GraphQL BFF Endpoint Resolvers Matrix
│   │   ├── cart/
│   │   │   └── page.tsx                ◄── Interactive Multi-Item Zustand Cart Summary Page
│   │   ├── checkout/
│   │   │   └── page.tsx                ◄── Dual-Panel Intake Ledger Persisted in Session
│   │   ├── context/
│   │   │   └── CartStore.ts            ◄── Zustand Persistence Middleware Context Storage
│   │   ├── orders/
│   │   │   └── page.tsx                ◄── Flipkart-Style Status Filtering Tracking Hub
│   │   ├── payment/
│   │   │   └── page.tsx                ◄── High-Tech Bank Gateway Handshake Simulation Screen
│   │   ├── products/[slug]/
│   │   │   └── page.tsx                ◄── SSR Dynamic Garment Specification Profiles
│   │   ├── globals.css                 ◄── Light Theme Premium Style Overhaul Sheet Variables
│   │   ├── layout.tsx
│   │   └── page.tsx                    ◄── Dynamic Request-Time SSR Catalog Index Page
│   ├── next.config.ts                  ◄── Standalone Output & Base Path Configuration
│   ├── Dockerfile                      ◄── Optimized 3-Stage Secure Production UI Builder
│   └── package.json
├── infrastructure/
│   ├── lib/
│   │   ├── eks-stack.ts                ◄── Upscaled Worker Node Groups & IRSA OIDC Constructs
│   │   └── vpc-stack.ts                ◄── Multi-AZ Network Blueprints with Private Subnets
│   ├── k8s-monitoring/
│   │   └── loki-stack.yaml             ◄── Grafana Loki Single-Replica & Promtail DaemonSets
│   └── cdk.json
├── scripts/seeder/
│   └── seed.js                         ◄── Idempotent Atlas NoSQL & S3 Garment Image Seeder Suite
├── LICENSE
└── README.md
  </pre>
</details>

<hr />

<h2>⚙️ Staging Development Runbook</h2>

<h3>Core Data Attributes Specification</h3>
<p>Every multi-item transaction records comprehensive tracking logs across our tables:</p>

<pre>
{
  "id": "ORD-8A3F1B2C",
  "customerId": "CST-9943",
  "status": "PENDING",
  "subtotal": 438.00,
  "tax": 43.80,
  "shippingFee": 15.00,
  "grandTotal": 496.80,
  "itemsCount": 2,
  "shippingAddress": "Pranil Rathod, High-Rise Bungalow, Mumbai, 400001",
  "createdAt": "2026-07-15T23:10:34Z"
}
</pre>

<h3>Operational Framework Mappings</h3>
<table width="100%">
  <thead>
    <tr>
      <th align="left">Component Service Module</th>
      <th align="left">Local Development Port</th>
      <th align="left">Internal Cluster Endpoint</th>
      <th align="left">Storage Runtime Target Reference</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong><code>frontend</code> Dashboard UI</strong></td>
      <td><code>localhost:3000</code></td>
      <td><code>frontend-service:80</code></td>
      <td>Next.js SSR standalone node runtime server context</td>
    </tr>
    <tr>
      <td><strong><code>catalog-service</code> API</strong></td>
      <td><code>localhost:3002</code></td>
      <td><code>catalog-service:3000</code></td>
      <td>MongoDB Atlas Cloud Remote Cluster + Redis Cache Pod</td>
    </tr>
    <tr>
      <td><strong><code>order-service</code> Engine</strong></td>
      <td><code>localhost:8081</code></td>
      <td><code>order-service:8081</code></td>
      <td>Managed AWS RDS PostgreSQL 16 DB Instance Cluster</td>
    </tr>
  </tbody>
</table>

<h3>Standard Compilation Routines</h3>
<p>Execute target wrapper build checks inside localized service directory environments:</p>

<pre>
# 1. Initialize and Validate Core Java Hexagonal Microservice
cd backend/order-service/
./mvnw clean compile

# 2. Compile and Optimize Next.js Storefront Layers
cd ../../frontend/
npm ci
npm run build

# 3. Synchronize Atlas NoSQL Seed Datasets Idempotently
cd ../scripts/seeder/
node seed.js
</pre>

<hr />

<h2>🚀 GitOps Automated Deployment &amp; Observability</h2>

<p>Platform deliveries conform entirely to declarative automated workflows managed through GitHub Actions and AWS CDK infrastructure definitions.</p>

<h3>Path-Filtered Promotion Architecture</h3>
<p>Our consolidated <code>main-pipeline.yaml</code> avoids redundant resource scheduling cycles by scanning changes through path-filtering blocks before kicking off target ECR builds:</p>

<ol>
  <li><strong>Phase A (Infrastructure):</strong> Monitors modifications inside <code>infrastructure/**</code>. Runs <code>cdk diff</code> code validations and promotes updates to cloud VPC network nodes securely.</li>
  <li><strong>Phase B (Microservices Grid):</strong> Intercepts modifications within target project workspaces, spins up modern multi-stage Alpine Docker layers under a non-root system user context, and tags registries before forcing cluster rolling restarts:
    <pre>
kubectl rollout restart deployment/order-service-deployment
kubectl rollout restart deployment/frontend-deployment
    </pre>
  </li>
  <li><strong>Phase C (Cloudflare Edge Alignment):</strong> Captures the dynamic Application Load Balancer address changes automatically post-CDK rollout using an embedded automated tracking record client validation hook script, updating domain CNAME record mappings at <code>projects.pranilrathod.dev</code> inside Cloudflare DNS frameworks with active proxying enabled securely.</li>
</ol>



<h3>In-Cluster Aggregated Logging Infrastructure</h3>
<p>The cluster maintains deep telemetry aggregation layers using a single-replica <strong>Grafana Loki</strong> service coupled with high-density host node <strong>Promtail DaemonSets</strong>.</p>

<ul>
  <li><strong>Host Log Collection Routing:</strong> Promtail containers hook directly into bare-metal path scopes <code>/var/log/pods</code>, parsing and tagging standard service log outputs on the fly.</li>
  <li><strong>Correlation Tracing Analysis:</strong> Distributed asynchronous transactions can be queried across multiple entirely detached microservice logs (<code>inventory-service</code> background workers and <code>payment-service</code> auditors) by tracking unified transaction identifiers through LogQL index constraints:</li>
</ul>

<pre>
{namespace="default"} |= "ORD-E9C4D81A"
</pre>

<pre style="background-color: #1e1e1e; color: #d4d4d4; padding: 10px;">
[Nest] LOG [InventoryConsumer] [INVENTORY WORKER] Intercepted Event. Stock decremented for WNT-CSH-CRM01 | Status 200 OK
[Nest] LOG [PaymentConsumer] [FINANCIAL LEDGER AUDIT] [ORDER SUCCESS] Order ID: ORD-E9C4D81A | Settled via Secure Bank Vault Hub.
</pre>
