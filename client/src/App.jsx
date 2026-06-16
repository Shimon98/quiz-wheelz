
import { motion } from 'framer-motion'
import Button from "./components/ui/Button.jsx";
import TextInput from "./components/ui/TextInput.jsx";

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-6">

        <TextInput
        type="password"
        />
        <Button

            disabled={false}
            children={"לחץ"}/>


    </main>
  )
}

export default App
