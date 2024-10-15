import express from 'express';
import { Request, Response } from 'express'
import { validateRequest } from '../../../common/middlewares';
import { CreateMachineSchema, GetClusterValueSchema, ICreateMachine, IGetClusterValue } from '../types';
import { VcenterServices } from '../services';

export const vcenterRouter = express.Router();

vcenterRouter.get('/', (req: Request, res: Response) => {
    res.json({ data: 'welcome to vcenter section', status: 200, error: '' })
});

vcenterRouter.post('/clusterList', validateRequest(GetClusterValueSchema),async (req: Request, res: Response) => {
    const body: IGetClusterValue = req.body;

    const vCenterService = new VcenterServices(body);
    const tunnelCreationRes = await vCenterService.getClusterValue();

    res.json(tunnelCreationRes);
} )

vcenterRouter.post('/createMachine', validateRequest(CreateMachineSchema),async (req: Request, res: Response) => {
    const body: ICreateMachine = req.body;

    const vCenterService = new VcenterServices(body);
    const tunnelCreationRes = await vCenterService.createMachine(body);

    res.json(tunnelCreationRes);
} )
