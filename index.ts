import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion, Collection, type Document, ObjectId } from 'mongodb';
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

// async function main(): Promise<void> {
//   try {
    const db = client.db('rentigo');
    const carCollection: Collection<Document> = db.collection('rentCar');
    const rentCollection: Collection<Document> = db.collection('rent');

    // ১. হোম রাউট
    app.get('/', (req: Request, res: Response) => {
      res.send('TypeScript Single File Server is Running!');
    });

    // ২. গ্রোসারি পোস্ট রাউট
    app.post('/api/car', async (req: Request, res: Response) => {
    
        const body = req.body;
        const result = await carCollection.insertOne(body);
        res.status(201).send(result);
    
    });

  
app.get('/api/car', async (req: Request, res: Response) => {
  try {
    // নিশ্চিত করুন req.query অবজেক্টটি ঠিকঠাক ডিস্ট্রাকচার করা হচ্ছে
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as string;

    let query = {};
    
    // সার্চ লজিক ফিক্স
    if (search && search.trim() !== '') {
      query = {
        title: { $regex: search, $options: 'i' } // 'i' এর কারণে F বা f যাই দিন না কেন Ferari খুঁজে পাবে
      };
    }

    // কনসোলে চেক করার জন্য এটি ব্যবহার করুন (টার্মিনালে নোড জেএস লগে দেখতে পাবেন)
    console.log("Database Query Object:", query);

    const sortField = sortBy || 'createdAt';
    const direction = sortOrder === 'desc' ? -1 : 1;

    // মঙ্গোডিবি ফাইন্ড কুয়েরি
    const cursor = carCollection.find(query).sort({ [sortField]: direction });
    
    // পেজিনেশন লজিক
    const pageNumber = parseInt(req.query.page as string) || 1;
    const limitNumber = parseInt(req.query.limit as string) || 8;
    const skip = (pageNumber - 1) * limitNumber;

    const result = await cursor.skip(skip).limit(limitNumber).toArray();
    const totalCars = await carCollection.countDocuments(query);

    res.send({
      success: true,
      meta: { page: pageNumber, limit: limitNumber, total: totalCars, totalPages: Math.ceil(totalCars / limitNumber) },
      data: result
    });

  } catch (error) {
    res.status(500).send({ success: false, error: (error as Error).message });
  }
});
app.get('/api/car/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = req.params.id;
  
  const query = {
    _id: new ObjectId(id),
  };
  
  const result = await carCollection.findOne(query);
  res.send(result);
});
app.delete('/api/car/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = req.params.id;

  const query = {
    _id: new ObjectId(id),
  };

  const result = await carCollection.deleteOne(query);

  if (result.deletedCount === 1) {
    res.status(200).send({ message: "Car deleted successfully" });
  } else {
    res.status(404).send({ message: "Car not found" });
  }
});
app.patch('/api/car/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = req.params.id;
  const { isAvailable } = req.body; 

  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      isAvailable: isAvailable 
    },
  };

  const result = await carCollection.updateOne(filter, updateDoc);
  res.send(result)

});
    app.post('/api/rent', async (req: Request, res: Response) => {
    
        const body = req.body;

      const newRentDoc = {
    ...body,
    createdAt: new Date() // Generates an ISODate timestamp
  };

  const result = await rentCollection.insertOne(newRentDoc);
  res.status(201).send(result);
    
    });
    
app.get("/api/rent", async (req: Request, res: Response) => {
  // Use Record<string, any> so TypeScript allows dynamic properties
  const query: Record<string, any> = {};
  
  if (req.query.sub_id) {
    query.email = req.query.sub_id as string;
  }

  const cursor = rentCollection.find(query);
  const result = await cursor.toArray();
  res.send(result);
});
app.patch('/api/rent/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = req.params.id;
  const { cardStatus } = req.body; 

  const filter = { carId: id};
  const updateDoc = {
    $set: {
      cardStatus: cardStatus
    },
  };

  const result = await rentCollection.updateOne(filter, updateDoc);
  res.send(result)

});
    // DB Connection Ping
    await client.db("admin").command({ ping: 1 });
    console.log("⚡️ Successfully connected to MongoDB!");

    // সার্ভার লিসেন (কানেকশন সফল হলে সার্ভার স্টার্ট হবে)
    // app.listen(port, () => {
    //   console.log(`🚀 Server listening on http://localhost:${port}`);
    // });

  // } catch (error) {
  //   console.error("❌ MongoDB Connection Error:", error);
  //   process.exit(1);
  // }
// }

// main().catch(console.dir);

export default app 