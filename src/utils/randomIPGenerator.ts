type IPClass = 'A' | 'B' | 'C';

export const generateRandomIP= (ipClass: IPClass = 'A'): string => {
    let firstOctet: number;

    switch (ipClass) {
        case 'A':
            // Class A: 1.0.0.0 to 126.255.255.255
            firstOctet = Math.floor(Math.random() * 126) + 1;
            break;
        case 'B':
            // Class B: 128.0.0.0 to 191.255.255.255
            firstOctet = Math.floor(Math.random() * (191 - 128 + 1)) + 128;
            break;
        case 'C':
            // Class C: 192.0.0.0 to 223.255.255.255
            firstOctet = Math.floor(Math.random() * (223 - 192 + 1)) + 192;
            break;
        default:
            throw new Error('Invalid IP class. Only A, B, or C are supported.');
    }
    const secondOctet = Math.floor(Math.random() * 256);
    const thirdOctet = Math.floor(Math.random() * 256);
    const fourthOctet = 0;

    return `${firstOctet}.${secondOctet}.${thirdOctet}.${fourthOctet}`;
}