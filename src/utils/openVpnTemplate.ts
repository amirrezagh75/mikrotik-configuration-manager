export const openVpnTemplate = (input: {serverAddress: string, caCert: string, clientCert: string, clientKey: string}) => {
    return `
client
dev tun
proto tcp
remote ${input.serverAddress}
redirect-gateway def1
resolv-retry infinite
nobind
persist-key
persist-tun
cipher AES-128-CBC
verb 3
mute 20
auth SHA1
tls-client

<ca>
${input.caCert}
</ca>

<cert>
${input.clientCert}
</cert>

<key>
${input.clientKey}
</key>

key-direction 1
remote-cert-tls server
auth-user-pass`;
};