const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Error: MONGODB_URI environment variable is missing.');
  process.exit(1);
}

const products = [
  {
    name: "Classic Cashmere Crewneck",
    slug: "classic-cashmere-crewneck",
    sku: "WNT-CSH-CRM01",
    price: 189,
    stockCount: 75,
    isActive: true,
    imageUrl: "https://loremflickr.com/640/480/sweater,apparel?lock=1",
    attributes: {
      material: "100% Mongolian Cashmere",
      ply: "2-ply",
      knitStyle: "Ribbed trim",
      insulationRating: "Mid-Weight Warmth",
      care: "Dry clean only"
    }
  },
  {
    name: "Alpine Hybrid Fleece Jacket",
    slug: "alpine-hybrid-fleece-jacket",
    sku: "WNT-ALP-FLC02",
    price: 145,
    stockCount: 120,
    isActive: true,
    imageUrl: "https://loremflickr.com/640/480/jacket,apparel?lock=2",
    attributes: {
      material: "Recycled Polyester Fleece",
      weatherResistance: "Wind-resistant panels",
      breathable: true,
      pockets: 6,
      activityFit: "Active Mountain Touring"
    }
  },
  {
    name: "Merino Wool Thermal Base Layer",
    slug: "merino-wool-thermal-base-layer",
    sku: "WNT-MRN-BL003",
    price: 89,
    stockCount: 200,
    isActive: true,
    imageUrl: "https://loremflickr.com/640/480/thermal,undershirt?lock=3",
    attributes: {
      material: "100% Superfine Merino Wool",
      micronCount: "18.5 micron",
      weightGSM: 250,
      moistureWicking: true,
      type: "thermal",
      seamType: "Flatlock anti-chafing"
    }
  }
];

async function main() {
  const client = new MongoClient(uri);

  try {
    console.log('Connecting to MongoDB Atlas cluster...');
    await client.connect();
    console.log('Connected successfully.');

    const db = client.db(); // uses db name from connection string (or defaults)
    const collection = db.collection('products');

    console.log(`Starting idempotent database upsert operations in collection "${collection.collectionName}"...`);

    for (const product of products) {
      const result = await collection.updateOne(
        { sku: product.sku },
        { $set: product },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        console.log(`[UPSERTED] SKU: ${product.sku} - Product: "${product.name}" (ID: ${result.upsertedId})`);
      } else {
        console.log(`[UPDATED] SKU: ${product.sku} - Product: "${product.name}"`);
      }
    }

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Database seeding failed:', error);
  } finally {
    await client.close();
    console.log('Database connection pool closed.');
  }
}

main();
