'use client'

import { useRouter } from 'next/navigation'

export const useLogout = () => {
  const router = useRouter()

  const logout = () => {
    document.cookie = 'rol=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
    document.cookie = 'dni=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
    document.cookie = 'id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
    document.cookie = 'gym_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
    document.cookie = 'name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
    document.cookie = 'gym_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'

    if (typeof window !== 'undefined') {
      localStorage.removeItem('gym_settings')
      localStorage.removeItem('gym_logo_url')
      localStorage.clear()
    }

    router.push('/login')
  }

  return logout
}
