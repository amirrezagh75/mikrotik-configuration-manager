import z from 'zod'
import { domainRegex, ipv4Regex } from '../../../utils';


const portRange = { min: 1, max: 65535 };


export const GetClusterValueSchema = z.object({
    username: z.string(),
    password: z.string(),
    address: z.string().refine(
        (data) => ipv4Regex.test(data) || domainRegex.test(data), {
        message: "Invalid IP address or domain format.",
        path: ['address'],
    }
    ),
    port: z.number().min(portRange.min, { message: `Port must be at least ${portRange.min}` })
        .max(portRange.max, { message: `Port must be less than or equal to ${portRange.max}` })
});

export type IGetClusterValue = z.infer<typeof GetClusterValueSchema>;