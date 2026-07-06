import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 shadow-card disabled:hover:bg-brand-600',
  secondary:
    'bg-brand-50 text-brand-900 hover:bg-brand-100 disabled:hover:bg-brand-50',
  ghost: 'text-brand-700 hover:bg-brand-50 disabled:hover:bg-transparent',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', extra = ''): string {
  return `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${extra}`.trim()
}

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return <button type="button" {...props} className={buttonClasses(variant, size, className)} />
}

/** For styling router <Link>s and anchors identically to buttons. */
export function ButtonLink<T extends ElementType>({
  as,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: { as: T; variant?: Variant; size?: Size; className?: string } & ComponentPropsWithoutRef<T>) {
  const Component = as as ElementType
  return <Component {...props} className={buttonClasses(variant, size, className)} />
}
