import fs from 'fs';
import path from 'path';

export const generateOpenVPNConfig = (input: { 
    caCertPath: string, 
    clientCertPath: string, 
    clientKeyPath: string, 
    remoteIp: string,
    remotePort: number 
}) => {
    try {
        // Read file contents
        const caCert = fs.readFileSync(path.resolve(input.caCertPath), 'utf8').trim();
        const clientCert = fs.readFileSync(path.resolve(input.clientCertPath), 'utf8').trim();
        const clientKey = fs.readFileSync(path.resolve(input.clientKeyPath), 'utf8').trim();

        // OpenVPN configuration template
        let config = `
        client
dev tun
remote ${input.remoteIp} ${input.remotePort} tcp
route ${input.remoteIp} 255.255.255.255 net_gateway
redirect-gateway def1
tun-mtu 1500
tls-client
nobind
user nobody
group nogroup
ping 15
ping-restart 45
persist-tun
persist-key
mute-replay-warnings
verb 3
cipher AES-256-CBC
auth SHA1
pull
auth-user-pass
connect-retry 1
reneg-sec 3600
remote-cert-tls server
<ca>
${caCert}
</ca>
<cert>
${clientCert}
</cert>
<key>
${clientKey}
</key>
        `;

        // Clean up any extra spaces or newlines for a clean output
        config = config.replace(/\n{2,}/g, '\n').trim();

        return { 
            data: config, 
            status: 200, 
            message: 'OpenVPN configuration generated successfully!' 
        };
    } catch (error) {
        return { 
            data: '', 
            status: 500, 
            message: `Failed to generate OpenVPN config: ${error}` 
        };
    }
};
