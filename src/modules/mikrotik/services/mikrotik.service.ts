import { RouterOSAPI } from 'node-routeros';
import { ResponseDto } from '../../../common/DTO';

export class MikrotikService {
    protected client: RouterOSAPI;

    constructor(host: string, port: number, user: string, password: string) {
        this.client = new RouterOSAPI({
            host,
            user,
            password,
            port,
            timeout: 5000
        });
    }

    protected async connect(): Promise<ResponseDto> {
        try {
            await this.client.connect();
            return { data: [], status: 200, message: 'connected successfully' };
        } catch (error) {
            console.error('Failed to connect to MikroTik:', error);
            return { data: [], status: 500, message: 'connection failed' };
        }
    }

    protected disconnect(): void {
        this.client.close();
    }

    public async validateConnection(): Promise<ResponseDto> {
        try {
            const connection = await this.connect(); // Attempt to connect
            if (connection.status === 200) {
                console.log('Connection validated successfully');
                return { data: [], status: 200, message: 'Validation successful, credentials are correct' };
            }
            return connection; // If connection fails, return the failure message
        } catch (error) {
            console.error('Failed to validate connection:', error);
            return { data: [], status: 500, message: 'Unable to validate connection' };
        } finally {
            this.disconnect(); // Ensure to close the connection
        }
    }
}