const express = require('express');
const app = express();

// Middleware to parse JSON data from incoming requests
app.use(express.json());

// GET method for /path-of-url
app.get('/path-of-url', (request, response) => {
    console.log(request); // Receives request and logs it for debugging

    // Send a response to the client for GET request
    response.send('This is a GET response');
});

// Start the Express server on port 3000
app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});