'use client'

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import Cookies from 'js-cookie'

/* =======================
   Types
======================= */

export interface GymPlan {
  id: number
  name: string
  max_alumnos: number
  stats: boolean
  classes: boolean
  services: boolean
  appointments: boolean
  portal: boolean
  settings: boolean
  /** Existe en gym_plans y viaja en `gym_plans(*)`; faltaba solo en el tipo. */
  products: boolean
  created_at?: string
  updated_at?: string
}

interface Subscription {
  id: number
  start_at: string
  end_at: string | null
  is_active: boolean
}

interface SubscriptionData {
  hasSubscription: boolean
  isActive: boolean
  plan: GymPlan | null
  subscription: Subscription | null
}

export type FeatureKey = keyof Omit<
  GymPlan,
  'id' | 'name' | 'max_alumnos' | 'created_at' | 'updated_at'
>

interface SubscriptionContextType {
  subscriptionData: SubscriptionData | null
  isSubscriptionLoading: boolean
  isUnverified: boolean
  error: string | null
  refetch: () => Promise<void>
  hasFeature: (feature: FeatureKey) => boolean | null
  maxAlumnos: number
  planName: string | null
  isSubscriptionActive: boolean
  isExpiringSoon: boolean
  daysUntilExpiration: number | null
  isPaymentWarning: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
)

const fetchGymSubscription = async (gymId: string): Promise<SubscriptionData> => {
  const { data } = await api.get(`/api/suscriptions/gym/${gymId}/plan`)
  return data
}


const PAYMENT_WARNING_START_DAY = 5
const PAYMENT_SUSPENSION_DAY = 16

export const SubscriptionProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const pathname = usePathname()
  const [auth, setAuth] = useState<{ gymId?: string; userRole?: string } | null>(null)
  const gymId = auth?.gymId
  const userRole = auth?.userRole

  // Este provider vive en el layout raiz, asi que sigue montado desde /login:
  // leer la cookie en el render la capturaba vacia y, como el elemento children
  // del RSC no cambia de identidad, React no re-renderizaba el provider al
  // navegar al dashboard. Resultado: gym_id quedaba undefined toda la sesion,
  // la query nunca se habilitaba y la app mostraba "Sin plan". Se re-lee al
  // montar, en cada navegacion y cuando el login avisa que cambio la sesion.
  useEffect(() => {
    const sync = () => {
      const next = { gymId: Cookies.get('gym_id') || undefined, userRole: Cookies.get('rol') || undefined }
      setAuth((prev) =>
        prev && prev.gymId === next.gymId && prev.userRole === next.userRole ? prev : next
      )
    }
    sync()
    window.addEventListener('gym-settings-updated', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('gym-settings-updated', sync)
      window.removeEventListener('storage', sync)
    }
  }, [pathname])

  const {
    data: subscriptionData,
    isPending,
    error,
    refetch: queryRefetch,
  } = useQuery<SubscriptionData>({
    queryKey: ['subscription', gymId],
    queryFn: () => fetchGymSubscription(gymId!),
    enabled: !!gymId,
    staleTime: 1000 * 60 * 60, // 1h
    gcTime: 1000 * 60 * 60 * 24, // 24h
    retry: 3, // backend Render free duerme y tarda en despertar, 1 solo intento fallaba en frio
    refetchOnWindowFocus: false,
    // Si quedo en error (cold-start, blip de red) reintenta solo hasta resolver;
    // sin esto el estado "error" queda pegado hasta un refetch manual o remount.
    refetchInterval: (query) => (query.state.error ? 15000 : false),
  })

  // Mientras no leimos cookies, o la query esta pendiente, el estado real es
  // desconocido. Ojo: no alcanza con isLoading (isPending && isFetching) porque
  // una query deshabilitada queda pending pero idle => isLoading false y el
  // consumidor lo leia como "sin plan confirmado".
  const isResolving = auth === null || (!!gymId && isPending)

  // Termino de resolver pero no sabemos: fallo la red / backend en cold-start,
  // o el usuario no tiene gym (owner). No es lo mismo que "confirmado sin plan":
  // sin esto el sidebar bloquea funciones y el modal se abre por las dudas.
  const isUnverified = !isResolving && (!subscriptionData || !gymId)

  const refetch = useCallback(async () => {
    await queryRefetch()
  }, [queryRefetch])


  const hasFeature = useCallback(
    (feature: FeatureKey): boolean | null => {
      if (isResolving) return null
      if (!subscriptionData?.plan) return false
      return subscriptionData.plan[feature] === true
    },
    [subscriptionData, isResolving]
  )

  const maxAlumnos = subscriptionData?.plan?.max_alumnos ?? 0
  const planName = subscriptionData?.plan?.name ?? null
  const isSubscriptionActive =
    !!subscriptionData?.hasSubscription && !!subscriptionData?.isActive

  const daysUntilExpiration = (() => {
    if (!subscriptionData?.subscription?.end_at) return null
    const endStr = subscriptionData.subscription.end_at.slice(0, 10)
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
    // Comparar fechas puras en Argentina (medianoche Argentina) para evitar desfases por timezone
    const endDate = new Date(endStr + 'T00:00:00-03:00')
    const todayDate = new Date(todayStr + 'T00:00:00-03:00')
    const diffTime = endDate.getTime() - todayDate.getTime()
    return Math.round(diffTime / (1000 * 60 * 60 * 24))
  })()

  const isExpiringSoon =
    daysUntilExpiration !== null &&
    daysUntilExpiration <= 7 &&
    daysUntilExpiration >= 0

  const isOwner = userRole === '1'

  const isPaymentWarning = (() => {
    if (isResolving || isUnverified || isOwner) return false
    const today = new Date()
    const dayOfMonth = today.getDate()
    const isInWarningWindow = dayOfMonth >= PAYMENT_WARNING_START_DAY && dayOfMonth < PAYMENT_SUSPENSION_DAY
    const isExpiredOrNoSub = (daysUntilExpiration !== null && daysUntilExpiration < 0) ||
      (!subscriptionData?.hasSubscription && !!gymId)
    return isInWarningWindow && isExpiredOrNoSub
  })()

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionData: subscriptionData ?? null,
        isSubscriptionLoading: isResolving,
        isUnverified,
        error: error ? (error as Error).message : null,
        refetch,
        hasFeature,
        maxAlumnos,
        planName,
        isSubscriptionActive,
        isExpiringSoon,
        daysUntilExpiration,
        isPaymentWarning,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error(
      'useSubscription debe usarse dentro de un SubscriptionProvider'
    )
  }
  return context
}

export const useHasFeature = (feature: FeatureKey) => {
  const { hasFeature, isSubscriptionLoading } = useSubscription()
  return {
    hasAccess: hasFeature(feature),
    loading: isSubscriptionLoading,
  }
}

export const invalidateSubscriptionCache = (
  queryClient: ReturnType<typeof useQueryClient>
) => {
  queryClient.invalidateQueries({ queryKey: ['subscription'] })
}
