import { ResponseDto } from '../../../common/DTO'
import { CreateTunnelInterface, PublicOrLocalIp, RequestInterface } from '../types'
import { MikrotikService, MikrotikTunnelService, MikrotikUtilService } from '../../mikrotik/services'
import { generateRandomIP, replaceLastSectionOfIp, toCamelCase } from '../../../utils'
import { CreateVpnInterface } from '../types/createVpn.interface'

export class UserServices {
    
    public getIpAddresses = async (input: RequestInterface): Promise<ResponseDto> => {
        const mkUtilService = new MikrotikUtilService(input.address, input.port, input.username, input.password);
        const ipList = await mkUtilService.getRouterIpAddresses();

        if (ipList.status !== 200 || !Array.isArray(ipList.data)) {
            return { data: [], status: ipList.status, message: 'Failed to retrieve IP addresses' };
        }

        return { ...ipList };
    }

    public validateConnection = async (input: RequestInterface) => {
        const mkService = new MikrotikService(input.address, input.port, input.username, input.password);

        return await mkService.validateConnection()
    }

    public createTunnel = async (input: CreateTunnelInterface) => {
        const source = input.source;
        const destination = input.destination;

        // Check if either local or public IP is provided for both source and destination
        if (!source.local?.address && !source.public?.address)
            return { data: '', status: 406, message: 'You should provide one of local or public IP for source' };

        if (!destination.local?.address && !destination.public?.address)
            return { data: '', status: 406, message: 'You should provide one of local or public IP for destination' };

        const ipSelection = this.selectPublicOrLocalIp(input);

        if (!ipSelection.mkUtilServiceSource || !ipSelection.mkUtilServiceDestination || !ipSelection.mkTunnelServiceSource || !ipSelection.mkTunnelServiceDestination)
            return { data: '', status: 406, message: 'Missing tunnel services or IP information for source or destination' };

        // Validate connection to source and destination routers
        const validConnectionSource = await ipSelection.mkUtilServiceSource.validateConnection();
        const validConnectionDestination = await ipSelection.mkUtilServiceDestination.validateConnection();

        if (validConnectionSource.status !== 200 || !Array.isArray(validConnectionSource.data)) {
            return { data: '', status: 504, message: 'Connection to source router failed' };
        }

        if (validConnectionDestination.status !== 200 || !Array.isArray(validConnectionDestination.data)) {
            return { data: '', status: 504, message: 'Connection to destination router failed' };
        }

        // Get available IP for tunnel
        const sourceName = await ipSelection.mkUtilServiceSource?.getIdentity();
        const destinationName = await ipSelection.mkUtilServiceDestination?.getIdentity();

        const selectedNetwork = await this.getAvailableIp(ipSelection);
        if (selectedNetwork.status != 200)
            return { data: '', status: selectedNetwork.status, message: selectedNetwork.message };

        const sourceTunnelIpAddress = replaceLastSectionOfIp(selectedNetwork.data, 1)
        const destinationTunnelIpAddress = replaceLastSectionOfIp(selectedNetwork.data, 2)

        const sourceIp = source.public?.address || source.local?.address!;
        const destinationIp = destination.public?.address || destination.local?.address!;

        switch (input.tunnelType) {
            case 'gre':

                const createGreSource = await ipSelection.mkTunnelServiceSource.createGreTunnel(
                    destinationIp,
                    toCamelCase(destinationName.data)
                );
                console.log(`create source tunnel status: ${JSON.stringify(createGreSource)}`)

                const createGreDestination = await ipSelection.mkTunnelServiceDestination.createGreTunnel(
                    sourceIp,
                    toCamelCase(sourceName.data)
                );
                console.log(`create destination tunnel status: ${JSON.stringify(createGreDestination)}`)

                if (createGreSource.status != 200 || createGreDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't create GRE tunnel ${createGreSource.status != 200 ? 'source router' : ''} ${createGreDestination.status != 200 ? "destination router" : ""}`
                    };


                const ipAssignGreSource = await ipSelection.mkTunnelServiceSource.setIpAddress(`gre_tunnel_to_${toCamelCase(destinationName.data)}_api`, sourceTunnelIpAddress, "24")

                const ipAssignDestination = await ipSelection.mkTunnelServiceDestination.setIpAddress(`gre_tunnel_to_${toCamelCase(sourceName.data)}_api`, destinationTunnelIpAddress, "24")


                if (ipAssignGreSource.status != 200 || ipAssignDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't assign Ip address to ${ipAssignGreSource.status != 200 ? "source" : ""} ${ipAssignDestination.status != 200 ? "destination" : ""}`
                    }

                return { data: { createGreSource, createGreDestination, ipAssignSource: ipAssignGreSource, ipAssignDestination }, status: 200, message: `GRE tunnel created successfully with this ip:\nsource:${sourceTunnelIpAddress}\ndestionation:${destinationTunnelIpAddress}` };

            case 'eoip':
                const tunnelId = Math.random().toString(36).substring(2, 8) + Date.now().toString(36).slice(-4);

                const createEoipSource = await ipSelection.mkTunnelServiceSource.createEoipTunnel(
                    destinationIp,
                    toCamelCase(destinationName.data),
                    parseInt(tunnelId)
                );
                console.log(`create source tunnel status: ${JSON.stringify(createEoipSource)}`)

                const createEoipDestination = await ipSelection.mkTunnelServiceDestination.createEoipTunnel(
                    sourceIp,
                    toCamelCase(sourceName.data),
                    parseInt(tunnelId)
                );
                console.log(`create destination tunnel status: ${JSON.stringify(createEoipDestination)}`)

                if (createEoipSource.status != 200 || createEoipDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't create GRE tunnel ${createEoipSource.status != 200 ? 'source eoip' : ''} ${createEoipDestination.status != 200 ? "destination eoip" : ""}`
                    };


                const ipAssignEoipSource = await ipSelection.mkTunnelServiceSource.setIpAddress(`eoip_tunnel_to_${toCamelCase(destinationName.data)}_api`, sourceTunnelIpAddress, "24")

                const ipAssignEoipDestination = await ipSelection.mkTunnelServiceDestination.setIpAddress(`eoip_tunnel_to_${toCamelCase(sourceName.data)}_api`, destinationTunnelIpAddress, "24")


                if (ipAssignEoipSource.status != 200 || ipAssignEoipDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't assign Ip address to ${ipAssignEoipSource.status != 200 ? "source" : ""} ${ipAssignEoipDestination.status != 200 ? "destination" : ""}`
                    }

                return { data: { createEoipSource, createEoipDestination, ipAssignEoipSource, ipAssignEoipDestination }, status: 200, message: `GRE tunnel created successfully with this ip:\nsource:${sourceTunnelIpAddress}\ndestionation:${destinationTunnelIpAddress}` };

            case 'vxlan':
                const portNumber = Math.floor(Math.random() * (9000 - 500 + 1)) + 500 // random port number between 500 - 9000
                const minVNI = 1;
                const maxVNI = 16777215;
                const vni = Math.floor(Math.random() * (maxVNI - minVNI + 1)) + minVNI;


                const createVxlanSource = await ipSelection.mkTunnelServiceSource.createVxlanTunnel(
                    toCamelCase(destinationName.data),
                    portNumber,
                    vni
                );
                console.log(`create source tunnel status: ${JSON.stringify(createVxlanSource)}`)

                const createVxlanDestination = await ipSelection.mkTunnelServiceDestination.createVxlanTunnel(
                    toCamelCase(sourceName.data),
                    portNumber,
                    vni
                );
                console.log(`create destination tunnel status: ${JSON.stringify(createVxlanDestination)}`)


                if (createVxlanSource.status != 200 || createVxlanDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't create GRE tunnel ${createVxlanSource.status != 200 ? 'source vxlan' : ''} ${createVxlanDestination.status != 200 ? "destination vxlan" : ""}`
                    };
                
                    const createVtepSource = await ipSelection.mkTunnelServiceSource.addVtepToVxlan(
                    destinationIp,
                    `vxlan_tunnel_to_${toCamelCase(destinationName.data)}_api`,
                    portNumber
                );
                console.log(`create vtep source status: ${JSON.stringify(createVtepSource)}`)

                const createVtepDestination = await ipSelection.mkTunnelServiceDestination.addVtepToVxlan(
                    destinationIp,
                    `vxlan_tunnel_to_${toCamelCase(sourceName.data)}_api`,
                    portNumber
                );

                console.log(`create vtep destination status: ${JSON.stringify(createVtepDestination)}`)

                if (createVtepSource.status != 200 || createVtepDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't create GRE tunnel ${createVtepSource.status != 200 ? 'source vtep' : ''} ${createVtepDestination.status != 200 ? "destination vtep" : ""}`
                    };

                const ipAssignVxlanSource = await ipSelection.mkTunnelServiceSource.setIpAddress(`eoip_tunnel_to_${toCamelCase(destinationName.data)}_api`, sourceTunnelIpAddress, "24")

                const ipAssignVxlanDestination = await ipSelection.mkTunnelServiceDestination.setIpAddress(`eoip_tunnel_to_${toCamelCase(sourceName.data)}_api`, destinationTunnelIpAddress, "24")


                if (ipAssignVxlanSource.status != 200 || ipAssignVxlanDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't assign Ip address to ${ipAssignVxlanSource.status != 200 ? "source" : ""} ${ipAssignVxlanDestination.status != 200 ? "destination" : ""}`
                    }

                return { data: { createVxlanSource, createVxlanDestination, ipAssignVxlanSource, ipAssignVxlanDestination }, status: 200, message: `GRE tunnel created successfully with this ip:\nsource:${sourceTunnelIpAddress}\ndestionation:${destinationTunnelIpAddress}` };

            default:
                return { data: '', status: 204, message: 'Selected tunnel type is not valid' };
        }
    }

    private selectPublicOrLocalIp = (input: CreateTunnelInterface) => {
        const source = input.source
        const destination = input.destination
        let mkUtilServiceSource, mkTunnelServiceSource, mkUtilServiceDestination, mkTunnelServiceDestination

        if (source.local) {
            mkUtilServiceSource = new MikrotikUtilService(source.local.address, source.local.port, source.username, source.password)
            mkTunnelServiceSource = new MikrotikTunnelService(source.local.address, source.local.port, source.username, source.password)

        }

        if (source.public) {
            mkUtilServiceSource = new MikrotikUtilService(source.public.address, source.public.port, source.username, source.password)
            mkTunnelServiceSource = new MikrotikTunnelService(source.public.address, source.public.port, source.username, source.password)

        }

        if (destination.local) {
            mkUtilServiceDestination = new MikrotikUtilService(destination.local.address, destination.local.port, source.username, source.password)
            mkTunnelServiceDestination = new MikrotikTunnelService(destination.local.address, destination.local.port, source.username, source.password)

        }

        if (destination.public) {
            mkUtilServiceDestination = new MikrotikUtilService(destination.public.address, destination.public.port, source.username, source.password)
            mkTunnelServiceDestination = new MikrotikTunnelService(destination.public.address, destination.public.port, source.username, source.password)

        }

        return { mkUtilServiceSource, mkTunnelServiceSource, mkUtilServiceDestination, mkTunnelServiceDestination }
    }

    private getAvailableIp = async (input: PublicOrLocalIp): Promise<ResponseDto> => {
        let isValid = false, sourceIsValid = false, destinationIsValid = false;
        let randomIp: string | undefined;

        if (!input.mkUtilServiceSource || !input.mkUtilServiceDestination)
            return { data: '', status: 406, message: 'you should provide one of local or public object' }

        try {
            const sourceRouterNetworks = await input.mkUtilServiceSource.getRouterIpAddresses();
            const destinationRouterNetworks = await input.mkUtilServiceDestination.getRouterIpAddresses();

            if (sourceRouterNetworks.status !== 200 || !Array.isArray(sourceRouterNetworks.data)) {
                return { data: '', status: 500, message: 'Failed to retrieve source router networks' };
            }

            if (destinationRouterNetworks.status !== 200 || !Array.isArray(destinationRouterNetworks.data)) {
                return { data: '', status: 500, message: 'Failed to retrieve source router networks' };
            }

            while (!isValid) {
                randomIp = generateRandomIP();
                sourceIsValid = sourceRouterNetworks.data.every((net: any) => net.network !== randomIp);
                destinationIsValid = destinationRouterNetworks.data.every((net: any) => net.network !== randomIp);

                if (sourceIsValid && destinationIsValid) {
                    isValid = true
                }

                sourceIsValid = false,
                destinationIsValid = false
            }
            return { data: randomIp, status: 200, message: 'Available IP found' };
        } catch (error) {
            console.error(`Error in getAvailableIp function: ${error}`);
            return { data: '', status: 500, message: 'Error while checking available IP' };
        }
        return { data: '', status: 500, message: 'Could not find available IP' };
    };

    public async createVpn(input:CreateVpnInterface){
        const vpnType = input.vpnType

        switch(vpnType){
            case 'openVpn':
                return { data:{} , status: 200, message:'we are working on new feature to create openVpn' }
            case 'l2tp':
                return { data:{} , status: 200, message:'we are working on new feature to create l2tp' }
            case 'ppp':
                return { data:{} , status: 200, message:'we are working on new feature to create ppp' }
            case 'pptp':
                return { data:{} , status: 200, message:'we are working on new feature to create pptp' }
        }
    }

    private async createOpenVpn(input:CreateVpnInterface){}

    private async createL2tp(input:CreateVpnInterface){}

    private async createPpp(input:CreateVpnInterface){}

    private async createPptp(input:CreateVpnInterface){}
    
}