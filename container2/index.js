const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require('path');
const app = express();
app.use(express.json());

const PORT = 7000;
const SHARED_PATH = "/Tapan_PV_dir/"

app.post("/process", (req, res) => {
    const { file, product } = req.body;
    const filePath = path.join(SHARED_PATH, file);
    console.log(filePath);
    let sum = 0;
    let fileValid = true;

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ file, error: "File not found." });
    }

    // Parse the CSV file and calculate the sum
    //const results = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
            console.log(row);
            if (row.product && row.amount) {
                if (row.product === product) {
                    sum += parseInt(row.amount);
                }
            } else {
                fileValid = false;
            }
        })
        .on("end", () => {
            if (!fileValid) {
                return res.status(400).json({ file, error: "Input file not in CSV format." });
            }
            return res.json({ file, sum });
        })
        .on("error", () => {
            return res.status(500).json({ error: "Error reading the file." });
        });
});

app.listen(PORT, () => console.log(`Container 2 listening on port ${PORT}`));
