import type { RoleDto } from '@ethereal-nature/api-client'
import { getRouteApi } from '@tanstack/react-router'

/** Roles allowed into the back office; VIEWER is the read-only demo role. */
export function isBackOfficeRole(role: RoleDto): boolean {
  return role === 'ADMIN' || role === 'VIEWER'
}

const authedRoute = getRouteApi('/_authed')

/** True when the signed-in user is the read-only demo viewer. */
export function useIsViewer(): boolean {
  return authedRoute.useRouteContext().user.role === 'VIEWER'
}
