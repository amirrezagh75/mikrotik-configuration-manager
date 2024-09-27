class TunnelDto {
    constructor(routerIp, tunnelType, name, localIp, remoteIp) {
        this.routerIp = routerIp;
        this.tunnelType = tunnelType;
        this.name = name;
        this.localIp = localIp;
        this.remoteIp = remoteIp;
    }
}

module.exports = TunnelDto;