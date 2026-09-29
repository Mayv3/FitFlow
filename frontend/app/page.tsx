import type { Metadata } from "next";
import Landing from "../components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Fitness Flow · Software para gimnasios",
  description:
    "Alumnos, pagos, clases, turnos y asistencias en un mismo sistema, con avisos de vencimiento automáticos por WhatsApp.",
};

export default function Page() {
  return <Landing />;
}
