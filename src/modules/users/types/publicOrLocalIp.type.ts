import { MikrotikTunnelService, MikrotikUtilService } from "../../mikrotik/services";

export interface PublicOrLocalIp {
    mkUtilServiceSource: MikrotikUtilService | undefined;
    mkTunnelServiceSource:MikrotikTunnelService | undefined;
    mkUtilServiceDestination:MikrotikUtilService | undefined;
    mkTunnelServiceDestination: MikrotikTunnelService | undefined;
}