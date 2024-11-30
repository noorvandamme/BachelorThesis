require('dotenv').config();
const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

//HTTP-server
const server = require('http').Server(app);

app.use(express.static('public'));

//start server 
server.listen(port, () => {
  console.log(`App listening on port ${port}!`);
 });





