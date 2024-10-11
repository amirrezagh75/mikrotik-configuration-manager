import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors'
import path from 'path'

import { mikrotik, users } from './modules'

const app = express();

app.use(express.json())
app.use(cors())

app.use('/user', users.routes.userRouter);
app.use('/mikrotik', mikrotik.routes.mikrotikRouter);

//load static files here
app.use('/vpn', express.static(path.join(process.cwd(), 'static', 'vpn.html')));
app.use('/tunnel', express.static(path.join(process.cwd(), 'static', 'tunnel.html')));



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`);
});

