import type { TooltipContentProps, TooltipPayloadEntry } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'

/**
 * Props que recharts pasa al `content` custom de un `<Tooltip>`. Van parciales
 * porque recharts solo manda `active`/`payload` cuando hay un punto activo.
 */
export type ChartTooltipProps = Partial<TooltipContentProps<ValueType, NameType>>

/** Una serie dentro del `payload` del tooltip. */
export type ChartTooltipEntry = TooltipPayloadEntry<ValueType, NameType>
