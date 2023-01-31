const express = require('express');
const port = process.env.PORT;
const app = express();
const bodyParser = require('body-parser');
require('./db');
require('./models/User');
require('./models/Message');
require('./models/Posts');
const authRoutes = require('./routes/authRoutes');
const uploadMediaRoutes = require('./routes/uploadMediaRoutes');
const messageRoutes = require('./routes/messageRoutes');
//requireToken skipped


//.......18



//


app.use(bodyParser.json());
app.use(authRoutes);
app.use(uploadMediaRoutes);
app.use(messageRoutes);

app.get('/', (req, res) => {
    res.send("Hello World");
})


// ...
app.listen(port, () => {
    console.log("Server is running on port " + port);
})