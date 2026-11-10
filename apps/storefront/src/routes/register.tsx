import { registerMutation } from '@ethereal-nature/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AuthForm, errorMessage } from '../features/account/components/AuthForm'
import { useSession } from '../features/account/session'
import { mergeGuestCartAfterLogin } from '../features/cart/merge'
import { safeRedirect } from '../features/checkout/flow'

export const Route = createFileRoute('/register')({
  // Where to go after creating the account (e.g. back to /checkout); same-site paths only.
  validateSearch: (input: Record<string, unknown>): { redirect?: string } => ({ redirect: safeRedirect(input.redirect) }),
  head: () => ({ meta: [{ title: 'Create account | Ethereal Nature' }] }),
  component: RegisterPage,
})

function RegisterPage() {
  const session = useSession()
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...registerMutation({ throwOnError: true }),
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
      eyebrow="Create an account"
      title="Join the"
      emphasis="garden."
      intro="Keep your order history in one place, and a basket that follows you from device to device."
      art="plate-chamomile"
      mode="register"
      submitLabel="Create account"
      isPending={mutation.isPending}
      error={mutation.isError ? errorMessage(mutation.error) : null}
      onSubmit={(email, password) => mutation.mutate({ body: { email, password } })}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" search={{ redirect }} className="font-medium text-brand hover:text-heading">
            Sign in
          </Link>
        </>
      }
    />
  )
}
