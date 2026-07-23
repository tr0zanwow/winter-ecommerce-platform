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

  type Order {
    id: ID!
    customerId: String!
    status: String!
    subtotal: Float!
    tax: Float!
    shippingFee: Float!
    grandTotal: Float!
    itemsCount: Int!
    shippingAddress: String
    itemsJson: String
    createdAt: String
  }

  type OrderResponse {
    success: Boolean!
    message: String
    order: Order
  }

  type Query {
    products: [Product]
    product(slug: String!): Product
    orders(status: String, page: Int, size: Int): [Order]
    order(id: ID!): Order
  }

  type Mutation {
    cancelOrder(id: ID!): OrderResponse
  }
`;

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:8081';

const resolvers = {
  JSON: jsonScalar,
  Query: {
    products: async () => {
      try {
        const response = await fetch(`${CATALOG_SERVICE_URL}/winter/api/products`, {
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
    product: async (_: any, { slug }: { slug: string }) => {
      try {
        const response = await fetch(`${CATALOG_SERVICE_URL}/winter/api/products/slug/${slug}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`Failed to fetch product: ${response.statusText}`);
        }
        const data = await response.json();
        return {
          id: data._id || data.id,
          ...data,
        };
      } catch (error) {
        console.error(`Error in GraphQL product resolver for slug ${slug}:`, error);
        return null;
      }
    },
    orders: async (_: any, { status, page, size }: { status?: string; page?: number; size?: number }) => {
      try {
        const queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        if (page !== undefined) queryParams.append('page', String(page));
        if (size !== undefined) queryParams.append('size', String(size));

        const response = await fetch(`${ORDER_SERVICE_URL}/winter/api/orders?${queryParams.toString()}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error in GraphQL orders resolver:', error);
        return [];
      }
    },
    order: async (_: any, { id }: { id: string }) => {
      try {
        const response = await fetch(`${ORDER_SERVICE_URL}/winter/api/orders/${id}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`Failed to fetch order: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Error in GraphQL order resolver for id ${id}:`, error);
        return null;
      }
    },
  },
  Mutation: {
    cancelOrder: async (_: any, { id }: { id: string }) => {
      try {
        const response = await fetch(`${ORDER_SERVICE_URL}/winter/api/orders/${id}/cancel`, {
          method: 'PATCH',
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) {
          return {
            success: false,
            message: data.message || 'Failed to cancel order.',
            order: null,
          };
        }
        return {
          success: true,
          message: 'Order cancelled successfully.',
          order: data,
        };
      } catch (error: any) {
        console.error(`Error in GraphQL cancelOrder resolver for id ${id}:`, error);
        return {
          success: false,
          message: error.message || 'Failed to cancel order.',
          order: null,
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
