import z from 'zod'
import { domainRegex, ipv4Regex } from '../../../utils';


const portRange = { min: 1, max: 65535 };


export const CreateMachineSchema = z.object({
    username: z.string(),
    password: z.string(),
    address: z.string().refine(
        (data) => ipv4Regex.test(data) || domainRegex.test(data), {
        message: "Invalid IP address or domain format.",
        path: ['address'],
    }
    ),
    port: z.optional(z.number().min(portRange.min, { message: `Port must be at least ${portRange.min}` })
        .max(portRange.max, { message: `Port must be less than or equal to ${portRange.max}` })),

    name: z.string(),
    storage: z.number(),
    ram: z.number(),
    cpu: z.number(),
    os: z.string(),
    copy: z.number(),
    clusterId: z.string(),
    vmxVersion: z.string()
});

export type ICreateMachine = z.infer<typeof CreateMachineSchema>;