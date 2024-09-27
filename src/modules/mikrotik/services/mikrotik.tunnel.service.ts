import { ResponseDto } from "../../../common/DTO";
import { MikrotikService } from "./mikrotik.service";

export class MikrotikTunnelService extends MikrotikService {
    public async createGreTunnel(localAddress: string, remoteAddress: string, name: string): Promise<ResponseDto> {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/interface/gre/add', [
                `=name=${name}`,
                `=remote-address=${remoteAddress}`
            ]);

            console.log(`GRE Tunnel ${name} created successfully`, response);

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikTunnelService > createGreTunnel > error: \n${error}`)

            this.disconnect()

            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async createEoipTunnel(name: string, localAddress: string, remoteAddress: string, tunnelId: number) {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/interface/eoip/add', [
                `=name=${name}`,
                `=remote-address=${remoteAddress}`,
                `=tunnel-id=${tunnelId}`
            ]);
            console.log(`EoIP Tunnel ${name} created successfully`);

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikTunnelService > createEoipTunnel > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async setIpAddress(interfaceName: string, ipAddress: string, netmask: string) {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/ip/address/add', [
                `=interface=${interfaceName}`,
                `=address=${ipAddress}/${netmask}`
            ]);
            console.log(`IP Address ${ipAddress}/${netmask} set on interface ${interfaceName}`);

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' };

        } catch (error) {
            console.error(`mikrotik > services > mikrotikTunnelService > setIpAddress > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async createVxlanTunnel(name: string, vni: number, port: number) {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/interface/vxlan/add', [
                `=name=${name}`,
                `=vni=${vni}`,
                `=port=${port}`
            ]);
            console.log(`VXLAN Tunnel ${name} created successfully`);

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' };

        } catch (error) {
            console.error(`mikrotik > services > mikrotikTunnelService > createVxlanTunnel > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }


    private async addVtepToVxlan(vxlanName: string, remoteIp: string, port: string) {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/interface/vxlan/vteps/add', [
                `=interface=${vxlanName}`,
                `=remote-ip=${remoteIp}`,
                `=port=${port}`
            ]);
            console.log(`VTEP added to VXLAN ${vxlanName}`);
            
            return { data: response, status: 200, message: 'ran successfully' };

        } catch (error) {
            console.error(`mikrotik > services > mikrotikTunnelService > addVtepToVxlan > error: \n${error}`)
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }
}