import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Image as ImageIcon,
  CalendarPlus,
  Briefcase,
  Award,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  MoreHorizontal,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Avatar, Badge, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { FEED_POSTS, ALUMNI, EVENTS, QUESTIONS } from '@/lib/constants'
import { compact, cn } from '@/lib/utils'

const TYPE_META: Record<string, { label: string; tone: 'brand' | 'gold' | 'aqua' | 'violet' }> = {
  achievement: { label: 'Achievement', tone: 'gold' },
  recruitment: { label: 'Hiring', tone: 'aqua' },
  event: { label: 'Event', tone: 'violet' },
  normal: { label: 'Post', tone: 'brand' },
}

function Composer() {
  return (
    <Card hover={false} className="p-4">
      <div className="flex gap-3">
        <Avatar src="https://i.pravatar.cc/120?img=12" name="Minh Anh" size={44} verified />
        <button className="h-11 flex-1 rounded-xl border border-plum-900/10 bg-plum-900/[0.04] px-4 text-left text-sm text-plum-400 transition-colors hover:bg-plum-900/[0.05]">
          Share an achievement, ask, or post a job…
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-plum-900/8 pt-3">
        {[
          { icon: Award, label: 'Achievement', tone: 'text-gold-600' },
          { icon: ImageIcon, label: 'Photo', tone: 'text-aqua-500' },
          { icon: Briefcase, label: 'Job', tone: 'text-brand-600' },
          { icon: CalendarPlus, label: 'Event', tone: 'text-violet-600' },
        ].map((a) => (
          <button
            key={a.label}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-plum-500 transition-colors hover:bg-plum-900/[0.04]"
          >
            <a.icon size={17} className={a.tone} />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
        <Button size="sm" className="ml-auto">Post</Button>
      </div>
    </Card>
  )
}

function PostCard({ post }: { post: (typeof FEED_POSTS)[number] }) {
  const [liked, setLiked] = useState(false)
  const meta = TYPE_META[post.type] ?? TYPE_META.normal
  return (
    <Card hover={false} className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Avatar src={post.avatar} name={post.author} size={46} verified={post.verified} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-bold text-plum-900">
              <span className="truncate">{post.author}</span>
              <Badge tone={meta.tone} className="px-2 py-0.5 text-[10px]">{meta.label}</Badge>
            </p>
            <p className="truncate text-xs text-plum-400">{post.role} · {post.time}</p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.05] hover:text-plum-900">
            <MoreHorizontal size={18} />
          </button>
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-plum-800">{post.text}</p>
      </div>

      {post.image && (
        <img src={post.image} alt="" className="max-h-[26rem] w-full object-cover" loading="lazy" />
      )}

      <div className="flex items-center gap-1 p-3">
        <button
          onClick={() => setLiked((v) => !v)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
            liked ? 'text-rose-500' : 'text-plum-500 hover:bg-plum-900/[0.04] hover:text-plum-900',
          )}
        >
          <Heart size={18} className={liked ? 'fill-rose-400' : ''} />
          {compact(post.likes + (liked ? 1 : 0))}
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-plum-500 transition-colors hover:bg-plum-900/[0.04] hover:text-plum-900">
          <MessageCircle size={18} /> {compact(post.comments)}
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-plum-500 transition-colors hover:bg-plum-900/[0.04] hover:text-plum-900">
          <Repeat2 size={18} /> {compact(post.reposts)}
        </button>
        <button className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.04] hover:text-plum-900">
          <Bookmark size={18} />
        </button>
      </div>
    </Card>
  )
}

function SidebarCard({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <Card hover={false} className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-plum-900">{title}</h3>
        {action && <Link to="#" className="text-xs font-semibold text-brand-600 hover:text-brand-600">{action}</Link>}
      </div>
      {children}
    </Card>
  )
}

export function FeedPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
      {/* main feed */}
      <div className="space-y-5">
        <Reveal><Composer /></Reveal>
        <Stagger className="space-y-5" gap={0.1}>
          {FEED_POSTS.map((p) => (
            <StaggerItem key={p.id}>
              <PostCard post={p} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* right rail */}
      <aside className="hidden space-y-5 lg:block">
        <Reveal direction="left">
          <SidebarCard title="Who to follow" action="See all">
            <ul className="space-y-4">
              {ALUMNI.slice(0, 3).map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <Avatar src={a.avatar} name={a.name} size={40} verified={a.verified} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-plum-900">{a.name}</p>
                    <p className="truncate text-xs text-plum-400">{a.cohort}</p>
                  </div>
                  <Button size="sm" variant="secondary">Follow</Button>
                </li>
              ))}
            </ul>
          </SidebarCard>
        </Reveal>

        <Reveal direction="left" delay={0.1}>
          <SidebarCard title="Upcoming events" action="All events">
            <ul className="space-y-3">
              {EVENTS.slice(0, 2).map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <div className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-plum-900/[0.04] py-1.5 text-center ring-1 ring-inset ring-plum-900/10">
                    <span className="text-[9px] font-bold uppercase text-brand-600">{e.month}</span>
                    <span className="text-base font-extrabold text-plum-900">{e.day}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-plum-900">{e.title}</p>
                    <p className="truncate text-xs text-plum-400">{compact(e.attendees)} attending</p>
                  </div>
                </li>
              ))}
            </ul>
          </SidebarCard>
        </Reveal>

        <Reveal direction="left" delay={0.2}>
          <SidebarCard title="Trending Q&A" action="Forum">
            <ul className="space-y-3">
              {QUESTIONS.slice(0, 3).map((q) => (
                <li key={q.id}>
                  <Link to="/app/forum" className="group block">
                    <p className="line-clamp-2 text-sm font-semibold text-plum-800 group-hover:text-brand-600">{q.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-plum-400">
                      <TrendingUp size={12} /> {q.votes} votes · {q.answers} answers
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </SidebarCard>
        </Reveal>

        <Reveal direction="left" delay={0.3}>
          <div className="ring-gradient relative overflow-hidden rounded-2xl card-surface p-5">
            <Sparkles className="text-gold-600" size={22} />
            <p className="mt-3 font-bold text-plum-900">Get the verified badge</p>
            <p className="mt-1 text-sm text-plum-500">Submit your FPTU proof to unlock full alumni privileges.</p>
            <Button size="sm" variant="gold" className="mt-4 w-full" rightIcon={<ArrowRight size={15} />}>
              Verify now
            </Button>
          </div>
        </Reveal>
      </aside>
    </div>
  )
}
