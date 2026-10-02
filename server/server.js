const express = require("express");
const cookie = require("cookie-parser");

const { PORT } = require("./config/env");
const routes = require("./routes");
const logger = require("./middleware/logger");
const noStore = require("./middleware/noStore");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();
app.set("trust proxy", 1);

routes.mountPreJson(app);
app.use(logger);
app.use(
  express.json(),
  cookie(),
  express.static("public", { extensions: ["html"] }),
);
routes.mountPassport(app);
routes.mountPostJson(app);
app.use("/api", noStore);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log("Running on port", PORT));
