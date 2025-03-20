import app from "./app.js";
import 'dotenv/config';
import logger from "./utils/logger.js";
const port = process.env.PORT || 3001;


export const server = app.listen(port, () => {
  logger.info('✅ Server started')
  console.log(`Server is listening on port ${port}`);
});


// export default server