import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";

interface PlanSelectProps {
  tipoPlan: string;
  setTipoPlan: (value: string) => void;
}

export function PlanSelect({ tipoPlan, setTipoPlan }: PlanSelectProps) {
  return (
    <div className=" mb-2">
      <Select value={tipoPlan} onValueChange={setTipoPlan}>
        <SelectTrigger className="w-full bg-zinc-900 text-white border-zinc-700">
          <SelectValue placeholder="Seleccionar plan" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 text-white border-zinc-700">
          <SelectItem value="TODOS">Todos</SelectItem>
          <SelectItem value="GIMNASIO">Gimnasio</SelectItem>
          <SelectItem value="CLASE">Clase</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
