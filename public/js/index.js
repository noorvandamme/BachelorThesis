require('dotenv').config();
// const isDevelopment = (process.env.NODE_ENV === 'development');
const express = require('express');
const app = express();
// const fs = require('fs');

const port = process.env.PORT || 3000;

//HTTP-server
const server = require('http').Server(app);

app.use(express.static('public'));

//start server 
server.listen(port, () => {
  console.log(`App listening on port ${port}!`);
 });





