import { MikrotikService } from './mikrotik.service'
import ip from 'ip'

export class MikrotikUtilService extends MikrotikService {

    public async getRouterIpAddresses() {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: [], status: connection.status, message: connection.message }

            const response = await this.client.write('/ip/address/print');
            return { data: response, status: 200, message: 'ran successfully' }
        }
        catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > getRouterIpAddresses > error: \n${error}`)
            return { data: [], status: 500, message: 'failed to run command' }
        } finally {
            this.disconnect();
        }
    }

    public async routerPingIp(address: string, count: number = 4) {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/ping', [
                `=address=${address}`,
                `=count=${count}`
            ]);

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }
        }
        catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > routerPingIp > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async getSystemResource() {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/system/resource/print');

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > getSystemResource > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async getIdentity() {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/system/identity/print');

            this.disconnect()

            return { data: response[0].name, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > getSystemResource > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async getIpPoolList() {
        try {
            const connection = await this.connect();
            if (connection.status !== 200)
                return { data: [], status: connection.status, message: connection.message };
    
            const response = await this.client.write('/ip/pool/print');
    
            const processedPools = response.map((pool: any) => {
                const range = pool.ranges; 
                const [startIp, endIp] = range.split('-');
    
                const networkData = ip.cidrSubnet(`${startIp}/24`); 
                const network = networkData.networkAddress;
                const subnet = networkData.subnetMaskLength;
    
                return {
                    startIp,
                    endIp,
                    network,
                    subnet,
                };
            });
    
            return { data: processedPools, status: 200, message: 'ran successfully' };
        }
        catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > getIpPoolList > error: \n${error}`);
            return { data: [], status: 500, message: 'failed to run command' };
        } finally {
            this.disconnect(); 
        }
    }

    public async createIpPool(ipWithSubnet: string, poolName: string) {

        const range = ip.cidrSubnet(ipWithSubnet);
        const startIp = ip.toLong(range.firstAddress) + 1;
        const endIp = ip.toLong(range.lastAddress) - 1;
        const poolStart = ip.fromLong(startIp);
        const poolEnd = ip.fromLong(endIp)
        
        try {
            
            const ipIsValid = await this.checkIpValidation(`${ip.toLong(range.firstAddress)}`)

            if(!ipIsValid.data)
                return { data: [], status: 204, message: 'selected ip is not valid!' }

            await this.connect();
            const result = await this.client.write('/ip/pool/add', [
                `=name=${poolName}`,
                `=ranges=${poolStart}-${poolEnd}`
            ]);

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > createIpPool > error: \n${error}`);
            return { data: [], status: 500, message: 'failed to run command' }
        } finally {
            this.disconnect();
        }

    }

    public async getCertificates() { 

        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: [], status: connection.status, message: connection.message }

            const response = await this.client.write('/certificate/print');
            return { data: response, status: 200, message: 'ran successfully' }
        }
        catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > getCertificates > error: \n${error}`)
            return { data: [], status: 500, message: 'failed to run command' }
        } finally {
            this.disconnect();
        }
        
    }
    
    public async createCertificate(name: string, commonName: string, keySize: number, daysValid:number, keyUsage:string) { 
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/certificate/add ', [
                `=name=${name}`,
                `=common-name=${commonName}`,
                `=key-size=${keySize}`,
                `=days-valid=${daysValid}`,
                `=key-usage=${keyUsage}`
            ]);
            console.log(`certificate created successfully`);

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > createCertificate > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async signCertificate(certificateName: string, caName:string) { 
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/certificate/sign ', [
                `${certificateName}`,
                `=ca=${caName}`
            ]);
            console.log(`certificate signed successfully`);

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > signCertificate > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }
    
    public async trustCertificate(certificateName: string) { 
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/certificate/set ', [
                `${certificateName}`,
                `=trusted=yes`
            ]);
            console.log(`certificate signed successfully`);

            this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > signCertificate > error: \n${error}`)
            this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }
    
    public async checkIpValidation(ipAddress: string) {
        let isValid = false;

        try {
            const ipAddressList = await this.getRouterIpAddresses()
            const poolIpList = await this.getIpPoolList()

            const ipListIsValid = ipAddressList.data.every((net: any) => net.network !== ipAddress);
            const ipPoolIsValid = poolIpList.data.every((net: any) => net.network !== ipAddress)

            if (ipPoolIsValid && ipListIsValid)
                isValid = true

            return { data: { isValid }, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > checkIpValidation > error: \n${error}`);
            return { data: null, status: 500, message: 'failed to run command' }
        } finally {
            this.disconnect();
        }
    }

}