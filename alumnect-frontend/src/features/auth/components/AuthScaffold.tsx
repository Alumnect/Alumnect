import { forwardRef } from 'react'
import type { ReactNode, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import loginBg from '@/assets/login-bg.jpg'

export function AuthScaffold({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center lg:justify-between p-6 lg:p-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={loginBg} 
          alt="FPT University Campus" 
          className="h-full w-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 hidden lg:flex flex-col max-w-lg mt-[-10vh]">
        {/* Logo */}
        <div className="mb-10 inline-flex items-center gap-4">
          <div className="rounded bg-white px-3 py-2 flex items-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/11/FPT_logo_2010.svg" alt="FPT" className="h-6" />
          </div>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
              .brand-logo {
                font-family: 'Caveat', cursive;
                font-size: 4.5rem;
                line-height: 1;
                font-weight: 700;
                color: #ffffff;
                text-shadow: 2px 4px 12px rgba(0,0,0,0.3);
                transform: rotate(-3deg);
                letter-spacing: 1px;
              }
            `}
          </style>
          <span className="brand-logo border-l-2 border-white/50 pl-4">AlumNect</span>
        </div>

        <h1 className="text-4xl font-extrabold text-white drop-shadow-md leading-tight">
          Cộng đồng Cựu sinh viên <br /> Trường Đại học FPT
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-white/90 drop-shadow">
          Tham gia cộng đồng bạn sẽ có cơ hội kết nối, tìm kiếm và giao lưu với hàng chục nghìn cựu sinh viên FPTU trên khắp thế giới. Tìm kiếm những người có cùng sở thích, kinh nghiệm, hoặc đơn giản là muốn kết nối để chia sẻ những câu chuyện thú vị.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
        {children}
      </div>
    </div>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: ReactNode
  trailing?: ReactNode
  error?: string
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, icon, trailing, error, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {icon && <span className="absolute top-3.5 left-3 text-gray-400 z-10 pointer-events-none">{icon}</span>}
      <input
        ref={ref}
        {...rest}
        placeholder=" "
        className={cn(
          'peer block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 pb-2.5 pt-4 text-sm text-gray-900 focus:border-[#F27024] focus:outline-none focus:ring-0 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white]',
          icon && 'pl-10',
          error && 'border-red-500 focus:border-red-500',
          trailing && 'pr-10',
          className,
        )}
      />
      <label
        className={cn(
          'absolute top-2 left-4 z-10 origin-[0] -translate-y-4 scale-75 transform bg-white px-1 text-xs font-medium text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-[#F27024]',
          icon && 'left-9',
          error && 'peer-focus:text-red-500'
        )}
      >
        {label}
      </label>
      {trailing && <span className="absolute top-3.5 right-3 text-gray-500">{trailing}</span>}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </div>
  )
})

Field.displayName = 'Field'
