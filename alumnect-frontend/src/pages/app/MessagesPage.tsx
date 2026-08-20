import { useState } from 'react'
import { Search, Send, Phone, Video, MoreVertical, BadgeCheck } from 'lucide-react'
import { Avatar, Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ALUMNI } from '@/lib/constants'

const CONVOS = ALUMNI.slice(0, 6).map((a, i) => ({
  ...a,
  last: ['Tuyệt vời, kết nối nhé!', 'Cảm ơn anh đã giới thiệu 🙏', 'Hẹn gặp bạn tại sự kiện', 'Mình đã gửi tài liệu qua email rồi', 'Chúc mừng bạn đã thăng chức nhé!', 'Để mình kiểm tra lại rồi báo bạn nhé'][i],
  time: ['2 phút', '1 giờ', '3 giờ', '1 ngày', '2 ngày', '3 ngày'][i],
  unread: i < 2,
}))

const THREAD = [
  { me: false, text: 'Chào anh! Em thấy bài đăng anh mới thăng chức Senior — chúc mừng anh nhé! 🎉', time: '10:02' },
  { me: true, text: 'Cảm ơn em nhiều nhé! Được tiền bối chúc mừng thấy vui lắm 🙏', time: '10:04' },
  { me: false, text: 'Nếu cần thì hôm nào anh mock interview System Design giúp em nhé?', time: '10:05' },
  { me: true, text: 'Dạ được vậy thì tốt quá ạ! Tuần này em rảnh các buổi tối.', time: '10:06' },
  { me: false, text: 'Thế tối thứ Năm 8h nhé. Anh gửi link Google Meet qua lịch.', time: '10:08' },
]

export function MessagesPage() {
  const [active, setActive] = useState(CONVOS[0])

  return (
    <div className="mx-auto max-w-6xl">
      <Card hover={false} className="grid h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
        {/* conversations */}
        <div className="hidden flex-col border-r border-plum-900/8 md:flex">
          <div className="border-b border-plum-900/8 p-4">
            <h2 className="mb-3 text-lg font-extrabold text-plum-900">Tin nhắn</h2>
            <label className="relative flex items-center">
              <Search size={16} className="pointer-events-none absolute left-3 text-plum-400" />
              <input placeholder="Tìm kiếm cuộc trò chuyện..." className="h-10 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-9 pr-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/50 focus:outline-none" />
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            {CONVOS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-plum-900/[0.04]', active.id === c.id && 'bg-plum-900/[0.05]')}
              >
                <Avatar src={c.avatar} name={c.name} size={44} verified={c.verified} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-bold text-plum-900">{c.name}</p>
                    <span className="text-[11px] text-plum-400">{c.time}</span>
                  </div>
                  <p className={cn('truncate text-xs', c.unread ? 'font-semibold text-plum-700' : 'text-plum-400')}>{c.last}</p>
                </div>
                {c.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* thread */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-plum-900/8 p-4">
            <div className="flex items-center gap-3">
              <Avatar src={active.avatar} name={active.name} size={42} verified={active.verified} />
              <div>
                <p className="flex items-center gap-1 text-sm font-bold text-plum-900">{active.name} <BadgeCheck size={14} className="text-brand-400" /></p>
                <p className="text-xs text-emerald-600">● Đang trực tuyến</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-plum-400">
              {[
                { Icon: Phone, label: 'Gọi thoại' },
                { Icon: Video, label: 'Gọi video' },
                { Icon: MoreVertical, label: 'Tùy chọn khác' },
              ].map(({ Icon, label }) => (
                <button key={label} aria-label={label} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-plum-900/[0.05] hover:text-plum-900"><Icon size={17} /></button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-ink-950/40 p-5">
            {THREAD.map((m, i) => (
              <div key={i} className={cn('flex', m.me ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                  m.me ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-slate-100 shadow-sm text-slate-800',
                )}>
                  <p>{m.text}</p>
                  <p className={cn('mt-1 text-[10px]', m.me ? 'text-white/70' : 'text-plum-400')}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-plum-900/8 p-4">
            <input placeholder="Nhập tin nhắn…" className="h-11 flex-1 rounded-xl border border-plum-900/10 bg-plum-900/[0.04] px-4 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
            <button className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white shadow-sm transition-transform hover:scale-105 hover:bg-brand-700">
              <Send size={18} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
