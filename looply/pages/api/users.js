import fs from 'fs'
import path from 'path'

const usersFilePath = path.join(process.cwd(), 'data', 'users.json')

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Đọc dữ liệu từ file
    if (!fs.existsSync(usersFilePath)) {
      return res.status(200).json([])
    }
    const data = fs.readFileSync(usersFilePath, 'utf-8')
    return res.status(200).json(JSON.parse(data))
  }

  if (req.method === 'POST') {
    // Ghi dữ liệu vào file
    const users = req.body
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ message: 'Method not allowed' })
} 