import { registerMutation } from '@ethereal-nature/api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AuthForm, errorMessage } from '../features/account/components/AuthForm'
import { useSession } from '../features/account/session'
import { mergeGuestCartAfterLogin } from '../features/cart/merge'

export const Route = createFileRoute('/register')({
  head: () => ({ meta: [{ title: 'Create account | Ethereal Nature' }] }),
  component: RegisterPage,
})

function RegisterPage() {
  const session = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...registerMutation({ throwOnError: true }),
    onSuccess: async (auth) => {
      session.login(auth)
      const merged = await mergeGuestCartAfterLogin(queryClient).catch(() => false)
      void navigate({ to: merged ? '/cart' : '/account' })
    },
  })

  return (
    <AuthForm
      title="Create account"
      submitLabel="Create account"
      isPending={mutation.isPending}
      error={mutation.isError ? errorMessage(mutation.error) : null}
      onSubmit={(email, password) => mutation.mutate({ body: { email, password } })}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:text-brand-900">
            Sign in
          </Link>
        </>
      }
    />
  )
}
