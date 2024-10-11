import ip from 'ip'
import { promises as fs } from 'fs';
import { generateRandomIP, getRandomPort } from '../../../utils';
import { MikrotikService } from './mikrotik.service'
import { ResponseDto } from '../../../common/DTO';

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
            await this.disconnect();
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

            await this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }
        }
        catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > routerPingIp > error: \n${error}`)
            await this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async getSystemResource() {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/system/resource/print');

            await this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > getSystemResource > error: \n${error}`)
            await this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async getIdentity() {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/system/identity/print');

            await this.disconnect()

            return { data: response[0].name, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > getSystemResource > error: \n${error}`)
            await this.disconnect()
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
                    name: pool.name,
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
            await this.disconnect();
        }
    }

    public async createIpPool(poolName: string) {
        const validIp = await this.getValidIp()
        if (validIp.status != 200 || !validIp.data?.validIp)
            return { data: {}, status: validIp.status, message: validIp.message }

        const range = ip.cidrSubnet(`${validIp.data?.validIp!}/24`);
        const startIp = ip.toLong(range.firstAddress) + 1;
        const endIp = ip.toLong(range.lastAddress) - 1;
        const poolStart = ip.fromLong(startIp);
        const poolEnd = ip.fromLong(endIp)

        try {

            await this.connect();
            const result = await this.client.write('/ip/pool/add', [
                `=name=${poolName}`,
                `=ranges=${poolStart}-${poolEnd}`
            ]);

            return { data: { result, poolStart, poolEnd }, status: 200, message: "ran successfully" }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > createIpPool > error: \n${error}`);
            return { data: {}, status: 500, message: 'failed to run command' }
        } finally {
            await this.disconnect();
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
            await this.disconnect();
        }

    }

    public async createCertificate(input: { name: string, commonName: string, keySize: number, daysValid: number, keyUsage: string }) {
        try {
            const connection = await this.connect()
            if (connection.status != 200)
                return { data: '', status: connection.status, message: connection.message }

            const response = await this.client.write('/certificate/add', [
                `=name=${input.name}`,
                `=common-name=${input.commonName}`,
                `=key-size=${input.keySize}`,
                `=days-valid=${input.daysValid}`,
                `=key-usage=${input.keyUsage}`
            ]);
            console.log(`certificate created successfully`);

            await this.disconnect()

            return { data: response, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > createCertificate > error: \n${error}`)
            await this.disconnect()
            return { data: [], status: 500, message: 'failed to run command' }
        }
    }

    public async signCertificate(input: { certificateName: string, caName?: string, caHost?: string }) {
        try {
            const connection = await this.connect();
            if (connection.status !== 200)
                return { data: '', status: connection.status, message: connection.message };

            const certResponse = await this.client.write('/certificate/print', [
                `?name=${input.certificateName}`
            ]);

            if (!certResponse || certResponse.length === 0) {
                return { data: '', status: 404, message: `Certificate ${input.certificateName} not found` };
            }

            const certificateId = certResponse[0]['.id'];

            let signCommand;
            if (input.caName && input.caHost)
                signCommand = [
                    `=.id=${certificateId}`,
                    `=ca=${input.caName}`,
                    `=ca-crl-host= ${input.caHost}`
                ]
            else if (input.caName && !input.caHost)
                signCommand = [
                    `=.id=${certificateId}`,
                    `=ca=${input.caName}`
                ]
            else if (input.caHost && input.certificateName)
                signCommand = [
                    `=.id=${certificateId}`,
                    `=ca-crl-host= ${input.caHost}`
                ]
            else
                signCommand = [
                    `=.id=${certificateId}`,
                ]

            const response = await this.client.write('/certificate/sign', signCommand);

            return { data: response, status: 200, message: 'Certificate sign command issued successfully' };

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > signCertificate > error: \n${error}`);
            return { data: [], status: 500, message: 'Failed to run command' };
        } finally {
            await this.disconnect();
        }
    }


    public async trustCertificate(certificateName: string) {
        try {
            const connection = await this.connect();
            if (connection.status != 200) {
                return { data: '', status: connection.status, message: connection.message };
            }

            const certResponse = await this.client.write('/certificate/print', [
                `?name=${certificateName}`
            ]);

            if (!certResponse || certResponse.length === 0) {
                return { data: '', status: 404, message: `Certificate ${certificateName} not found` };
            }

            const certificateId = certResponse[0]['.id'];

            const response = await this.client.write('/certificate/set', [
                `=.id=${certificateId}`,
                `=trusted=yes`
            ]);

            console.log(`Certificate trusted successfully`);

            return { data: response, status: 200, message: 'Certificate trusted successfully' };

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > trustCertificate > error: \n${error}`);
            return { data: [], status: 500, message: 'Failed to trust the certificate' };
        } finally {
            await this.disconnect();
        }
    }

    public async getValidIp() {
        let isValid = false;
        let randomIp = '';
        let ipListIsValid, ipPoolIsValid
        try {
            const connection = await this.connect();
            if (connection.status !== 200)
                return { data: null, status: connection.status, message: connection.message };

            const ipAddressList = await this.getRouterIpAddresses()
            const poolIpList = await this.getIpPoolList()

            while (!isValid) {
                randomIp = generateRandomIP('A')
                ipListIsValid = ipAddressList.data.every((net: any) => net.network !== randomIp);
                ipPoolIsValid = poolIpList.data.every((net: any) => net.network !== randomIp)

                if (ipPoolIsValid && ipListIsValid)
                    isValid = true
            }

            return { data: { validIp: randomIp }, status: 200, message: 'ran successfully' }

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > getValidIp > error: \n${error}`);
            return { data: null, status: 500, message: 'failed to run command' }
        } finally {
            await this.disconnect();
        }
    }

    public async findUsablePort(): Promise<ResponseDto> {
        let port: number;
        let isUsable: boolean = false;

        try {
            const connection = await this.connect();
            if (connection.status !== 200)
                return { data: '', status: connection.status, message: connection.message };

            const serviceResponse = await this.client.write('/ip/service/print');
            const servicePorts = serviceResponse.map((service: any) => service['port']);

            const natResponse = await this.client.write('/ip/firewall/nat/print');
            const natPorts = natResponse.map((rule: any) => rule['dst-port']);

            const filterResponse = await this.client.write('/ip/firewall/filter/print');
            const filterPorts = filterResponse.map((rule: any) => rule['dst-port']);

            const allUsedPorts = [
                ...servicePorts,
                ...natPorts,
                ...filterPorts,
            ].filter(Boolean).map((p: string) => parseInt(p));

            do {
                port = getRandomPort();
                isUsable = !allUsedPorts.includes(port);
            } while (!isUsable);

            return { data: { port }, status: 200, message: 'Port found and is usable' };
        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > findUsablePort > error: \n${error}`);
            return { data: [], status: 500, message: 'Failed to find usable port' };
        } finally {
            await this.disconnect();
        }
    }

    async uploadFile(input: { localFilePath: string, remoteFileName: string }) {
        try {
            
            if (!fs || typeof fs.readFile !== 'function') {
                console.error(`mikrotik > services > mikrotikUtilsService > uploadFile > fs module is not properly imported or initialized`);
                return { data: null, status: 500, message: 'fs module is not properly imported or initialized' };
            }
    
            if (!input.localFilePath) {
                console.error(`mikrotik > services > mikrotikUtilsService > uploadFile > localFilePath is undefined or empty`);
                return { data: null, status: 500, message: 'localFilePath is undefined or empty' };
            }
    
            const fileContent = await fs.readFile(input.localFilePath, { encoding: 'utf8' });
            
            if (!this.client || typeof this.client.write !== 'function') {
                console.error(`mikrotik > services > mikrotikUtilsService > uploadFile > client is not properly initialized`);
                return { data: null, status: 500, message: 'client is not properly initialized' };
            }

            const connection = await this.connect();
            if (connection.status !== 200)
                return { data: null, status: connection.status, message: connection.message };
    
            const response = await this.client.write('/file/add', [`=contents=${fileContent}`, `=name=${input.remoteFileName}`]);
            
            return { data: response, status: 200, message: 'file uploaded successfully' };
        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > uploadFile > error: \n${error}`);
            return { data: null, status: 500, message: `failed to upload file: ${error}` };
        } finally{
            await this.disconnect()
        }
    }
    
    async importCertificate(remoteFileName: string, passphrase?: string) {
        try {
            const connection = await this.connect();
            if (connection.status !== 200)
                return { data: '', status: connection.status, message: connection.message };

            const importCommand = passphrase ? [
                `=file-name=${remoteFileName}`,
                `=trusted=yes`,
                `=passphrase=${passphrase}`
            ] : [
                `=file-name=${remoteFileName}`,
                `=trusted=yes`
            ];
            const response = await this.client.write('/certificate/import', importCommand);

            console.log(`Certificate imported: ${remoteFileName}`);
            return { data: response, status: 200, message: 'certificate imported' };

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > importCertificate > error: \n${error}`)
            return { data: null, status: 500, message: 'failed to import certificate' }

        } finally {
            await this.disconnect()
        }
    }

    async removeCertificate(remoteFileName: string) {
        try {
            const connection = await this.connect();
            if (connection.status !== 200)
                return { data: '', status: connection.status, message: connection.message };

            const response = await this.client.write('/certificate/import',[
                `${remoteFileName}`,
            ]);

            console.log(`Certificate removed: ${remoteFileName}`);
            return { data: response, status: 200, message: 'certificate removed' };

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > removeCertificate > error: \n${error}`)
            return { data: null, status: 500, message: 'failed to remove certificate' }

        } finally {
            await this.disconnect()
        }
    }

    async removeFile(remoteFileName: string) {
        try {
            const connection = await this.connect();
            if (connection.status !== 200)
                return { data: '', status: connection.status, message: connection.message };

            const response = await this.client.write('/file/remove', [`${remoteFileName}`]);
            console.log(`File removed: ${remoteFileName}`);
            return { data: response, status: 200, message: 'file was removed successfully' };

        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > removeFile > error: \n${error}`)
            return { data: null, status: 500, message: 'failed to delete file' }
        } finally {
            await this.disconnect()
        }
    }
}