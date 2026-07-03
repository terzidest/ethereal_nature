import { loginMutation } from '@ethereal-nature/api-client'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AuthForm, errorMessage } from '../features/account/components/AuthForm'
import { useSession } from '../features/account/session'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Sign in | Ethereal Nature' }] }),
  component: LoginPage,
})

function LoginPage() {
  const session = useSession()
  const navigate = useNavigate()
  const mutation = useMutation({
    ...loginMutation({ throwOnError: true }),
    onSuccess: ({ ...auth }) => {
      session.login(auth)
      void navigate({ to: '/account' })
    },
  })

  return (
    <AuthForm
      title="Sign in"
      submitLabel="Sign in"
      isPending={mutation.isPending}
      error={mutation.isError ? errorMessage(mutation.error) : null}
      onSubmit={(email, password) => mutation.mutate({ body: { email, password } })}
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:text-brand-900">
            Create an account
          </Link>
        </>
      }
    />
  )
}
