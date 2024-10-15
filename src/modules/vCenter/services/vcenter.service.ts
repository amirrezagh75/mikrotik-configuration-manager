import axios from "axios"
import { ResponseDto } from "../../../common/DTO"

export class VcenterServices {

    private address: string
    private port: number
    private username: string
    private password: string

    constructor(input: {
        address: string,
        port?: number,
        username: string,
        password: string
    }) {
        this.address = input.address
        this.port = input.port || 80
        this.username = input.username
        this.password = input.password
    }

    private async authenticate(): Promise<ResponseDto> {
        const url = `${this.address}:${this.port}/rest/com/vmware/cis/session`
        try {

            const response = await axios.post(url, {}, {
                auth: {
                    username: this.username,
                    password: this.password
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const sessionId = response.data.value;

            return { data: sessionId, status: 200, message: "" }

        } catch (error) {
            console.error('Authentication failed:', error);
            return { data: "", status: 504, message: "sorry, something went wrong. please try again later" }
        }
    }

    private async vCenterHeader(){
        const sessionData = await this.authenticate()
        if(sessionData.status != 200 || !sessionData.data)
            return {}
        
        return {
            headers: {
              'Content-Type': 'application/json',
              'vmware-api-session-id': sessionData.data
            }
          }
    } 

    public async getClusterValue(): Promise<ResponseDto> {
        const clustersUrl = `${this.address}:${this.port}/rest/vcenter/cluster`;
        
        const header = await this.vCenterHeader()
        if(!header)
            return { data:{}, status: 504, message:"couldn't get header data, please try again later" }
        
        try {

          const response = (await axios.get(clustersUrl, header)).data
          return { data: response, status: 200, message:"" }

        } catch (error) {

          console.error(`VcenterService > getClusterValue > error:\n${error}`);
          return { data:{}, status: 504, message:"something went wrong. please try again later" }

        }
      }

      public async createMachine(input: {
        name: string,
        storage: number,
        ram: number,
        cpu: number,
        os: string,
        copy: number, 
        clusterId: string,
        vmxVersion: string
    }): Promise<ResponseDto> {
        const url = `${this.address}:${this.port}/rest/vcenter/vm`;
        const sessionRes = await this.authenticate();
        
        if (sessionRes.status != 200)
            return { data: {}, status: sessionRes.status, message: sessionRes.message };
    
        const header = await this.vCenterHeader();
        if (!header)
            return { data: {}, status: 504, message: "couldn't get header data, please try again later" };
    
        const results = [];
        let successCount = 0;
        let failureCount = 0;
    
        for (let i = 1; i <= input.copy; i++) {
            const machineName = `${input.name}-${i}`;
            const body = {
                name: machineName,
                guest_OS: input.os,
                placement: {
                    cluster: input.clusterId
                },
                hardware: {
                    version: input.vmxVersion,
                    cpu: {
                        count: input.cpu
                    },
                    memory: {
                        size_MiB: input.ram
                    },
                    disks: [
                        {
                            new_vmdk: {
                                capacity: input.storage * 1024 * 1024 * 1024
                            }
                        }
                    ]
                }
            };
    
            try {
                // Attempt to create each VM
                const result = (await axios.post(url, body, header)).data;
                results.push({ name: machineName, result, status: 'success' });
                successCount++;
            } catch (error) {
                console.error(`VcenterService > createMachine > error while creating ${machineName}:\n${error}`);
                results.push({ name: machineName, error, status: 'failure' });
                failureCount++;
            }
        }
    
        const message = `${successCount} machine(s) created successfully. ${failureCount} machine(s) failed.`;
        const status = failureCount > 0 ? 207 : 200; 
    
        return { data: results, status, message };
    }
}