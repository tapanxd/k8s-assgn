const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require('path');
const app = express();
app.use(express.json());

const PORT = 7000;
const SHARED_PATH = "/Tapan_PV_dir/"
    
app.post("/calculate", (req, res) => {
    const { file, product } = req.body;
  
    const filePath = path.join(SHARED_PATH, file);
  
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ file, error: "File not found." });
    }
  
    try {
      const results = [];
      let isHeaderValid = false;
  
      const fileStream = fs.createReadStream(filePath);
  
      fileStream
        .pipe(csv())
        .on("headers", (headers) => {
          // Trim spaces from headers
          headers = headers.map((header) => header.trim());
          console.log("Parsed headers:", headers);
          if (headers.includes("product") && headers.includes("amount")) {
            isHeaderValid = true;
          } else {
            fileStream.destroy();
            return res
              .status(400)
              .json({ file, error: "Input file not in CSV format." });
          }
        })
        .on("data", (row) => {
          // Trim spaces from row keys and values
          const trimmedRow = {};
          for (const key in row) {
            const trimmedKey = key.trim(); // Trim the key name
            const trimmedValue = row[key].trim(); // Trim the value
            trimmedRow[trimmedKey] = trimmedValue;
          }
  
          // console.log("Parsed row:", trimmedRow); // Log rows to verify data parsing
  
          // Check if the product matches and sum the amount
          if (trimmedRow.product === product) {
            const amount = parseInt(trimmedRow.amount, 10);
            if (!isNaN(amount)) {
              results.push(amount);
            }
          }
        })
        .on("end", () => {
          if (!isHeaderValid) {
            return res
              .status(400)
              .json({ file, error: "Input file not in CSV format." });
          }
          const sum = results.reduce((a, b) => a + b, 0);
          return res.json({ file, sum });
        })
        .on("error", (err) => {
          // console.error("CSV Parse Error:", err); // Log any CSV parse errors
          return res
            .status(400)
            .json({ file, error: "Input file not in CSV format." });
        });
    } catch (err) {
      return res
        .status(500)
        .json({ file, error: `An error occurred: ${err.message}` });
    }
  });
  
  app.listen(PORT, () => {
    console.log("Container 2 running on port 3000.");
  });
  