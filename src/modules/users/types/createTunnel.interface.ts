import z from 'zod'
import { domainRegex, ipv4Regex } from '../../../utils';

const tunnelTypes = ["vxlan", "gre", "eoip", "ipip"] as const;

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
    username: z.string(),
    password: z.string(),
});

export const CreateTunnelSchema = z.object({
    tunnelType: z.enum(tunnelTypes),
    source: RouterSchema,
    destination: RouterSchema,
});

export type CreateTunnelInterface = z.infer<typeof CreateTunnelSchema>;