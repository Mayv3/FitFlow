'use client'

import { createContext, useContext, useCallback, useEffect, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, usePathname } from 'next/navigation'
import axios from 'axios'
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

type FeatureKey = keyof Omit<
  GymPlan,
  'id' | 'name' | 'max_alumnos' | 'created_at' | 'updated_at'
>

interface SubscriptionContextType {
  subscriptionData: SubscriptionData | null
  isSubscriptionLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  hasFeature: (feature: FeatureKey) => boolean | null
  maxAlumnos: number
  planName: string | null
  isSubscriptionActive: boolean
  isExpiringSoon: boolean
  daysUntilExpiration: number | null
  isSuspended: boolean
  isPaymentWarning: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
)

const fetchGymSubscription = async (gymId: string): Promise<SubscriptionData> => {
  const token = Cookies.get('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/suscriptions/gym/${gymId}/plan`,
    { headers }
  )

  return data
}


const SUSPENDED_PATH = '/dashboard/suspended'
const PAYMENT_WARNING_START_DAY = 10
const PAYMENT_SUSPENSION_DAY = 16

export const SubscriptionProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const gymId = Cookies.get('gym_id')
  const userRole = Cookies.get('rol')

  const {
    data: subscriptionData,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery<SubscriptionData>({
    queryKey: ['subscription', gymId],
    queryFn: () => fetchGymSubscription(gymId!),
    enabled: !!gymId,
    staleTime: 1000 * 60 * 60, // 1h
    gcTime: 1000 * 60 * 60 * 24, // 24h
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const refetch = useCallback(async () => {
    await queryRefetch()
  }, [queryRefetch])


  const hasFeature = useCallback(
    (feature: FeatureKey): boolean | null => {
      if (isLoading) return null
      if (!subscriptionData?.plan) return false
      return subscriptionData.plan[feature] === true
    },
    [subscriptionData, isLoading]
  )

  const maxAlumnos = subscriptionData?.plan?.max_alumnos ?? 0
  const planName = subscriptionData?.plan?.name ?? null
  const isSubscriptionActive =
    !!subscriptionData?.hasSubscription && !!subscriptionData?.isActive

  const daysUntilExpiration = (() => {
    if (!subscriptionData?.subscription?.end_at) return null
    const endDate = new Date(subscriptionData.subscription.end_at)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  })()

  const isExpiringSoon =
    daysUntilExpiration !== null &&
    daysUntilExpiration <= 7 &&
    daysUntilExpiration > 0

  const isOwner = userRole === '1'

  // Aviso de pago: del día 10 al 15 si la suscripción está vencida (no aplica a owners)
  const isPaymentWarning = (() => {
    if (isLoading || isOwner) return false
    const today = new Date()
    const dayOfMonth = today.getDate()
    const isInWarningWindow = dayOfMonth >= PAYMENT_WARNING_START_DAY && dayOfMonth < PAYMENT_SUSPENSION_DAY
    const isExpiredOrNoSub = (daysUntilExpiration !== null && daysUntilExpiration < 0) ||
      (!subscriptionData?.hasSubscription && !!gymId)
    return isInWarningWindow && isExpiredOrNoSub
  })()

  // Suspendido: a partir del día 16 si no pagó (no aplica a owners)
  const isSuspended = (() => {
    if (isLoading || isOwner) return false
    const today = new Date()
    const dayOfMonth = today.getDate()
    const isPastSuspensionDay = dayOfMonth >= PAYMENT_SUSPENSION_DAY

    // Sin suscripción y hay gym_id → si pasó el día 15, suspendido
    if (!subscriptionData?.hasSubscription && !!gymId) {
      return isPastSuspensionDay
    }
    // Suscripción vencida y pasó el día 15 del mes → suspendido
    if (daysUntilExpiration !== null && daysUntilExpiration < 0 && isPastSuspensionDay) {
      return true
    }
    return false
  })()

  // Redirigir automáticamente si está suspendido
  useEffect(() => {
    if (!isLoading && isSuspended && pathname !== SUSPENDED_PATH) {
      router.replace(SUSPENDED_PATH)
    }
  }, [isLoading, isSuspended, pathname, router])

  // Si está suspendido y navega a cualquier ruta que NO sea /dashboard/suspended, bloquear
  useEffect(() => {
    if (!isLoading && isSuspended && pathname !== SUSPENDED_PATH && pathname?.startsWith('/dashboard')) {
      router.replace(SUSPENDED_PATH)
    }
  }, [pathname, isLoading, isSuspended, router])

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionData: subscriptionData ?? null,
        isSubscriptionLoading: isLoading,
        error: error ? (error as Error).message : null,
        refetch,
        hasFeature,
        maxAlumnos,
        planName,
        isSubscriptionActive,
        isExpiringSoon,
        daysUntilExpiration,
        isSuspended,
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
