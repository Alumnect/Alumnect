import type { ReactNode } from 'react'

export interface SocialPlatform {
  name: string
  color: string
  icon: ReactNode
}

/**
 * Nhận diện logo và màu sắc đặc trưng của mạng xã hội dựa trên URL.
 */
export function getSocialPlatform(url: string): SocialPlatform {
  const lowercase = url.toLowerCase()
  if (lowercase.includes('facebook.com') || lowercase.includes('fb.com')) {
    return {
      name: 'Facebook',
      color: 'hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    }
  }
  if (lowercase.includes('linkedin.com')) {
    return {
      name: 'LinkedIn',
      color: 'hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/30',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    }
  }
  if (lowercase.includes('instagram.com')) {
    return {
      name: 'Instagram',
      color: 'hover:text-[#E1306C] hover:bg-[#E1306C]/10 hover:border-[#E1306C]/30',
      icon: (
        <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      ),
    }
  }
  if (lowercase.includes('youtube.com') || lowercase.includes('youtu.be')) {
    return {
      name: 'YouTube',
      color: 'hover:text-[#FF0000] hover:bg-[#FF0000]/10 hover:border-[#FF0000]/30',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    }
  }
  if (lowercase.includes('github.com')) {
    return {
      name: 'GitHub',
      color: 'hover:text-[#24292F] hover:bg-[#24292F]/10 hover:border-[#24292F]/30',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
        </svg>
      ),
    }
  }
  if (lowercase.includes('threads.net')) {
    return {
      name: 'Threads',
      color: 'hover:text-[#000000] hover:bg-[#000000]/10 hover:border-[#000000]/30',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.83 15.65c-.75.48-1.54.73-2.34.73-.89 0-1.63-.31-2.22-.92-.59-.61-.88-1.39-.88-2.34 0-.96.29-1.74.88-2.35.59-.61 1.33-.92 2.22-.92.89 0 1.63.31 2.22.92.59.61.88 1.39.88 2.35 0 .35-.04.69-.11 1.02-.07.33-.2.62-.38.87a2.12 2.12 0 0 1-.77.62c-.32.14-.68.21-1.09.21-.49 0-.91-.12-1.26-.37-.35-.25-.53-.61-.53-1.07V9.3h-1.28v4.45c0 .73.23 1.32.68 1.76.45.44 1.05.66 1.79.66.69 0 1.3-.18 1.83-.55.53-.37.93-.89 1.2-1.56.27-.67.4-1.48.4-2.43 0-1.4-.41-2.52-1.23-3.37-.82-.85-1.92-1.27-3.31-1.27-1.38 0-2.48.42-3.3 1.27-.82.85-1.23 1.97-1.23 3.37 0 .95.13 1.76.4 2.43.27.67.67 1.19 1.2 1.56.53.37 1.14.55 1.83.55.52 0 .97-.09 1.35-.27l.38 1.18c-.52.25-1.12.37-1.73.37-.99 0-1.85-.24-2.58-.72-.73-.48-1.28-1.17-1.65-2.07-.37-.9-.55-2.02-.55-3.36 0-1.72.54-3.13 1.62-4.23s2.51-1.65 4.29-1.65c1.78 0 3.21.55 4.29 1.65s1.62 2.51 1.62 4.23c0 1.34-.18 2.46-.55 3.36-.37.9-.92 1.59-1.65 2.07z"/>
        </svg>
      ),
    }
  }
  if (lowercase.includes('twitter.com') || lowercase.includes('x.com')) {
    return {
      name: 'X',
      color: 'hover:text-[#000000] hover:bg-[#000000]/10 hover:border-[#000000]/30',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    }
  }
  // Mặc định là website cá nhân
  return {
    name: 'Website',
    color: 'hover:text-brand-600 hover:bg-brand-50 hover:border-brand-200',
    icon: (
      <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  }
}
