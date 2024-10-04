import { generateRandomIP, getRandomPort } from '../../../utils';
import { MikrotikService } from './mikrotik.service'
import ip from 'ip'
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

    public async signCertificate(input: { certificateName: string, caName?: string }) {
        try {
            const connection = await this.connect();
            if (connection.status !== 200) {
                return { data: '', status: connection.status, message: connection.message };
            }
            const certResponse = await this.client.write('/certificate/print', [
                `?name=${input.certificateName}`
            ]);

            if (!certResponse || certResponse.length === 0) {
                return { data: '', status: 404, message: `Certificate ${input.certificateName} not found` };
            }

            const certificateId = certResponse[0]['.id'];

            const signCommand = input.caName ? [
                `=.id=${certificateId}`,
                `=ca=${input.caName}`
            ] : [
                `=.id=${certificateId}`
            ];

            const response = await this.client.write('/certificate/sign', signCommand);

            console.log(`Certificate signing in progress...`);

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
            const ipAddressList = await this.getRouterIpAddresses()
            const poolIpList = await this.getIpPoolList()

            while (!isValid) {
                randomIp = generateRandomIP()
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
            await this.connect();

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
            // Disconnect from the MikroTik router
            await this.disconnect();
        }
    }

    public async getCaCertificate(caCertName: string) {
        try {
            await this.connect();

            // Export the CA certificate
            const response = await this.client.write('/certificate/export-certificate', [
                `${caCertName}`,
                '=export-passphrase=""'
            ]);

            // Get the exported file name from the response
            console.log('Exported CA certificate response:', response);

            // Assuming the response contains the exported file name, you'll need to read that file to get its content
            // const exportedCaCert = await this.client.write('/file/print', [
            //     '?name=' + response.fileName // Adjust if necessary to retrieve the exported cert
            // ]);

            // const caCert = exportedCaCert[0].contents; // Extract certificate content

            return {
                data: {
                    certificate: '',
                },
                status: 200,
                message: 'CA Certificate retrieved successfully'
            };
        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > getCaCertificate > error: \n${error}`);
            return { data: {}, status: 500, message: 'Failed to retrieve CA certificate' };
        } finally {
            await this.disconnect();
        }
    }

    public async getClientCertAndKey(clientCertName: string) {
        try {
            await this.connect();

            // Export the client certificate and private key
            const response = await this.client.write('/certificate/export', [
                `${clientCertName}`,
                '=export-passphrase="123456789"' // Optional: Passphrase can be used to secure the key
            ]);

            console.log('Exported client certificate response:', response);

            // Retrieve the exported certificate and key content from the file
            // const exportedClientCert = await this.client.write('/file/print', [
            //     '?name=' + response.fileName // Adjust if necessary to get file content
            // ]);

            // const clientCert = exportedClientCert[0].contents; // Get certificate content

            return {
                data: {
                    certificate: '', // Full PEM certificate
                    privateKey: '', // Ensure you export this key, too
                },
                status: 200,
                message: 'Client Certificate and Key retrieved successfully'
            };
        } catch (error) {
            console.error(`mikrotik > services > mikrotikUtilsService > getClientCertAndKey > error: \n${error}`);
            return { data: {}, status: 500, message: 'Failed to retrieve Client certificate and key' };
        } finally {
            await this.disconnect();
        }
    }

}