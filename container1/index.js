const express = require("express")
const fs = require("fs")
const port = 6000
const app = express()
const csv = require("csv-parser")
const path = require("path")
app.use(express.json())

// New endpoint: /store-file
app.post("/store-file", (req, res) => {
  console.log("Received request to /store-file:", req.body)
  const { file, data } = req.body

  // Validate input
  if (!file) {
    return res.status(400).json({ file: null, error: "Invalid JSON input." })
  }

  if (!data) {
    return res
      .status(400)
      .json({ file: file, error: "Data is required to store the file." });
  }

  // For Kubernetes deployment, we'll use /data directory for the persistent volume
  // This will be changed to your specific PV directory name in the Kubernetes config
  const filePath = path.resolve(__dirname, "/data", file)
  console.log("Attempting to write to:", filePath)

  try {
    // Create the directory if it doesn't exist
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write the data to the file
    fs.writeFileSync(filePath, data)
    console.log("File written successfully")
    return res.json({ file, message: "Success." })
  } catch (error) {
    console.error("Error storing file:", error)
    return res.status(500).json({ file, error: "Error while storing the file to the storage." })
  }
})

// Existing /calculate endpoint
app.post("/calculate", async (req, res) => {
  const { file, product } = req.body

  if (!file || !product) {
    return res.status(400).json({ file: file || null, error: "Invalid JSON input." })
  }

  const filePath = path.resolve(__dirname, "/data", file)
  console.log(filePath)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ file, error: "File not found." })
  }

  const readStream = fs.createReadStream(filePath)
  let isCSVValid = true
  let columnCount = null

  try {
    readStream
      .pipe(csv({ separator: "," }))
      .on("data", (row) => {
        const currentColumnCount = Object.keys(row).length

        // Check if the number of columns is consistent
        if (columnCount === null) {
          columnCount = currentColumnCount // Set initial column count
        } else if (currentColumnCount !== columnCount) {
          isCSVValid = false // Inconsistent column count
          readStream.destroy()
        }
      })
      .on("error", (err) => {
        isCSVValid = false
        readStream.destroy()
        return res.status(400).json({ file, error: "Input file not in CSV format." }) // Stop reading further on error
      })
      .on("end", () => {
        if (!isCSVValid || columnCount === null) {
          return res.status(400).json({ file, error: "Input file not in CSV format." })
        }
      })
  } catch (err) {
    console.error("Error processing the file:", err)
    return res.status(500).json({ file, error: "Internal server error." })
  }

  try {
    const response = await fetch("http://container2:7000/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file, product }),
    })

    const data = await response.json()

    // Ensure no further processing once a response is sent.
    if (!res.headersSent) {
      return res.status(response.status).json(data)
    }
  } catch (err) {
    // Log the error for debugging purposes.
    console.error("Error communicating with Container 2:", err)

    // Send a response only if the above doesn't send one.
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Error communicating with Container 2.",
        details: err.message,
      })
    }
  }
})

// Add a simple test endpoint to verify the server is running
app.get("/test", (req, res) => {
  res.json({ message: "Server is running" })
})

app.listen(port, () => console.log(`Container 1 listening on port ${port}`))

