import http from '@/lib/http'
import type { ApiResponse, PageResponse } from '@/lib/http'

export interface MapPoint {
  userId: number
  majorId?: number | null
  fullName: string
  avatarUrl: string
  verifiedStatus: boolean
  title: string
  company: string
  location: string
  locationCity?: string | null
  locationCountry?: string | null
  locationCountryCode?: string | null
  latitude: number
  longitude: number
  cohort?: number | null
}

export interface CareerSummary {
  userId: number
  fullName: string
  avatarUrl: string
  verifiedStatus: boolean
  cohort?: number | null
  major?: string | null
  currentTitle?: string | null
  currentCompany?: string | null
  currentLocation?: string | null
  careerPreview: { experienceId: number; title: string; company: string; startDate: string; endDate?: string | null; isCurrent: boolean }[]
  totalExperiences: number
}

export interface CareerDetail {
  userId: number
  fullName: string
  avatarUrl: string
  experiences: { id: number; title: string; company: string; location?: string | null; startDate: string; endDate?: string | null; isCurrent: boolean; isPrimary: boolean; description?: string | null }[]
}

// CareerPreviewItem uses Lombok's boolean getter, so older responses expose
// `current`; full ExperienceResponse explicitly exposes `isCurrent`.
type CareerSummaryResponse = Omit<CareerSummary, 'careerPreview'> & {
  careerPreview: (Omit<CareerSummary['careerPreview'][number], 'isCurrent'> & { isCurrent?: boolean; current?: boolean })[]
}

export interface ExperienceLocation {
  latitude?: number | null
  longitude?: number | null
  placeId?: string | null
  locationCity?: string | null
  locationCountry?: string | null
  locationCountryCode?: string | null
  geocodingProvider?: string | null
}

export interface Experience extends ExperienceLocation {
  id: number
  title: string
  company: string
  location?: string | null
  startDate: string
  endDate?: string | null
  isCurrent: boolean
  isPrimary: boolean
  description?: string | null
}
export interface ExperienceRequest extends ExperienceLocation {
  title: string
  company: string
  location?: string | null
  startDate: string
  endDate?: string | null
  isCurrent: boolean
  isPrimary: boolean
  description?: string | null
}

/** [C2] AI đối chiếu lộ trình 1-chạm — khớp CareerAiCompareResponse phía Backend. */
export interface LadderStep { period: string; title: string; company: string; takeawayVi: string }
export interface PersonCard {
  userId: number | null; name: string; avatarUrl: string | null; headline: string | null; currentRole: string | null; company: string | null
  majorName: string | null; cohort: number | null; relationshipType: string | null; yearsSinceFirstJob: number | null; companyCount: number; skills: string[]
}
export interface CareerAiCompare {
  targetPerson: PersonCard; viewerPerson: PersonCard; comparisonSummaryVi: string
  historicalLadder: LadderStep[]; viewerLadder: LadderStep[]
  sharedStrengths: string[]; keyGapsToBridge: string[]; transferableSkills: string[]
  actionableAdviceVi: string; viewerHasExperience: boolean; source: string
}
type AnyRec = Record<string, any>
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const ladder = (v: unknown): LadderStep[] => (Array.isArray(v) ? v : []).map((s: AnyRec) => ({ period: s?.period ?? '', title: s?.title ?? '', company: s?.company ?? '', takeawayVi: s?.takeawayVi ?? '' }))
const person = (p: AnyRec = {}): PersonCard => ({
  userId: p.userId ?? null, name: p.name ?? '', avatarUrl: p.avatarUrl ?? null, headline: p.headline ?? null, currentRole: p.currentRole ?? null,
  company: p.company ?? null, majorName: p.majorName ?? null, cohort: p.cohort ?? null, relationshipType: p.relationshipType ?? null,
  yearsSinceFirstJob: p.yearsSinceFirstJob ?? null, companyCount: Number(p.companyCount ?? 0), skills: strs(p.skills),
})

export const exploreApi = {
  map: (f: { search?: string; cohort?: number; majorId?: number }) =>
    http.get<unknown, ApiResponse<MapPoint[]>>('/alumni-map', { params: f }).then((r) => r.data ?? []),
  careerPaths: (f: { search?: string; title?: string; company?: string; location?: string; cohort?: number; majorId?: number; page?: number }) =>
    http.get<unknown, ApiResponse<PageResponse<CareerSummaryResponse>>>('/career-paths', { params: { size: 10, ...f } }).then((r): PageResponse<CareerSummary> => ({
      ...r.data,
      content: r.data.content.map((person) => ({ ...person, careerPreview: person.careerPreview.map((step) => ({ ...step, isCurrent: step.isCurrent ?? step.current ?? false })) })),
    })),
  careerAiCompare: (targetUserId: number) =>
    http.post<unknown, ApiResponse<AnyRec>>('/career-paths/ai-compare', { targetUserId }, { timeout: 20000 }).then((r): CareerAiCompare => {
      const d: AnyRec = (r as AnyRec)?.data ?? r ?? {}
      return {
        targetPerson: person(d.targetPerson), viewerPerson: person(d.viewerPerson), comparisonSummaryVi: d.comparisonSummaryVi ?? '',
        historicalLadder: ladder(d.historicalLadder), viewerLadder: ladder(d.viewerLadder),
        sharedStrengths: strs(d.sharedStrengths), keyGapsToBridge: strs(d.keyGapsToBridge), transferableSkills: strs(d.transferableSkills),
        actionableAdviceVi: d.actionableAdviceVi ?? '', viewerHasExperience: !!d.viewerHasExperience, source: d.source ?? 'LOCAL_FALLBACK',
      }
    }),
  careerDetail: (userId: number) => http.get<unknown, ApiResponse<CareerDetail>>(`/career-paths/users/${userId}`).then((r) => r.data),
}

export const experienceApi = {
  list: () => http.get<unknown, ApiResponse<Experience[]>>('/experiences').then((r) => r.data ?? []),
  create: (p: ExperienceRequest) => http.post<unknown, ApiResponse<Experience>>('/experiences', p).then((r) => r.data),
  update: (id: number, p: ExperienceRequest) => http.put<unknown, ApiResponse<Experience>>(`/experiences/${id}`, p).then((r) => r.data),
  remove: (id: number) => http.delete(`/experiences/${id}`),
  promote: (id: number, p: { newTitle: string; newStartDate: string; description?: string | null; reuseLocation: boolean }) =>
    http.post<unknown, ApiResponse<Experience>>(`/experiences/${id}/promote`, p).then((r) => r.data),
}
