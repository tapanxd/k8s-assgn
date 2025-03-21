const express = require("express")
const fs = require("fs")
const port = 6000
const app = express()
const csv = require("csv-parser")
const path = require("path")
app.use(express.json())

const SHARED_PATH = "/Tapan_PV_dir/"
const CONTAINER_2_URL = "http://container2-service:80"

app.post("/store-file", (req, res) => {
  const { file, data } = req.body;

  // Validate input
  if (!file) {
    return res.status(400).json({ file: null, error: "Invalid JSON input." });
  }

  if (!data) {
    return res
      .status(400)
      .json({ file: file, error: "Data is required to store the file." });
  }

  const filePath = path.join(SHARED_PATH, file);

  // Write the file to the shared volume
  fs.writeFile(filePath, data, (err) => {
    if (err) {
      return res.status(500).json({
        file: file,
        error: "Error while storing the file to the storage.",
      });
    }
    return res.status(200).json({ file: file, message: "Success." });
  });
});

app.post("/calculate", async (req, res) => {
  const { file, product } = req.body;

  // Validate input
  if (!file || !product) {
    return res.status(400).json({ file: file || null, error: "Invalid JSON input." });
  }

  const filePath = path.join(SHARED_PATH, file);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ file, error: "File not found." });
  }

  // Validate the CSV format
  const readStream = fs.createReadStream(filePath);
  let isValidCsv = true;

  readStream.pipe(csv({ separator: "," })).on("error", () => {
    isValidCsv = false;
    readStream.destroy(); // Stop reading further on error
    return res
      .status(400)
      .json({ file, error: "Input file not in CSV format." });
  });

  try {
    // Changed from /process to /calculate to match Container 2's endpoint
    const response = await fetch(`${CONTAINER_2_URL}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file, product }),
    });

    // For debugging - uncomment if needed`
    console.log("Response status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));
    
    const rawText = await response.text();
    console.log("Raw response:", rawText.substring(0, 200));
    
    try {
      const data = JSON.parse(rawText);
      return res.status(response.status).json(data);
    } catch (parseError) {
      return res.status(500).json({
        error: "Error parsing response from Container 2",
        details: parseError.message,
        rawResponse: rawText.substring(0, 200)
      });
    }

    // Standard approach - parse JSON directly
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Error communicating with Container 2:", err);
    return res.status(500).json({
      error: "Error communicating with Container 2.",
      details: err.message,
    });
  }
});

app.listen(port, () => {
  console.log("Container 1 running on port 6000.");
});