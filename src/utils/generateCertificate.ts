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
        writeFileSync(`${certsDir}/ca_config.cnf`, createOpenSslConfig('ca'));
        writeFileSync(`${certsDir}/server_config.cnf`, createOpenSslConfig('server'));
        writeFileSync(`${certsDir}/client_config.cnf`, createOpenSslConfig('client'));

        // 1. Generate CA Key and Certificate
        await execAsync(`openssl genrsa -out ${routerDir}/${input.caName}-key.pem 4096`);
        await execAsync(`openssl req -x509 -new -nodes -key ${routerDir}/${input.caName}-key.pem -sha256 -days 3650 -out ${routerDir}/${input.caName}-cert.pem -config ${certsDir}/ca_config.cnf`);

        // 2. Generate Server Key and CSR, then sign with CA
        await execAsync(`openssl genrsa -out ${certsDir}/${input.serverName}-key.pem 4096`);
        await execAsync(`openssl req -new -key ${certsDir}/${input.serverName}-key.pem -out ${certsDir}/server.csr -config ${certsDir}/server_config.cnf`);
        await execAsync(`openssl x509 -req -in ${certsDir}/server.csr -CA ${routerDir}/${input.caName}-cert.pem -CAkey ${routerDir}/${input.caName}-key.pem -CAcreateserial -out ${certsDir}/${input.serverName}-cert.pem -days 3650 -sha256 -extfile ${certsDir}/server_config.cnf -extensions v3_server`);

        // 3. Generate Client Key and CSR, then sign with CA
        await execAsync(`openssl genrsa -out ${certsDir}/${input.clientName}-key.pem 4096`);
        await execAsync(`openssl req -new -key ${certsDir}/${input.clientName}-key.pem -out ${certsDir}/client.csr -config ${certsDir}/client_config.cnf`);
        await execAsync(`openssl x509 -req -in ${certsDir}/client.csr -CA ${routerDir}/${input.caName}-cert.pem -CAkey ${routerDir}/${input.caName}-key.pem -CAcreateserial -out ${certsDir}/${input.clientName}-cert.pem -days 3650 -sha256 -extfile ${certsDir}/client_config.cnf -extensions v3_client`);

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