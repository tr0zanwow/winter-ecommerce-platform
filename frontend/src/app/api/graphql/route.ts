import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { GraphQLScalarType, Kind } from 'graphql';
import { NextRequest } from 'next/server';

// Custom JSON scalar resolver to support unstructured NoSQL attributes
const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Custom JSON scalar type',
  parseValue(value) {
    return value;
  },
  serialize(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      return new Function(`return ${ast}`)();
    }
    return null;
  },
});

const typeDefs = `#graphql
  scalar JSON

  type Product {
    id: ID!
    name: String!
    slug: String!
    sku: String!
    price: Float!
    stockCount: Int!
    isActive: Boolean!
    imageUrl: String
    attributes: JSON
  }

  type OrderHealth {
    status: String!
    runtimeEngine: String!
    virtualThreadsActive: Boolean!
  }

  type Query {
    products: [Product]
    orderHealth: OrderHealth
  }
`;

const resolvers = {
  JSON: jsonScalar,
  Query: {
    products: async () => {
      try {
        const response = await fetch('http://catalog-service:3000/api/products', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }
        const data = await response.json();
        return data.map((p: any) => ({
          id: p._id || p.id,
          ...p,
        }));
      } catch (error) {
        console.error('Error in GraphQL products resolver:', error);
        return [];
      }
    },
    orderHealth: async () => {
      try {
        const response = await fetch('http://order-service:8081/api/orders/health', {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch order health: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error in GraphQL orderHealth resolver:', error);
        return {
          status: 'OFFLINE',
          runtimeEngine: 'Java Spring Boot (JVM)',
          virtualThreadsActive: false,
        };
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest>(server);

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

