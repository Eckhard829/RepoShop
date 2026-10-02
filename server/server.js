const express = require('express');
const cookie = require('cookie-parser');

const { PORT } = require('./config/env');
const routes = require('./routes');
const logger = require('./middleware/logger');
const noStore = require('./middleware/noStore');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1);

// 1. Webhook first — needs the RAW body for signature verification
routes.mountPreJson(app);

// 2. JSON + cookies + static + request logging
app.use(logger);
app.use(express.json(), cookie(), express.static('public', { extensions: ['html'] }));

// 3. Passport (needs cookie-parser installed above)
routes.mountPassport(app);

// 4. Routes
routes.mountPostJson(app);

// 5. No-store on the rest of /api
app.use('/api', noStore);

// 6. 404 + error handlers last
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log('Running on port', PORT));