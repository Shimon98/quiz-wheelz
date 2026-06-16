
import { motion } from 'framer-motion'

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl"
      >
        <div className="mb-6 text-6xl" aria-hidden="true">
          🏎️
        </div>

        <h1 className="text-4xl font-black text-slate-900">
          Quiz<span className="text-sky-500">Wheelz</span>
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          עונים על שאלות, צוברים נקודות ומתקדמים במרוץ.
        </p>

        <button
          type="button"
          className="mt-8 rounded-xl bg-sky-500 px-6 py-3 font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200"
        >
          מתחילים
        </button>
      </motion.section>
    </main>
  )
}

export default App
