"use client"

import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import { FormEnterToTab } from "@/components/FormEnterToTab";

const LoginPage = () => {
  const [dni, setDni] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false)
  const router = useRouter();
  const { setUser } = useUser();

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setErrorMessage("");

    if (!dni.trim()) {
      setErrorMessage("Por favor ingresá un DNI válido.");
      return;
    }
    try {
      setLoading(true)
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/roles/${dni}`);
      const data = res.data;

      Cookies.set("dni", data.dni);
      Cookies.set("nombre", data.nombre);
      Cookies.set("rol", data.rol);

      setUser(data);

      if (data.rol === "Administrador") {
        router.push("/dashboard/administrator");
      } else if (data.rol === "Recepcionista") {
        router.push("/dashboard/receptionist");
      } else {
        router.push("/dashboard/member");
      }
      setLoading(false)
    } catch (error) {
      console.error("Error en login:", error);
      setErrorMessage("No se pudo encontrar un usuario con ese DNI.");
      setLoading(false)
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-orange-600 via-orange-500 to-orange-600 p-4 w-full">
      <div className="bg-zinc-900 bg-opacity-90 p-10 rounded-2xl shadow-xl w-full max-w-sm flex flex-col justify-center items-center">
        <Image
          src="/gymspace-titulo.png"
          alt="Logo"
          width={380}
          height={60}
          className="mb-6"
        />
        <FormEnterToTab>
          <input
            type="number"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="Ej: 34023002"
            className="
            bg-white text-black
            placeholder:text-zinc-400
            focus:outline-none focus:ring-2 focus:ring-orange-500 
            p-3 w-full rounded-lg mb-4 transition
          "
          />
          <button
            disabled={loading}
            onClick={handleLogin}
            type="submit"
            className="
            w-full bg-orange-500 hover:bg-orange-600 
            text-white py-3 rounded-lg 
            transition
          "
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          {errorMessage && (
            <p className="text-red-400 mt-4 text-sm text-center font-medium">
              {errorMessage}
            </p>
          )}
        </FormEnterToTab>
      </div>
    </div>
  );
};

export default LoginPage;
