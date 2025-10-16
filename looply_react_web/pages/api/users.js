import { connectDB } from '../../app/api/mongodb/route'

export default async function handler(req, res) {
  const db = await connectDB()
  
  if (req.method === 'GET') {
    try {
      const users = await db.collection('users').find({}).toArray()
      return res.status(200).json(users)
    } catch (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ error: 'Failed to fetch users' })
    }
  }

  if (req.method === 'POST') {
    try {
      const user = req.body
      const result = await db.collection('users').insertOne({
        ...user,
        createdAt: new Date().toISOString()
      })
      return res.status(200).json({ ...user, _id: result.insertedId })
    } catch (error) {
      console.error('Error creating user:', error)
      return res.status(500).json({ error: 'Failed to create user' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
} 