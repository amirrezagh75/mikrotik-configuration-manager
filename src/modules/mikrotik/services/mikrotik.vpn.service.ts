import { MikrotikService } from "./mikrotik.service";

export class MikrotikVpnService extends MikrotikService {

    public async OpenvpnConfig(input:{port:number, profileName:string, certificateName: string}) {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/interface/ovpn-server/server/set', [
                `=enabled=yes`,
                `=port=${input.port}`,
                `=default-profile=${input.profileName}`,
                `=certificate=${input.certificateName}`,
                `=cipher=blowfish128,aes128-cbc,aes192-cbc,aes256-cbc`,
                `=auth=sha1,md5`,
                `=redirect-gateway=def1`
            ]);
            console.log(`open vpn configured successfully`)      
             return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > OpenvpnConfig > error: \n${error}`)
            await this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        } finally{
            await this.disconnect()
        }
    }

    public async listOfProfiles() { 
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: [], status: connection.status, message: connection.message }

            const response = await this.client.write('/ppp/profile/print');
            return { data: response, status: 200, message: 'ran successfully' }
        }
        catch (error) {
            console.error(`mikrotik > services > mikrotikVpnService > listOfProfiles > error: \n${error}`)
            return { data: [], status: 500, message: 'failed to run command' }
        } finally {
            await this.disconnect();
        }
    }

    public async createNewProfile(input:{name:string , localAddress: string, poolName: string, dnsServer:string}) { 
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/ppp/profile/add', [
                `=name=${input.name}`,
                `=local-address=${input.localAddress}`,
                `=remote-address=${input.poolName}`,
                `=change-tcp-mss=yes`
            ]);
            console.log(`new profile created successfully`);

            await this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > createNewProfile > error: \n${error}`)
            await this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async createNewSecrete(input:{username:string, password: string, profile?:string }){ 
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/ppp/secret/add ', [
                `=name=${input.username}`,
                `=password=${input.password}`,
                `=profile=${input?.profile ?? 'default'}`
            ]);
            console.log(`new secrete created successfully`);

            await this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > createNewSecrete > error: \n${error}`)
            await this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async listOfSecretes(){ 
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: [], status: connection.status, message: connection.message }

            const response = await this.client.write('ppp/secret/print ');
            return { data: response, status: 200, message: 'ran successfully' }
        }
        catch (error) {
            console.error(`mikrotik > services > mikrotikVpnService > listOfSecretes > error: \n${error}`)
            return { data: [], status: 500, message: 'failed to run command' }
        } finally {
            await this.disconnect();
        }
    }
}