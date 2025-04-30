import Busboy from 'busboy'
import cloudinary from "@/lib/cloudinary"
import fs from "fs"
import path from "path"

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const busboy = Busboy({ headers: req.headers })
      const fields = {}
      const fileBuffers = []

      return new Promise((resolve, reject) => {
        busboy.on('file', (fieldname, file, info) => {
          const { filename, mimeType } = info
          const chunks = []
          
          file.on('data', (chunk) => {
            chunks.push(chunk)
          })

          file.on('end', () => {
            if (chunks.length) {
              fileBuffers.push({
                fieldname,
                buffer: Buffer.concat(chunks),
                filename,
                mimeType
              })
            }
          })
        })

        busboy.on('field', (fieldname, val) => {
          fields[fieldname] = val
        })

        busboy.on('finish', async () => {
          try {
            const { userId, name, bio } = fields
            if (!userId || !name) {
              return res.status(400).json({ error: 'Missing required fields' })
            }

            let avatarUrl = null
            const avatarFile = fileBuffers.find(f => f.fieldname === 'avatar')
            if (avatarFile) {
              try {
                // Upload to Cloudinary
                const result = await new Promise((resolve, reject) => {
                  cloudinary.uploader.upload_stream(
                    {
                      folder: 'avatars',
                      format: 'jpg',
                      transformation: [
                        { width: 400, height: 400, crop: 'fill' },
                        { quality: 'auto' }
                      ]
                    },
                    (error, result) => {
                      if (error) reject(error)
                      resolve(result)
                    }
                  ).end(avatarFile.buffer)
                })
                
                avatarUrl = result.secure_url
              } catch (error) {
                console.error("Error uploading avatar to Cloudinary:", error)
                return res.status(500).json({ error: "Failed to upload avatar" })
              }
            }

            // Read existing users data
            const usersFilePath = path.join(process.cwd(), 'data', 'users.json')
            let users = []
            try {
              users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'))
            } catch (error) {
              console.error('Error reading users file:', error)
              return res.status(500).json({ message: 'Error reading users data' })
            }

            // Find and update user
            const userIndex = users.findIndex(u => u.id === userId)
            if (userIndex === -1) {
              return res.status(404).json({ message: 'User not found' })
            }

            // Update user data
            users[userIndex] = {
              ...users[userIndex],
              name,
              bio,
              avatar: avatarUrl || users[userIndex].avatar
            }

            // Save updated users data
            fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))

            res.status(200).json(users[userIndex])
            resolve()
          } catch (error) {
            console.error("Error processing request:", error)
            res.status(500).json({ error: "Internal server error" })
            reject(error)
          }
        })

        req.pipe(busboy)
      })
    } catch (error) {
      console.error("Internal server error:", error)
      return res.status(500).json({ error: "Internal server error" })
    }
  } else {
    res.setHeader("Allow", ["POST"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}