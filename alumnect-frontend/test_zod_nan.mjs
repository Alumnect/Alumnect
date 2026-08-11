import { z } from 'zod';

const schema = z.object({
  salaryMin: z.number().optional(),
});

console.log("Empty string parsed as NaN:", schema.safeParse({ salaryMin: NaN }));
