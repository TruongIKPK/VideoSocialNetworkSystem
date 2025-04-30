import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = "mongodb+srv://looply:12345@cluster0.itbnhsw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db = null;

async function connectDB() {
  if (db) return db;
  
  try {
    await client.connect();
    db = client.db("looply");
    console.log("Successfully connected to MongoDB!");
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const action = searchParams.get('action');
    const query = searchParams.get('query') ? JSON.parse(searchParams.get('query')) : {};

    const db = await connectDB();

    switch (action) {
      case 'find':
        const documents = await db.collection(collection).find(query).toArray();
        return Response.json(documents);
      
      case 'findOne':
        const document = await db.collection(collection).findOne(query);
        return Response.json(document);
      
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const action = searchParams.get('action');
    const body = await request.json();

    const db = await connectDB();

    switch (action) {
      case 'insertOne':
        const result = await db.collection(collection).insertOne(body);
        return Response.json({ ...body, id: result.insertedId });
      
      case 'updateOne':
        const { query, update } = body;
        const updateResult = await db.collection(collection).updateOne(query, { $set: update });
        if (updateResult.matchedCount === 0) {
          return Response.json({ error: 'Document not found' }, { status: 404 });
        }
        return Response.json({ success: true });
      
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 