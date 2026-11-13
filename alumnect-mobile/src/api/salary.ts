import http from '@/lib/http'

export interface Industry { id: number; name: string }

export interface SalaryContribution {
  id: string
  industryId: number | null
  industry: string
  jobTitle: string
  company: string
  region: string
  locationCity?: string
  yearsExperience?: number | null
  grossAmount: number
  currency: string
  createdAt: string
}

export interface SalaryStatRow { role: string; level: string; region: string; median: number; p25: number; p75: number; samples: number }
export interface SalaryStatistics { totalContributions: number; trackedPositions: number; overallMedian: number | null; rows: SalaryStatRow[] }

export interface SalaryInput {
  industryId: number | null
  jobTitle: string
  company?: string
  region?: string
  locationCity?: string
  yearsExperience: number | null
  grossAmount: number
}

type Raw = Record<string, any>
const unwrap = (b: any): any => b?.data ?? b
const list = (b: any): Raw[] => { const d = unwrap(b); return Array.isArray(d) ? d : d?.content ?? d?.items ?? [] }
const mapC = (r: Raw): SalaryContribution => ({
  id: String(r.id), industryId: r.industryId == null ? null : Number(r.industryId), industry: r.industry ?? '', jobTitle: r.jobTitle ?? '',
  company: r.company ?? '', region: r.region ?? '', locationCity: r.locationCity ?? '', yearsExperience: r.yearsExperience ?? null,
  grossAmount: Number(r.grossAmount ?? 0), currency: r.currency ?? 'VND', createdAt: r.createdAt ?? '',
})

/** [A1] Kết quả AI kiểm tra mức lương trước khi đóng góp (POST /salaries/ai-check — không lưu dữ liệu). */
export interface SalaryAiCheck {
  anomalyPercentage: number
  isBlocked: boolean
  requiresConfirmation: boolean
  status: 'NORMAL' | 'BELOW_MARKET_WARNING' | 'HIGH_ANOMALY_ALLOWED' | 'EXCESSIVE_ANOMALY_BLOCKED'
  suggestedCorrectedAmountVnd: number | null
  realMarketRange: { minVnd: number; medianVnd: number; maxVnd: number; percentileEstimate: number }
  alumnectInternalRange: { minVnd: number | null; medianVnd: number | null; maxVnd: number | null; sampleCount: number } | null
  marketComparisonVi: string
  advisoryMessageVi: string
  source: string
}
const num = (v: any): number | null => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))
const mapAi = (r: Raw): SalaryAiCheck => {
  const m = r.realMarketRange ?? {}
  const i = r.alumnectInternalRange
  const status = ['NORMAL', 'BELOW_MARKET_WARNING', 'HIGH_ANOMALY_ALLOWED', 'EXCESSIVE_ANOMALY_BLOCKED'].includes(r.status) ? r.status : 'NORMAL'
  return {
    anomalyPercentage: Number(r.anomalyPercentage ?? 0), isBlocked: !!r.isBlocked, requiresConfirmation: !!r.requiresConfirmation, status,
    suggestedCorrectedAmountVnd: num(r.suggestedCorrectedAmountVnd),
    realMarketRange: { minVnd: num(m.minVnd) ?? 0, medianVnd: num(m.medianVnd) ?? 0, maxVnd: num(m.maxVnd) ?? 0, percentileEstimate: Number(m.percentileEstimate ?? 50) },
    alumnectInternalRange: i ? { minVnd: num(i.minVnd), medianVnd: num(i.medianVnd), maxVnd: num(i.maxVnd), sampleCount: Number(i.sampleCount ?? 0) } : null,
    marketComparisonVi: r.marketComparisonVi ?? '', advisoryMessageVi: r.advisoryMessageVi ?? '', source: r.source ?? 'LOCAL_FALLBACK',
  }
}
/** Triệu VNĐ, tối đa 1 chữ số thập phân (VD 38, 12.5). */
export const toMillionText = (vnd: number) => (vnd / 1_000_000).toFixed(1).replace(/\.0$/, '')

export const formatVnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(Math.round(n))} ₫`

export const salaryApi = {
  industries: async (): Promise<Industry[]> => list(await http.get('/industries')).map((r) => ({ id: Number(r.id), name: r.name ?? '' })),
  aiCheck: async (i: SalaryInput): Promise<SalaryAiCheck> =>
    mapAi(unwrap(await http.post('/salaries/ai-check', {
      industryId: i.industryId ?? undefined, jobTitle: i.jobTitle, company: i.company || undefined, region: i.region || undefined,
      locationCity: i.locationCity || undefined, yearsExperience: i.yearsExperience ?? undefined, grossAmount: i.grossAmount,
    }, { timeout: 20000 })) ?? {}),
  create: async (i: SalaryInput) => mapC(unwrap(await http.post('/salary-contributions', i))),
  mine: async () => list(await http.get('/salary-contributions/mine')).map(mapC),
  update: async (id: string, i: SalaryInput) => mapC(unwrap(await http.put(`/salary-contributions/${id}`, i))),
  remove: (id: string) => http.delete(`/salary-contributions/${id}`),
  statistics: async (f: { industryId?: number | null; region?: string }): Promise<SalaryStatistics> => {
    const params: Record<string, string | number> = {}
    if (f.industryId != null) params.industryId = f.industryId
    if (f.region) params.region = f.region
    const d = unwrap(await http.get('/salary-contributions/statistics', { params }))
    return {
      totalContributions: Number(d?.totalContributions ?? 0),
      trackedPositions: Number(d?.trackedPositions ?? 0),
      overallMedian: d?.overallMedian == null ? null : Number(d.overallMedian),
      rows: (d?.rows ?? []).map((r: Raw) => ({ role: r.role ?? '', level: r.level ?? '', region: r.region ?? '', median: Number(r.median ?? 0), p25: Number(r.p25 ?? 0), p75: Number(r.p75 ?? 0), samples: Number(r.samples ?? 0) })),
    }
  },
  feed: async (page: number, f: { industryId?: number | null; search?: string; sortBy?: string }) => {
    const params: Record<string, string | number> = { page, size: 10 }
    if (f.industryId != null) params.industryId = f.industryId
    if (f.search?.trim()) params.search = f.search.trim()
    if (f.sortBy) params.sortBy = f.sortBy
    const body = await http.get('/salary-contributions/feed', { params })
    const d = unwrap(body)
    const items = list(body).map(mapC)
    return { items, page, hasMore: typeof d?.last === 'boolean' ? !d.last : items.length >= 10 }
  },
}
