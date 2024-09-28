import { ResponseDto } from "../../../common/DTO";
import { MikrotikService } from "./mikrotik.service";

export class MikrotikTunnelService extends MikrotikService {
    public async createGreTunnel(remoteAddress: string, name: string): Promise<ResponseDto> {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/interface/gre/add', [
                `=name=gre_tunnel_to_${name}_api`,
                `=remote-address=${remoteAddress}`
            ]);

            console.log(`GRE Tunnel gre_tunnel_to_${name}_api created successfully`, response);

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikTunnelService > createGreTunnel > error: \n${error}`)

            this.disconnect()

            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async createEoipTunnel(remoteAddress: string, name: string, tunnelId: number) {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/interface/eoip/add', [
                `=name=eoip_tunnel_to_${name}_api`,
                `=remote-address=${remoteAddress}`,
                `=tunnel-id=${tunnelId}`
            ]);
            console.log(`EoIP Tunnel eoip_tunnel_to_${name}_api created successfully`);

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

    public async createVxlanTunnel(name: string, port: number, vni: number) {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/interface/vxlan/add', [
                `=name=vxlan_tunnel_to_${name}_api`,
                `=vni=${vni}`,
                `=port=${port}`
            ]);
            console.log(`VXLAN Tunnel vxlan_tunnel_to_${name}_api created successfully`);

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' };

        } catch (error) {
            console.error(`mikrotik > services > mikrotikTunnelService > createVxlanTunnel > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }


    public async addVtepToVxlan(remoteIp: string, vxlanName: string,  port: number) {
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
            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' };

        } catch (error) {
            console.error(`mikrotik > services > mikrotikTunnelService > addVtepToVxlan > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }
}