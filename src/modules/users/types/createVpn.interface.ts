import z from 'zod'
import { domainRegex, ipv4Regex } from '../../../utils';


const vpnTypes = ["openVpn", "l2tp", "ppp", "pptp"] as const;
const portRange = { min: 1, max: 65535 };

const IpSchema = z.object({
    address: z.string().refine(
        (data) => ipv4Regex.test(data) || domainRegex.test(data), {
        message: "Invalid IP address or domain format.",
        path: ['address'],
    }
    ),
    port: z.number().min(portRange.min, { message: `Port must be at least ${portRange.min}` })
        .max(portRange.max, { message: `Port must be less than or equal to ${portRange.max}` })
});

const RouterSchema = z.object({
    local: IpSchema.optional(),
    public: IpSchema.optional(),
});

const CredentialSchema = z.object({
    username: z.string(),
    password: z.string()
})

export const CreateVpnSchema = z.object({
    vpnType: z.enum(vpnTypes),
    router: RouterSchema,
    credential: CredentialSchema
});

export type CreateVpnInterface = z.infer<typeof CreateVpnSchema>;