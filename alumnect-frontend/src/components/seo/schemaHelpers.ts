// =====================================================================
// Helpers sinh dữ liệu cấu trúc Schema.org chuẩn Google Rich Results
// =====================================================================

export interface JobSchemaParams {
  title: string
  company: string
  location?: string | null
  description: string
  datePosted?: string
  validThrough?: string
  salaryMin?: number | null
  salaryMax?: number | null
  applyUrl?: string | null
}

export function buildJobSchema(job: JobSchemaParams) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || job.title,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company,
      value: `JOB-${Date.now()}`,
    },
    datePosted: job.datePosted || new Date().toISOString().split('T')[0],
    validThrough:
      job.validThrough ||
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Việt Nam',
        addressCountry: 'VN',
      },
    },
  }

  if (job.salaryMin || job.salaryMax) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'VND',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salaryMin || undefined,
        maxValue: job.salaryMax || undefined,
        unitText: 'MONTH',
      },
    }
  }

  return schema
}

export interface EventSchemaParams {
  title: string
  description: string
  location?: string | null
  startTime?: string | null
  endTime?: string | null
  image?: string
}

export function buildEventSchema(event: EventSchemaParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.startTime || new Date().toISOString(),
    endDate: event.endTime || undefined,
    eventAttendanceMode: event.location?.toLowerCase().includes('online')
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location || 'Đại học FPT',
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.location || 'Việt Nam',
        addressCountry: 'VN',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'AlumNect - FPT University Alumni',
      url: 'https://alumnect.online',
    },
    image: event.image ? [event.image] : undefined,
  }
}

export interface QaSchemaParams {
  questionTitle: string
  questionText: string
  authorName?: string
  dateCreated?: string
  answerCount?: number
}

export function buildQaSchema(qa: QaSchemaParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: qa.questionTitle,
      text: qa.questionText,
      answerCount: qa.answerCount || 0,
      dateCreated: qa.dateCreated || new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: qa.authorName || 'Sinh viên / Cựu sinh viên FPT',
      },
    },
  }
}

