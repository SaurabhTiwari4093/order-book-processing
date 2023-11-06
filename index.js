const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

// app.use(express.json())

// app.get('/', (req, res) => {
//   res.send('Order Book Processing backend')
// })

app.use(express.static("client"));

const xmlRouter = require('./routes/xml')
app.use('/api/xml', xmlRouter)

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})