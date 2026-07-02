import { useState } from 'react'
import { HelpCircle, ChevronUp, MessageSquare, Search, Flame, Clock, CheckCircle2 } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import type { Question } from '@/lib/constants'
import { cn } from '@/lib/utils'

const TOPICS = ['All', 'Career', 'Interview', 'Engineering', 'Education', 'Startup']
const SORTS = [
  { key: 'hot', label: 'Hot', icon: Flame },
  { key: 'new', label: 'Newest', icon: Clock },
  { key: 'unanswered', label: 'Unanswered', icon: CheckCircle2 },
]

// TODO(team): chưa có API Forum — thay QUESTIONS bằng dữ liệu thật khi backend sẵn sàng.
const QUESTIONS: Question[] = []

/** Quy đổi chuỗi thời gian mock ('3h', '2d'…) sang số giờ để so sánh độ mới. */
function hoursAgo(time: string): number {
  const match = /^(\d+)(h|d)$/.exec(time)
  if (!match) return Number.POSITIVE_INFINITY
  const [, n, unit] = match
  return unit === 'd' ? Number(n) * 24 : Number(n)
}

export function ForumPage() {
  const [topic, setTopic] = useState('All')
  const [sort, setSort] = useState('hot')

  const questions = QUESTIONS.filter((q) => topic === 'All' || q.topic === topic)
  if (sort === 'hot') questions.sort((a, b) => b.votes - a.votes)
  else if (sort === 'new') questions.sort((a, b) => hoursAgo(a.time) - hoursAgo(b.time))
  else if (sort === 'unanswered') {
    questions.sort((a, b) => a.answers - b.answers)
  }
  const visibleQuestions = sort === 'unanswered' ? questions.filter((q) => q.answers === 0) : questions

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={<HelpCircle size={20} />}
        title="Q&A Forum"
        subtitle="Ask seniors, answer juniors, and build a living knowledge base."
        actions={<Button variant="primary" size="sm">Ask a question</Button>}
      />

      <Reveal>
        <label className="relative mb-5 flex items-center">
          <Search size={17} className="pointer-events-none absolute left-3.5 text-plum-400" />
          <input placeholder="Search questions…" className="h-12 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-10 pr-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
        </label>
      </Reveal>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={cn('rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all', topic === t ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white' : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]')}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl bg-plum-900/[0.04] p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors', sort === s.key ? 'bg-plum-900/[0.06] text-plum-900' : 'text-plum-400 hover:text-plum-900')}
            >
              <s.icon size={13} /> {s.label}
            </button>
          ))}
        </div>
      </div>

      {visibleQuestions.length === 0 ? (
        <EmptyState
          icon={<HelpCircle size={24} />}
          title={sort === 'unanswered' ? 'No unanswered questions' : 'No questions found'}
          description="Try a different topic filter, or be the first to ask."
          action={<Button size="sm" variant="secondary" onClick={() => setTopic('All')}>Clear filter</Button>}
        />
      ) : (
      <Stagger className="space-y-4" gap={0.06}>
        {visibleQuestions.map((q) => (
          <StaggerItem key={q.id}>
            <Card hover={false} className="p-5 transition-all hover:-translate-y-0.5">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1">
                  <button className="grid h-10 w-10 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-500 ring-1 ring-inset ring-plum-900/10 hover:bg-brand-500/15 hover:text-brand-600">
                    <ChevronUp size={18} />
                  </button>
                  <span className="text-sm font-bold text-plum-900">{q.votes}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Badge tone="violet" className="mb-2 px-2 py-0.5 text-[10px]">{q.topic}</Badge>
                  <h2 className="text-lg font-bold leading-snug text-plum-900 hover:text-brand-600">{q.title}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {q.tags.map((t) => (
                      <span key={t} className="rounded-md bg-plum-900/[0.04] px-2 py-0.5 text-[11px] font-medium text-plum-500">#{t}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-plum-900/8 pt-3">
                    <div className="flex items-center gap-2 text-sm text-plum-500">
                      <Avatar src="https://i.pravatar.cc/60?img=12" name={q.author} size={24} />
                      <span>{q.author}</span>
                      <span className="text-plum-300">·</span>
                      <span>{q.time}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                      <MessageSquare size={15} /> {q.answers} answers
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
      )}
    </div>
  )
}
