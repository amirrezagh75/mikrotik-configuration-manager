import { z } from 'zod';
import { domainRegex, ipv4Regex } from '../../../utils';

export const RequestInputSchema = z.object({
  username: z.string(),
  password: z.string(),
  port: z.number(),
  address: z.string(),
}).refine(data => ipv4Regex.test(data.address) || domainRegex.test(data.address), {
  message: "Invalid IP address format.",
  path: ['address'], // Specify the path for the error message
});

export type RequestInterface = z.infer<typeof RequestInputSchema>;
