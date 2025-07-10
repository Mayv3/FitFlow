export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white text-center bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 px-6">
      <h1 className="text-[120px] font-extrabold leading-none drop-shadow-lg">404</h1>
      <p className="text-2xl font-semibold mt-2 mb-4 drop-shadow-md">
        Uy... no encontramos esta página
      </p>
      <p className="text-md mb-6 max-w-md text-orange-100">
        La dirección que ingresaste no existe o fue eliminada. Por favor verificá la URL o volvé a la página principal.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-white text-orange-700 font-bold rounded-lg shadow hover:bg-orange-100 transition"
      >
        Volver al inicio
      </a>
    </div>
  )
}
