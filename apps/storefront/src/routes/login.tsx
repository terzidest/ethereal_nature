import { loginMutation } from '@ethereal-nature/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AuthForm, errorMessage } from '../features/account/components/AuthForm'
import { useSession } from '../features/account/session'
import { mergeGuestCartAfterLogin } from '../features/cart/merge'
import { safeRedirect } from '../features/checkout/flow'

export const Route = createFileRoute('/login')({
  // Where to go after signing in (e.g. back to /checkout); same-site paths only.
  validateSearch: (input: Record<string, unknown>): { redirect?: string } => ({ redirect: safeRedirect(input.redirect) }),
  head: () => ({ meta: [{ title: 'Sign in | Ethereal Nature' }] }),
  component: LoginPage,
})

function LoginPage() {
  const session = useSession()
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...loginMutation({ throwOnError: true }),
    onSuccess: async (auth) => {
      session.login(auth)
      const merged = await mergeGuestCartAfterLogin(queryClient).catch(() => false)
      if (redirect) void navigate({ href: redirect })
      else void navigate({ to: merged ? '/cart' : '/account' })
    },
  })

  // Already signed in when arriving (the form hasn't been used): nothing to do here.
  const arrivedSignedIn = session.user !== null && mutation.isIdle
  useEffect(() => {
    if (arrivedSignedIn) void navigate({ href: redirect ?? '/account', replace: true })
  }, [arrivedSignedIn, navigate, redirect])
  if (arrivedSignedIn) return null

  return (
    <AuthForm
      eyebrow="Sign in"
      title="Welcome"
      emphasis="back."
      intro="Your basket comes with you — we combine it with your account when you sign in."
      art="plate-eucalyptus"
      mode="sign-in"
      submitLabel="Sign in"
      isPending={mutation.isPending}
      error={mutation.isError ? errorMessage(mutation.error) : null}
      onSubmit={(email, password) => mutation.mutate({ body: { email, password } })}
      footer={
        <>
          New here?{' '}
          <Link to="/register" search={{ redirect }} className="font-medium text-brand hover:text-heading">
            Create an account
          </Link>
        </>
      }
    />
  )
}
