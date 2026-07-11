import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion, Collection, type Document } from 'mongodb';
import 'dotenv/config';

const app = express();
const port = process.env.NEXT_BASE_URL || 5000;
const uri = process.env.MONGODB_URL;

if (!uri) {
  console.error("❌ Error: MONGODB_URL is missing in .env file");
  process.exit(1);
}

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function main(): Promise<void> {
  try {
    const db = client.db('rentigo');
    // const productCollection: Collection<Document> = db.collection('grocery');

    // ১. হোম রাউট
    app.get('/', (req: Request, res: Response) => {
      res.send('TypeScript Single File Server is Running!');
    });

    // ২. গ্রোসারি পোস্ট রাউট
    app.post('/api/car', async (req: Request, res: Response) => {
      try {
        const body = req.body;
        const result = await productCollection.insertOne(body);
        res.status(201).send(result);
      } catch (error) {
        console.error("Data insertion error:", error);
        res.status(500).send({ error: "Failed to insert item" });
      }
    });

    // DB Connection Ping
    await client.db("admin").command({ ping: 1 });
    console.log("⚡️ Successfully connected to MongoDB!");

    // সার্ভার লিসেন (কানেকশন সফল হলে সার্ভার স্টার্ট হবে)
    app.listen(port, () => {
      console.log(`🚀 Server listening on http://localhost:${port}`);
    });

  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
}

main().catch(console.dir);