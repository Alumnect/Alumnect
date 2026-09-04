import { useState } from 'react'
import { Copy, MessageSquare, Check } from 'lucide-react'
import { Modal, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import type { Post } from '../model/post'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post
}

export function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/app/posts/${post.id}`
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Đã sao chép liên kết!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link: ', err)
      toast.error('Không thể sao chép liên kết')
    }
  }

  const handleSendMessenger = () => {
    toast.info('Tính năng đang được phát triển')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chia sẻ bài viết">
      <div className="flex flex-col gap-3 py-2">

        <button
          onClick={handleSendMessenger}
          className="flex items-center gap-4 rounded-xl p-4 text-left transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="font-bold text-plum-900 text-[15px]">Gửi trong Messenger</div>
            <div className="text-sm text-plum-500">Gửi trực tiếp cho bạn bè (Đang phát triển)</div>
          </div>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-4 rounded-xl p-4 text-left transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700">
            {copied ? <Check size={24} className="text-emerald-500" /> : <Copy size={24} />}
          </div>
          <div>
            <div className="font-bold text-plum-900 text-[15px]">{copied ? 'Đã sao chép!' : 'Sao chép liên kết'}</div>
            <div className="text-sm text-plum-500">Sao chép đường dẫn của bài viết này</div>
          </div>
        </button>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  )
}
