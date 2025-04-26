import formidable from "formidable"
import fs from "fs"
import path from "path"

export const config = {
  api: {
    bodyParser: false, // Tắt bodyParser để xử lý FormData
  },
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const form = formidable({
        uploadDir: path.join(process.cwd(), "public/uploads"),
        keepExtensions: true,
      })

      // Đảm bảo thư mục upload tồn tại
      const uploadDir = path.join(process.cwd(), "public/uploads")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Error parsing form data:", err)
          return res.status(500).json({ error: "Failed to parse form data" })
        }

        const { userId, name, bio } = fields
        const avatar = files.avatar

        let avatarUrl = null
        if (avatar) {
          avatarUrl = `/uploads/${avatar.newFilename}`
        }

        // Giả lập cập nhật thông tin người dùng
        const updatedUser = {
          id: userId,
          name,
          bio,
          avatar: avatarUrl,
        }

        return res.status(200).json(updatedUser)
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