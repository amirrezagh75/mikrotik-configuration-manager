import { ResponseDto } from '../../../common/DTO'
import { CreateTunnelInterface, PublicOrLocalIp, RequestInterface } from '../types'
import { MikrotikService, MikrotikTunnelService, MikrotikUtilService, MikrotikVpnService } from '../../mikrotik/services'
import { generateRandomIP, openVpnTemplate, replaceLastSectionOfIp, toCamelCase } from '../../../utils'
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
                    sourceIp,
                    `vxlan_tunnel_to_${toCamelCase(sourceName.data)}_api`,
                    portNumber
                );

                console.log(`create vtep destination status: ${JSON.stringify(createVtepDestination)}`)

                if (createVtepSource.status != 200 || createVtepDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't create GRE tunnel ${createVtepSource.status != 200 ? 'source vtep' : ''} ${createVtepDestination.status != 200 ? "destination vtep" : ""}`
                    };

                const ipAssignVxlanSource = await ipSelection.mkTunnelServiceSource.setIpAddress(`vxlan_tunnel_to_${toCamelCase(destinationName.data)}_api`, sourceTunnelIpAddress, "24")

                const ipAssignVxlanDestination = await ipSelection.mkTunnelServiceDestination.setIpAddress(`vxlan_tunnel_to_${toCamelCase(sourceName.data)}_api`, destinationTunnelIpAddress, "24")


                if (ipAssignVxlanSource.status != 200 || ipAssignVxlanDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't assign Ip address to ${ipAssignVxlanSource.status != 200 ? "source" : ""} ${ipAssignVxlanDestination.status != 200 ? "destination" : ""}`
                    }

                return { data: { createVxlanSource, createVxlanDestination, ipAssignVxlanSource, ipAssignVxlanDestination }, status: 200, message: `GRE tunnel created successfully with this ip:\nsource:${sourceTunnelIpAddress}\ndestionation:${destinationTunnelIpAddress}` };

            case 'ipip':
                const createIpipSource = await ipSelection.mkTunnelServiceSource.createIpipTunnel(
                    destinationIp,
                    toCamelCase(destinationName.data)
                );
                console.log(`create source tunnel status: ${JSON.stringify(createIpipSource)}`)

                const createIpipDestination = await ipSelection.mkTunnelServiceDestination.createIpipTunnel(
                    sourceIp,
                    toCamelCase(sourceName.data)
                );
                console.log(`create destination tunnel status: ${JSON.stringify(createIpipDestination)}`)

                if (createIpipSource.status != 200 || createIpipDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't create GRE tunnel ${createIpipSource.status != 200 ? 'source router' : ''} ${createIpipDestination.status != 200 ? "destination router" : ""}`
                    };


                const ipAssignIpipSource = await ipSelection.mkTunnelServiceSource.setIpAddress(`gre_tunnel_to_${toCamelCase(destinationName.data)}_api`, sourceTunnelIpAddress, "24")

                const ipAssignIpipDestination = await ipSelection.mkTunnelServiceDestination.setIpAddress(`gre_tunnel_to_${toCamelCase(sourceName.data)}_api`, destinationTunnelIpAddress, "24")


                if (ipAssignIpipSource.status != 200 || ipAssignIpipDestination.status != 200)
                    return {
                        data: {}, status: 508,
                        message: `couldn't assign Ip address to ${ipAssignIpipSource.status != 200 ? "source" : ""} ${ipAssignIpipDestination.status != 200 ? "destination" : ""}`
                    }

                return { data: { createIpipSource, createIpipDestination, ipAssignSource: ipAssignIpipSource, ipAssignIpipDestination }, status: 200, message: `GRE tunnel created successfully with this ip:\nsource:${sourceTunnelIpAddress}\ndestionation:${destinationTunnelIpAddress}` };


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

    public async createVpn(input: CreateVpnInterface): Promise<ResponseDto> {
        const vpnType = input.vpnType
        const username = input.credential.username;
        const password = input.credential.password;
        const host = input.router.local?.address || input.router.public?.address!;
        const port = input.router.local?.port || input.router.public?.port!;

        if (!username || !password)
            return { data: {}, status: 204, message: "please provide one of the local or public fields which includes a username and password" }

        const mkUtilService = new MikrotikUtilService(host, port, username, password)
        const mkVpnService = new MikrotikVpnService(host, port, username, password)

        const identification = await mkUtilService.getIdentity()
        if (identification.status !== 200)
            return { data: {}, status: identification.status, message: identification.message }

        const ipPoolList = await mkUtilService.getIpPoolList()
        if (ipPoolList.status !== 200)
            return { data: {}, status: ipPoolList.status, message: ipPoolList.message }

        const profiles = await mkVpnService.listOfProfiles()
        if (profiles.status != 200)
            return { data: {}, status: profiles.status, message: profiles.message }

        const validIp = await mkUtilService.getValidIp()
        if (validIp.status != 200)
            return { data: {}, status: validIp.status, message: validIp.message }

        const certificates = await mkUtilService.getCertificates()
        if (certificates.status != 200)
            return { data: {}, status: certificates.status, message: certificates.message }

        switch (vpnType) {
            case 'openVpn':
                const poolName = `${toCamelCase(identification.data)}_openVpn_pool_api`

                const poolFound = ipPoolList.data.find((pool) => pool.name === poolName);
                let poolData: any;

                if (!poolFound) {
                    const newPool = await mkUtilService.createIpPool(poolName);
                    if (newPool.status !== 200) {
                        return { data: {}, status: newPool.status, message: newPool.message };
                    }
                    poolData = newPool.data;
                } else {
                    poolData = poolFound;
                }

                const openVpnProfile = `${toCamelCase(identification.data)}_openVpn_profile_api`

                const profileFound = profiles.data.some((profile) => profile.name == openVpnProfile)
                if (!profileFound) {
                    let createProfResult = await mkVpnService.createNewProfile({
                        name: openVpnProfile,
                        localAddress: poolData.startIp || poolData.poolStart,
                        poolName: poolName,
                        dnsServer: '8.8.8.8,1.1.1.1'
                    })
                    if (createProfResult.status != 200)
                        return { data: {}, status: createProfResult.status, message: createProfResult.message }
                }

                //ca certificate
                const caCertificateName = 'CA-Template-OPENVPN-API'
                const caCertificateCommonName = 'CA-OPENVPN-API'

                const caCertFound = certificates.data.some((certificate) => certificate.name == caCertificateName)
                if (!caCertFound) {
                    const createCaResult = await mkUtilService.createCertificate({
                        name: caCertificateName,
                        commonName: caCertificateCommonName,
                        daysValid: 3650,
                        keySize: 4096,
                        keyUsage: 'crl-sign,key-cert-sign'
                    })
                    if (createCaResult.status != 200)
                        return { data: {}, status: createCaResult.status, message: createCaResult.message }
                }
                const signCaResult = await mkUtilService.signCertificate({
                    certificateName: caCertificateName
                })
                if (signCaResult.status != 200)
                    return { data: {}, status: signCaResult.status, message: signCaResult.message }

                const trustCaResult = await mkUtilService.trustCertificate(caCertificateName)
                if (trustCaResult.status != 200)
                    return { data: {}, status: trustCaResult.status, message: trustCaResult.message }


                //server certificate
                const caServerName = 'CA-SERVER-OPENVPN-API'
                const caServerCommonName = 'CA-SERVER-OPENVPN'
                const caServerFound = certificates.data.some((certificate) => certificate.name == caServerName)
                if (!caServerFound) {
                    const caServerResult = await mkUtilService.createCertificate({
                        name: caServerName,
                        commonName: caServerCommonName,
                        daysValid: 3650,
                        keySize: 4096,
                        keyUsage: 'digital-signature,key-encipherment'
                    })
                    if (caServerResult.status != 200)
                        return { data: {}, status: caServerResult.status, message: caServerResult.message }

                }
                const signServerResult = await mkUtilService.signCertificate({
                    certificateName: caServerName,
                    caName: caCertificateName
                })

                if (signServerResult.status != 200)
                    return { data: {}, status: signServerResult.status, message: signServerResult.message }

                const trustCaServerResult = await mkUtilService.trustCertificate(caServerName)
                if (trustCaServerResult.status != 200)
                    return { data: {}, status: trustCaServerResult.status, message: trustCaServerResult.message }

                //client certificate
                const caClientName = 'CA-CLIENT-OPENVPN-API'
                const caClientCommon = 'CA-CLIENT-OPENVPN'
                const caClientFound = certificates.data.some((certificate) => certificate.name == caClientName)

                if (!caClientFound) {
                    const caClientResult = await mkUtilService.createCertificate({
                        name: caClientName,
                        commonName: caClientCommon,
                        daysValid: 3650,
                        keySize: 4096,
                        keyUsage: 'tls-client'
                    })
                    if (caClientResult.status != 200)
                        return { data: {}, status: caClientResult.status, message: caClientResult.message }

                }
                const signClientResult = await mkUtilService.signCertificate({
                    certificateName: caClientName,
                    caName: caCertificateName
                })
                if (signClientResult.status != 200)
                    return { data: {}, status: signClientResult.status, message: signClientResult.message }

                const openVpnPort = await mkUtilService.findUsablePort()
                if (openVpnPort.status != 200)
                    return { data: {}, status: openVpnPort.status, message: openVpnPort.message }

                const openVpnConfig = await mkVpnService.OpenvpnConfig({
                    certificateName: caServerName,
                    port: openVpnPort.data.port!,
                    profileName: openVpnProfile
                })
                if (openVpnConfig.status != 200)
                    return { data: {}, status: openVpnConfig.status, message: openVpnConfig.message }

                const caCert = await mkUtilService.getCaCertificate(caCertificateName)
                if (caCert.status != 200)
                    return { data: {}, status: caCert.status, message: caCert.message }

                const caClient = await mkUtilService.getClientCertAndKey(caClientName)
                if (caClient.status != 200)
                    return { data: {}, status: caClient.status, message: caClient.message }

                console.log(caCert)
                console.log(caClient)


                return { data: 'done!', status: 200, message: 'we are working on new feature to create pptp' }

            case 'l2tp':
                return { data: {}, status: 200, message: 'we are working on new feature to create l2tp' }

            case 'ppp':
                return { data: {}, status: 200, message: 'we are working on new feature to create ppp' }

            case 'pptp':
                return { data: {}, status: 200, message: 'we are working on new feature to create pptp' }

            default:
                return { data: {}, status: 204, message: "selected tunnel was not found!" }
        }
    }

    private async createOpenVpn(input: CreateVpnInterface) { }

    private async createL2tp(input: CreateVpnInterface) { }

    private async createPpp(input: CreateVpnInterface) { }

    private async createPptp(input: CreateVpnInterface) { }

}