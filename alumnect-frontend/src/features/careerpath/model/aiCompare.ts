import { z } from 'zod'

/**
 * Schema Zod cho kết quả AI đối chiếu lộ trình 1-chạm [C2] — khớp `CareerAiCompareResponse` phía Backend.
 * Mọi trường danh sách/chuỗi có giá trị mặc định để giao diện không bao giờ vỡ khi thiếu dữ liệu.
 */
const stringList = z.array(z.string()).catch([])

export const ladderStepSchema = z.object({
  period: z.string().default(''),
  title: z.string().default(''),
  company: z.string().default(''),
  takeawayVi: z.string().default(''),
})
export type LadderStep = z.infer<typeof ladderStepSchema>

export const personCardSchema = z.object({
  userId: z.number().nullable().catch(null),
  name: z.string().default(''),
  avatarUrl: z.string().nullable().catch(null),
  headline: z.string().nullable().catch(null),
  currentRole: z.string().nullable().catch(null),
  company: z.string().nullable().catch(null),
  majorName: z.string().nullable().catch(null),
  cohort: z.number().nullable().catch(null),
  relationshipType: z.string().nullable().catch(null),
  yearsSinceFirstJob: z.number().nullable().catch(null),
  companyCount: z.number().default(0),
  skills: stringList,
})
export type PersonCard = z.infer<typeof personCardSchema>

export const careerAiCompareSchema = z.object({
  targetPerson: personCardSchema,
  viewerPerson: personCardSchema,
  comparisonSummaryVi: z.string().default(''),
  historicalLadder: z.array(ladderStepSchema).catch([]),
  viewerLadder: z.array(ladderStepSchema).catch([]),
  sharedStrengths: stringList,
  keyGapsToBridge: stringList,
  transferableSkills: stringList,
  actionableAdviceVi: z.string().default(''),
  viewerHasExperience: z.boolean().default(false),
  source: z.string().default('LOCAL_FALLBACK'),
})
export type CareerAiCompare = z.infer<typeof careerAiCompareSchema>

export type RelationshipType = 'EXECUTIVE_LEADER' | 'PEER_OR_SENIOR' | 'CROSS_INDUSTRY'
