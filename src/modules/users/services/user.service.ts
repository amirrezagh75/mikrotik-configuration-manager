import { ResponseDto } from '../../../common/DTO'
import { RequestInterface } from '../types'
import { MikrotikService, MikrotikTunnelService, MikrotikUtilService } from '../../mikrotik/services'

export class UserServices {
    getIpAddresses = async (input: RequestInterface): Promise<ResponseDto> => {
        // const mkTunnelService = new MikrotikTunnelService(input.address, input.port, input.username, input.password)
        const mkUtilService = new MikrotikUtilService(input.address, input.port, input.username, input.password)
        const ipList = await mkUtilService.getRouterIpAddresses()
        return { ...ipList }
    }

    validateConnection = async (input: RequestInterface) => { 
        const mkService = new MikrotikService(input.address, input.port, input.username, input.password);

        return await mkService.validateConnection()
    }
}