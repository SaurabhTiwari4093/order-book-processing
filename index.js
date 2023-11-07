const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

// app.use(express.json())

// app.get('/', (req, res) => {
//   res.send('Order Book Processing backend')
// })

app.use(express.static("client"));

const xmlRouter = require('./routes/script')
app.use('/api/script', xmlRouter)

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})