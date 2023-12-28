const connectToMongo = require("./db");
const express = require('express')
const cors = require('cors')
require("dotenv").config();



connectToMongo();

const app = express()
const port = process.env.PORT_NUMBER

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello Aagaman!')
})

app.use('/auth',require('./routes/auth'));

app.listen(port, () => {
  console.log(`All-trade-cn app listening on port ${port}`)
})