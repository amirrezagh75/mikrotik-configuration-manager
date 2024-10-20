import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
const execAsync = promisify(exec);

const createOpenSslConfig = (type: string) => {
    let config = `
[ req ]
distinguished_name = req_distinguished_name
x509_extensions = v3_${type}
prompt = no
[ req_distinguished_name ]
CN = ${type.charAt(0).toUpperCase() + type.slice(1)}
[ v3_${type} ]
`;

    switch (type) {
        case 'ca':
            config += `
keyUsage = critical, keyCertSign, cRLSign
basicConstraints = critical, CA:true
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
`;
            break;
        case 'server':
            config += `
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
basicConstraints = critical, CA:false
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
`;
            break;
        case 'client':
            config += `
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth
basicConstraints = critical, CA:false
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
`;
            break;
    }

    return config;
};

export const generateCertificates = async (input: {
    caName: string,
    serverName: string,
    clientName: string,
    routerName: string,
}) => {
    try {
        const certsDir = 'certs';
        const routerDir = `${certsDir}/${input.routerName}`
        if (!existsSync(certsDir)) {
            mkdirSync(certsDir);
            console.log(`'${certsDir}' directory created.`);
        }
        if (!existsSync(routerDir)) {
            mkdirSync(routerDir);
            console.log(`'${routerDir}' directory created.`);
        }

        // Create OpenSSL config files
        writeFileSync(`${routerDir}/ca_config.cnf`, createOpenSslConfig('ca'));
        writeFileSync(`${routerDir}/server_config.cnf`, createOpenSslConfig('server'));
        writeFileSync(`${routerDir}/client_config.cnf`, createOpenSslConfig('client'));

        // 1. Generate CA Key and Certificate
        await execAsync(`openssl genrsa -out ${routerDir}/${input.caName}-key.pem 4096`);
        await execAsync(`openssl req -x509 -new -nodes -key ${routerDir}/${input.caName}-key.pem -sha256 -days 3650 -out ${routerDir}/${input.caName}-cert.pem -config ${routerDir}/ca_config.cnf`);

        // 2. Generate Server Key and CSR, then sign with CA
        await execAsync(`openssl genrsa -out ${routerDir}/${input.serverName}-key.pem 4096`);
        await execAsync(`openssl req -new -key ${routerDir}/${input.serverName}-key.pem -out ${routerDir}/server.csr -config ${routerDir}/server_config.cnf`);
        await execAsync(`openssl x509 -req -in ${routerDir}/server.csr -CA ${routerDir}/${input.caName}-cert.pem -CAkey ${routerDir}/${input.caName}-key.pem -CAcreateserial -out ${routerDir}/${input.serverName}-cert.pem -days 3650 -sha256 -extfile ${routerDir}/server_config.cnf -extensions v3_server`);

        // 3. Generate Client Key and CSR, then sign with CA
        await execAsync(`openssl genrsa -out ${routerDir}/${input.clientName}-key.pem 4096`);
        await execAsync(`openssl req -new -key ${routerDir}/${input.clientName}-key.pem -out ${routerDir}/client.csr -config ${routerDir}/client_config.cnf`);
        await execAsync(`openssl x509 -req -in ${routerDir}/client.csr -CA ${routerDir}/${input.caName}-cert.pem -CAkey ${routerDir}/${input.caName}-key.pem -CAcreateserial -out ${routerDir}/${input.clientName}-cert.pem -days 3650 -sha256 -extfile ${routerDir}/client_config.cnf -extensions v3_client`);

        console.log('Certificates generated successfully');

        return {
            data: {
                caKey: `${input.caName}-key.pem`,
                caCert: `${input.caName}-cert.pem`,
                serverKey: `${input.serverName}-key.pem`,
                serverCert: `${input.serverName}-cert.pem`,
                clientKey: `${input.clientName}-key.pem`,
                clientCert: `${input.clientName}-cert.pem`
            },
            status: 200,
            message: 'Certificates generated successfully!'
        };
    } catch (error) {
        console.error(`utils > generateCertificate > error:\n ${error}`);
        return { data: {}, status: 504, message: `Something went wrong while creating certificates` };
    }
};