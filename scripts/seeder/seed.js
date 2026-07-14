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
    imageUrl: "https://loremflickr.com/400/300/cashmere,sweater",
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
    imageUrl: "https://loremflickr.com/400/300/fleece,jacket",
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
    imageUrl: "https://loremflickr.com/400/300/thermal,apparel",
    attributes: {
      material: "100% Superfine Merino Wool",
      micronCount: "18.5 micron",
      weightGSM: 250,
      moistureWicking: true,
      type: "thermal",
      seamType: "Flatlock anti-chafing"
    }
  },
  {
    name: "Alpine Technical Ski Bib",
    slug: "alpine-technical-ski-bib",
    sku: "WNT-SKI-BIB04",
    price: 249,
    stockCount: 45,
    isActive: true,
    imageUrl: "https://loremflickr.com/400/300/ski,bib,pants",
    attributes: {
      waterproofRating: "20k",
      breathability: "15k",
      insulation: "Thinsulate 80g",
      pockets: 4,
      reccoReflector: true
    }
  },
  {
    name: "Arctic Explorer Parka",
    slug: "arctic-explorer-parka",
    sku: "WNT-ARC-PRK05",
    price: 389,
    stockCount: 25,
    isActive: true,
    imageUrl: "https://loremflickr.com/400/300/arctic,parka",
    attributes: {
      downFillPower: 800,
      hoodFur: "Synthetic",
      temperatureRating: "-30°C",
      outerShell: "DWR Treated Canvas"
    }
  },
  {
    name: "Summit Merino Balaclava",
    slug: "summit-merino-balaclava",
    sku: "WNT-MRN-BLV06",
    price: 45,
    stockCount: 120,
    isActive: true,
    imageUrl: "https://loremflickr.com/400/300/balaclava,mask",
    attributes: {
      material: "100% Merino Wool",
      weight: "300gsm",
      knitType: "Interlock",
      odorResistant: true
    }
  },
  {
    name: "Winter Parka Coat",
    slug: "winter-parka-coat",
    sku: "WNT-PRK-COT07",
    price: 320,
    stockCount: 15,
    isActive: true,
    imageUrl: "https://loremflickr.com/400/300/winter,parka,coat",
    attributes: {
      material: "Polyester shell, Down fill",
      waterproof: true,
      layers: 3,
      temperatureRating: "-20°C"
    }
  },
  {
    name: "Glacier Expedition Gloves",
    slug: "glacier-expedition-gloves",
    sku: "WNT-GLC-GLV08",
    price: 79,
    stockCount: 45,
    isActive: true,
    imageUrl: "https://loremflickr.com/400/300/glacier,gloves,winter",
    attributes: {
      insulation: "Thinsulate",
      touchScreenCompatible: true,
      waterproof: true,
      material: "Goatskin leather & nylon"
    }
  },
  {
    name: "Vortex Thermal Goggles",
    slug: "vortex-thermal-goggles",
    sku: "WNT-VTX-GGL09",
    price: 129,
    stockCount: 22,
    isActive: true,
    imageUrl: "https://loremflickr.com/400/300/ski,goggles,snow",
    attributes: {
      lensType: "Dual-pane cylindrical",
      antiFog: true,
      uvProtection: "UV400",
      frameSize: "Medium/Large"
    }
  },
  {
    name: "Summit Gore-Tex Snow Boots",
    slug: "summit-gore-tex-snow-boots",
    sku: "WNT-SMT-BTS10",
    price: 215,
    stockCount: 35,
    isActive: true,
    imageUrl: "https://loremflickr.com/400/300/snow,boots,winter",
    attributes: {
      membrane: "Gore-Tex",
      insulation: "400g PrimaLoft",
      soleType: "Vibram Arctic Grip",
      closure: "Lace-up"
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
