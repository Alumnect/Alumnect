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

export const formatVnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(Math.round(n))} ₫`

export const salaryApi = {
  industries: async (): Promise<Industry[]> => list(await http.get('/industries')).map((r) => ({ id: Number(r.id), name: r.name ?? '' })),
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
