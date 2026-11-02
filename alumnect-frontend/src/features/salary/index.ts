export { useIndustries, useCreateSalaryContribution, useMyContributions, useUpdateSalaryContribution, useDeleteSalaryContribution, useSalaryStatistics, useSalaryFeed } from './hooks/useSalary'
export { salaryApi } from './api/salaryApi'
export {
  industrySchema,
  salaryContributionSchema,
  createSalaryContributionSchema,
  salaryStatisticsSchema,
  MAX_GROSS_AMOUNT,
  SALARY_LEVELS,
  STANDARD_JOB_TITLES,
  VIETNAM_CITIES,
  OTHER_JOB_TITLE_ID,
  JOB_TITLES_BY_INDUSTRY,
  INDUSTRY_ICONS,
  getIndustryIcon,
} from './model/salary'
export type { Industry, SalaryContribution, CreateSalaryContributionInput, SalaryStatRow, SalaryStatistics, SalaryLevel, SalaryStatisticsFilters } from './model/salary'
export { ContributeSalaryModal } from './components/ContributeSalaryModal'
export { MyContributionsModal } from './components/MyContributionsModal'
export { DeleteSalaryContributionModal } from './components/DeleteSalaryContributionModal'
export { SalaryContributionsFeed } from './components/SalaryContributionsFeed'
