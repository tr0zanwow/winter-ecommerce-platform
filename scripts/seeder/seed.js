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
    name: "Thermal Insulated Winter Gloves",
    slug: "thermal-insulated-winter-gloves",
    sku: "WNT-GLV-THM01",
    price: 35,
    stockCount: 120,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/615UyJ5OJGL._SL1254_.jpg",
    attributes: {
      material: "Windproof Nylon & Thermal Fleece",
      fit: "Standard Fit",
      warmthLevel: "Extreme Warmth",
      care: "Hand wash only"
    }
  },
  {
    name: "Multi-Pack Winter Wool Crew Socks",
    slug: "multi-pack-winter-wool-crew-socks",
    sku: "WNT-SCK-WOL02",
    price: 24,
    stockCount: 250,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/A1W38FgAtkL._SX679_.jpg",
    attributes: {
      material: "80% Merino Wool, 20% Blend",
      fit: "Unisex Crew Fit",
      warmthLevel: "Mid-Weight Warmth",
      care: "Machine wash cold"
    }
  },
  {
    name: "Women's Hooded Faux-Fur Puffer",
    slug: "womens-hooded-faux-fur-puffer",
    sku: "WNT-JKT-FUR03",
    price: 189,
    stockCount: 45,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/71r49yCHtkL._SY741_.jpg",
    attributes: {
      material: "Water-Resistant Polyester Shell",
      fit: "Regular Fit",
      warmthLevel: "Maximum Insulation",
      care: "Dry clean recommended"
    }
  },
  {
    name: "BOLDFIT Ribbed Knit Lavender Beanie",
    slug: "boldfit-ribbed-knit-lavender-beanie",
    sku: "WNT-BNI-BOL04",
    price: 18,
    stockCount: 150,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/71OSVlg0c1L._SL1500_.jpg",
    attributes: {
      material: "100% Stretch Acrylic",
      fit: "One Size Fits Most",
      warmthLevel: "Lightweight Warmth",
      care: "Hand wash only"
    }
  },
  {
    name: "Men's Stripe-Trim Olive Bomber Jacket",
    slug: "mens-stripe-trim-olive-bomber-jacket",
    sku: "WNT-JKT-BMB05",
    price: 85,
    stockCount: 80,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/619xMvtqClL._SY606_.jpg",
    attributes: {
      material: "Polyester with Striped Ribbed Trim",
      fit: "Regular Bomber Fit",
      warmthLevel: "Mid-Weight Warmth",
      care: "Machine wash cold"
    }
  },
  {
    name: "Men's Utility Gray Cargo Pants",
    slug: "mens-utility-gray-cargo-pants",
    sku: "WNT-PNT-CRG06",
    price: 49,
    stockCount: 110,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/61u5oAftaeL._SY741_.jpg",
    attributes: {
      material: "100% Cotton Ripstop",
      fit: "Relaxed Fit",
      warmthLevel: "Lightweight Warmth",
      care: "Machine wash warm"
    }
  },
  {
    name: "BOLDFIT Color-Blocked Winter Puffer",
    slug: "boldfit-color-blocked-winter-puffer",
    sku: "WNT-JKT-BLK07",
    price: 120,
    stockCount: 60,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/61j2FBMg2LL._SX569_.jpg",
    attributes: {
      material: "DWR Nylon & Synthetic Down Fill",
      fit: "Regular Fit",
      warmthLevel: "High Insulation",
      care: "Machine wash cold"
    }
  },
  {
    name: "Plaid Fringe Winter Scarf",
    slug: "plaid-fringe-winter-scarf",
    sku: "WNT-SCF-PLD08",
    price: 22,
    stockCount: 130,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/51zSnhYRWvL.jpg",
    attributes: {
      material: "Soft Acrylic & Wool Blend",
      fit: "Over-Sized Fit",
      warmthLevel: "Mid-Weight Warmth",
      care: "Hand wash only"
    }
  },
  {
    name: "Fleece-Lined Beanie Hat & Scarf Set",
    slug: "fleece-lined-beanie-hat-scarf-set",
    sku: "WNT-SET-KNT09",
    price: 39,
    stockCount: 95,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/61H0MFrsWQL._SL1024_.jpg",
    attributes: {
      material: "Acrylic Cable Knit & Fleece Lining",
      fit: "One Size Fits All",
      warmthLevel: "Maximum Insulation",
      care: "Hand wash cold"
    }
  },
  {
    name: "BOLDFIT Slouchy Navy Knit Beanie",
    slug: "boldfit-slouchy-navy-knit-beanie",
    sku: "WNT-BNI-NAV10",
    price: 15,
    stockCount: 140,
    isActive: true,
    imageUrl: "https://m.media-amazon.com/images/I/714lOIwZ+8L._SL1200_.jpg",
    attributes: {
      material: "100% Soft Knit Acrylic",
      fit: "Slouchy Relaxed Fit",
      warmthLevel: "Lightweight Warmth",
      care: "Machine wash cold"
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
