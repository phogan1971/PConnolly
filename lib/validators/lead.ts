import { z } from "zod";
import { LeadType } from "@prisma/client";

export const leadInputSchema = z.object({
  vehicleId: z.string().optional(),
  customerName: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Invalid email").max(200).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  leadType: z.nativeEnum(LeadType).default(LeadType.ENQUIRY),
  consentMarketing: z.coerce.boolean().default(false),
  // honeypot — bots fill this; real users won't
  website: z.string().max(0).optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
