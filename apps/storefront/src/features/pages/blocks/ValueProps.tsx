import { z } from 'zod'

export const valuePropsSchema = z.object({
  items: z.array(z.object({ title: z.string(), blurb: z.string() })),
})

export function ValueProps({ items }: z.output<typeof valuePropsSchema>) {
  return (
    <section className="border-y border-brand-100 bg-sand-100/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        {items.map(({ title, blurb }) => (
          <div key={title} className="flex flex-col gap-1.5 text-center sm:text-left">
            <span className="font-display text-lg font-semibold text-brand-900">{title}</span>
            <span className="text-sm leading-relaxed text-ink/60">{blurb}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
