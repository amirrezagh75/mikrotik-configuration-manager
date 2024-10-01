import { MikrotikService } from './mikrotik.service'

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
            this.disconnect(); // Ensure to close the connection
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

    // Fetch system resource information
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
}