const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

let MongoClient;
try {
  MongoClient = require('mongodb').MongoClient;
} catch (e) {
  MongoClient = require('mongoose').mongo.MongoClient;
}
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional in environments where env vars are pre-injected
}

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
    imageUrl: "https://m.media-amazon.com/images/I/615UyJ5OJGL._SL1254_.jpg",
    attributes: {
      material: "100% Mongolian Cashmere",
      fit: "Regular Fit",
      warmthLevel: "Mid-Weight Warmth",
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
    imageUrl: "https://m.media-amazon.com/images/I/A1W38FgAtkL._SX679_.jpg",
    attributes: {
      material: "Recycled Polyester Fleece",
      fit: "Athletic Fit",
      warmthLevel: "High Insulation",
      care: "Machine wash cold"
    }
  },
  {
    name: "Merino Wool Thermal Base Layer",
    slug: "merino-wool-thermal-base-layer",
    sku: "WNT-MRN-BL003",
    price: 89,
    stockCount: 200,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/71r49yCHtkL._SY741_.jpg",
    attributes: {
      material: "100% Superfine Merino Wool",
      fit: "Slim Fit",
      warmthLevel: "Lightweight Warmth",
      care: "Machine wash cold"
    }
  },
  {
    name: "Alpine Technical Ski Bib",
    slug: "alpine-technical-ski-bib",
    sku: "WNT-SKI-BIB04",
    price: 249,
    stockCount: 45,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/71OSVlg0c1L._SL1500_.jpg",
    attributes: {
      material: "Waterproof Ripstop Nylon",
      fit: "Relaxed Fit",
      warmthLevel: "Heavyweight Insulation",
      care: "Hand wash cold"
    }
  },
  {
    name: "Arctic Explorer Parka",
    slug: "arctic-explorer-parka",
    sku: "WNT-ARC-PRK05",
    price: 389,
    stockCount: 25,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/619xMvtqClL._SY606_.jpg",
    attributes: {
      material: "DWR Treated Canvas & Down",
      fit: "Relaxed Fit",
      warmthLevel: "Extreme Warmth",
      care: "Dry clean only"
    }
  },
  {
    name: "Summit Merino Balaclava",
    slug: "summit-merino-balaclava",
    sku: "WNT-MRN-BLV06",
    price: 45,
    stockCount: 120,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/61u5oAftaeL._SY741_.jpg",
    attributes: {
      material: "100% Merino Wool",
      fit: "One Size Fits All",
      warmthLevel: "Mid-Weight Warmth",
      care: "Hand wash cold"
    }
  },
  {
    name: "Winter Parka Coat",
    slug: "winter-parka-coat",
    sku: "WNT-PRK-COT07",
    price: 320,
    stockCount: 15,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/61j2FBMg2LL._SX569_.jpg",
    attributes: {
      material: "Polyester Shell & Down Fill",
      fit: "Regular Fit",
      warmthLevel: "Extreme Warmth",
      care: "Dry clean only"
    }
  },
  {
    name: "Glacier Expedition Gloves",
    slug: "glacier-expedition-gloves",
    sku: "WNT-GLC-GLV08",
    price: 79,
    stockCount: 45,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/51zSnhYRWvL.jpg",
    attributes: {
      material: "Goatskin Leather & Nylon",
      fit: "Standard Fit",
      warmthLevel: "High Insulation",
      care: "Hand wash only"
    }
  },
  {
    name: "Cascade Cable Knit Beanie",
    slug: "cascade-cable-knit-beanie",
    sku: "WNT-CBL-BNI09",
    price: 35,
    stockCount: 80,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/61H0MFrsWQL._SL1024_.jpg",
    attributes: {
      material: "Acrylic & Wool Blend",
      fit: "One Size Fits All",
      warmthLevel: "Mid-Weight Warmth",
      care: "Hand wash only"
    }
  },
  {
    name: "Thermal Merino Wool Socks",
    slug: "thermal-merino-wool-socks",
    sku: "WNT-TRM-SCK10",
    price: 28,
    stockCount: 150,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/714lOIwZ+8L._SL1200_.jpg",
    attributes: {
      material: "80% Merino Wool, 20% Nylon",
      fit: "Unisex Fit",
      warmthLevel: "High Insulation",
      care: "Machine wash warm"
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

    console.log('Clearing existing products to prevent index conflicts...');
    await collection.deleteMany({});

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
