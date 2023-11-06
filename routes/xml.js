const express = require('express');
const router = express.Router();

const pdfParse = require('pdf-parse')
const keyword_extractor = require("keyword-extractor");

var multer = require('multer');
var upload = multer();

//Get data from pdf
router.post('/parser', upload.single('PDF'), async (req, res) => {
    try {
        pdfParse(req.file.buffer).then((data) => {
            // console.log(data);
            const extraction_result =
                keyword_extractor.extract(data.text, {
                    language: "english",
                    remove_digits: false,
                    return_changed_case: true,
                    remove_duplicates: true

                });

            res.status(200).json({
                status: 200,
                pdfText: extraction_result
            })
        });
    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            status: 500,
            message: error.message
        })
    }
})

module.exports = router