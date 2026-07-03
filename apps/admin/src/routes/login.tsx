import { loginMutation } from '@ethereal-nature/api-client'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { clearSession, establishSession } from '../features/auth/session'

interface LoginSearch {
  redirect?: string
  denied?: boolean
}

export const Route = createFileRoute('/login')({
  validateSearch: (input: Record<string, unknown>): LoginSearch => ({
    redirect: typeof input.redirect === 'string' ? input.redirect : undefined,
    denied: input.denied === true || undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo, denied } = Route.useSearch()
  const navigate = useNavigate()
  const [roleError, setRoleError] = useState(false)

  const mutation = useMutation({
    ...loginMutation({ throwOnError: true }),
    onSuccess: (auth) => {
      if (auth.user.role !== 'ADMIN') {
        clearSession()
        setRoleError(true)
        return
      }
      establishSession(auth)
      void navigate({ to: redirectTo ?? '/', reloadDocument: false })
    },
  })

  const error = roleError
    ? 'This account does not have admin access.'
    : denied && !mutation.isPending && !mutation.isError
      ? 'Admin access required — sign in with an admin account.'
      : mutation.isError
        ? 'Invalid email or password.'
        : null

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-24">
      <h1 className="text-2xl font-bold tracking-tight text-brand-900">Ethereal Nature · Admin</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          setRoleError(false)
          const form = new FormData(event.currentTarget)
          mutation.mutate({
            body: {
              email: form.get('email')?.toString() ?? '',
              password: form.get('password')?.toString() ?? '',
            },
          })
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="rounded border border-brand-100 bg-white px-3 py-2 text-base font-normal outline-none focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded border border-brand-100 bg-white px-3 py-2 text-base font-normal outline-none focus:border-brand-500"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
