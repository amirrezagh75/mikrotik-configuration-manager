import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { mikrotik, users } from './modules'

const app = express();

app.use(express.json())

app.use('/user', users.routes.userRouter);
app.use('/mikrotik', mikrotik.routes.mikrotikRouter);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`);
});

/*
{
  seq: '0',
  host: '1.2.3.4',
  status: 'timeout',
  sent: '1',
  received: '0',
  'packet-loss': '100'
}

{
  seq: '0',
  host: '8.8.8.8',
  size: '56',
  ttl: '108',
  time: '117ms232us',
  sent: '1',
  received: '1',
  'packet-loss': '0',
  'min-rtt': '117ms232us',
  'avg-rtt': '117ms232us',
  'max-rtt': '117ms232us'
}
*/