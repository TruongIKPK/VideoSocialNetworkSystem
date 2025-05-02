import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

// Sử dụng biến môi trường hoặc URI mặc định
const uri = process.env.MONGODB_URI || "mongodb+srv://looply:12345@cluster0.itbnhsw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = process.env.MONGODB_DB || "Looply_DB";

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,                // Giới hạn số lượng kết nối tối đa
  connectTimeoutMS: 5000,         // Giới hạn thời gian kết nối
  socketTimeoutMS: 45000,         // Giới hạn thời gian không hoạt động
}

let clientPromise = null;

// Khởi tạo kết nối MongoDB một lần
function getMongoClient() {
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, options).connect();
  }
  return clientPromise;
}

export async function connectDB() {
  try {
    const client = await getMongoClient();
    const db = client.db(dbName);
    
    // Kiểm tra kết nối bằng cách ping
    await db.command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // Nếu lỗi kết nối, reset clientPromise để thử lại lần sau
    clientPromise = null;
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

    console.log('Received request:', { collection, action, body });

    const db = await connectDB();

    switch (action) {
      case 'insertOne':
        const result = await db.collection(collection).insertOne(body);
        return Response.json({ ...body, _id: result.insertedId });
      
      case 'updateOne':
        const { query, update } = body;
        
        console.log('Update query:', query);
        console.log('Update data:', update);
        
        // Convert string _id to ObjectId if it exists
        if (query._id) {
          try {
            // Nếu _id đã là ObjectId, không cần convert
            if (query._id instanceof ObjectId) {
              console.log('_id is already ObjectId');
            } else {
              query._id = new ObjectId(query._id);
              console.log('Converted _id to ObjectId:', query._id);
            }
          } catch (error) {
            console.error('Invalid ObjectId:', query._id);
            return Response.json({ error: 'Invalid user ID format' }, { status: 400 });
          }
        }
        
        const updateResult = await db.collection(collection).updateOne(
          query,
          update
        );
        
        console.log('Update result:', updateResult);
        
        if (updateResult.matchedCount === 0) {
          return Response.json({ 
            error: 'Document not found',
            query: query,
            update: update
          }, { status: 404 });
        }
        
        return Response.json({ 
          success: true,
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount,
          upsertedCount: updateResult.upsertedCount
        });
      
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('MongoDB operation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}