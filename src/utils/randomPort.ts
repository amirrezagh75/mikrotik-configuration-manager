export const getRandomPort = (): number => {
    const minPort = 1024;
    const maxPort = 65535;
    return Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
}