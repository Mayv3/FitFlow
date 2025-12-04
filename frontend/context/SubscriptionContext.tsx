'use client'
import { createContext, useContext, useCallback, ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import Cookies from "js-cookie"

interface GymPlan {
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

interface SubscriptionContextType {
  subscriptionData: SubscriptionData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  hasFeature: (feature: keyof Omit<GymPlan, 'id' | 'name' | 'max_alumnos' | 'created_at' | 'updated_at'>) => boolean
  maxAlumnos: number
  planName: string | null
  isSubscriptionActive: boolean
  isExpiringSoon: boolean
  daysUntilExpiration: number | null
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

const fetchGymSubscription = async (gymId: string): Promise<SubscriptionData> => {
  const token = Cookies.get("token")
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/suscriptions/gym/${gymId}/plan`,
    { headers }
  )
  return data
}

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const gymId = Cookies.get("gym_id")

  const { data: subscriptionData, isLoading, error, refetch: queryRefetch } = useQuery<SubscriptionData>({
    queryKey: ['subscription', gymId],
    queryFn: () => fetchGymSubscription(gymId!),
    enabled: !!gymId,
    staleTime: 1000 * 60 * 60, // 1 hora - no refetch si los datos tienen menos de 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas en cache
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const refetch = useCallback(async () => {
    await queryRefetch()
  }, [queryRefetch])

  const hasFeature = useCallback((feature: keyof Omit<GymPlan, 'id' | 'name' | 'max_alumnos' | 'created_at' | 'updated_at'>): boolean => {
    if (!subscriptionData?.plan) return false
    return subscriptionData.plan[feature] === true
  }, [subscriptionData])

  const maxAlumnos = subscriptionData?.plan?.max_alumnos ?? 0
  const planName = subscriptionData?.plan?.name ?? null
  const isSubscriptionActive = subscriptionData?.hasSubscription && subscriptionData?.isActive

  const daysUntilExpiration = (() => {
    if (!subscriptionData?.subscription?.end_at) return null
    const endDate = new Date(subscriptionData.subscription.end_at)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  })()

  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration > 0

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionData: subscriptionData ?? null,
        loading: isLoading,
        error: error ? (error as Error).message : null,
        refetch,
        hasFeature,
        maxAlumnos,
        planName,
        isSubscriptionActive: !!isSubscriptionActive,
        isExpiringSoon,
        daysUntilExpiration
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription debe usarse dentro de un SubscriptionProvider')
  }
  return context
}

export const useHasFeature = (feature: keyof Omit<GymPlan, 'id' | 'name' | 'max_alumnos' | 'created_at' | 'updated_at'>) => {
  const { hasFeature, loading } = useSubscription()
  return { hasAccess: hasFeature(feature), loading }
}


export const invalidateSubscriptionCache = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['subscription'] })
}
