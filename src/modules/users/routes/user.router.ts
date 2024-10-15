import express from 'express';
import { Request, Response } from 'express'
import { UserServices } from '../services';
import { RequestInputSchema, CreateTunnelSchema, CreateTunnelInterface, RequestInterface, ICreateSecrete, CreateSecreteSchema } from '../types'
import { validateRequest } from '../../../common/middlewares'
import { CreateVpnInterface, CreateVpnSchema } from '../types/createVpn.interface';
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

userRouter.post('/createVpn', validateRequest(CreateVpnSchema),async (req: Request, res: Response) => {
    const body: CreateVpnInterface = req.body;

    const userService = new UserServices();
    const tunnelCreationRes = await userService.createVpn(body);

    res.json(tunnelCreationRes);
} )

userRouter.post('/profileList', validateRequest(RequestInputSchema),async (req: Request, res: Response) => {
    const body: RequestInterface = req.body;

    const userService = new UserServices();
    const profilesRes = await userService.profileList(body);

    res.json(profilesRes);
} )

userRouter.post('/createSecrete', validateRequest(CreateSecreteSchema),async (req: Request, res: Response) => {
    const body: ICreateSecrete = req.body;

    const userService = new UserServices();
    const newSecreteRes = await userService.createSecrete(body);

    res.json(newSecreteRes);
} )


