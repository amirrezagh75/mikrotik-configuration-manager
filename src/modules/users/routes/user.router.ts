import express from 'express';
import { Request, Response } from 'express'
import { UserServices } from '../services';
import { RequestInputSchema, CreateTunnelSchema, CreateTunnelInterface } from '../types'
import { validateRequest } from '../../../common/middlewares'
export const userRouter = express.Router();


userRouter.get('/', async (req: Request, res: Response) => {
    res.json({ data: 'welcome to user section', status: 200, error: '' })
});

userRouter.post('/ipList', validateRequest(RequestInputSchema), async (req: Request, res: Response) => {
    const { username, password, address, port } = req.body;

    const userService = new UserServices();
    res.json(await userService.getIpAddresses({ address, password, username, port }));
});

userRouter.post('/validate', validateRequest(RequestInputSchema), async (req: Request, res: Response) => {
    const { username, password, address, port } = req.body;

    const userService = new UserServices();
    const validationResponse = await userService.validateConnection({ username, password, address, port });

    res.json(validationResponse);
});

userRouter.post('/createTunnel', validateRequest(CreateTunnelSchema),async (req: Request, res: Response) => {
    const body: CreateTunnelInterface = req.body;

    const userService = new UserServices();
    const tunnelCreationRes = await userService.createTunnel(body);

    res.json(tunnelCreationRes);
} )
