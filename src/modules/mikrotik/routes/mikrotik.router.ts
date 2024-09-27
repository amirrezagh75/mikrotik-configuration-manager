import express from 'express';
import { Request, Response } from 'express'

export const mikrotikRouter = express.Router();

mikrotikRouter.get('/', (req: Request, res: Response) => {
    res.json({ data: 'welcome to mikrotik section', status: 200, error: '' })
});

