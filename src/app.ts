import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors'

import { mikrotik, users } from './modules'

const app = express();

app.use(express.json())
app.use(cors())

app.use('/user', users.routes.userRouter);
app.use('/mikrotik', mikrotik.routes.mikrotikRouter);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`);
});

