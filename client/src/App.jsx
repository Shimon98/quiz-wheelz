
import { motion } from 'framer-motion'
import Button from "./components/ui/Button.jsx";
import TextInput from "./components/ui/TextInput.jsx";
import PageBackground from "./components/layout/PageBackground.jsx";
import FormError from "./components/ui/FormError.jsx";
import AuthCard from "./components/auth/AuthCard.jsx";
import AppLogo from "./components/brand/AppLogo.jsx";


function App() {
  return (
      <PageBackground variant="teacher">
          <AppLogo variant="teacher" />
          <AuthCard>
              <TextInput label="שם משתמש" placeholder="teacher1" />

              <div className="mt-4">
                  <TextInput label="סיסמה" type="password" placeholder="123456" />
              </div>

              <div className="mt-6">
                  <Button>התחברות</Button>
              </div>

              <FormError message="שם המשתמש או הסיסמה אינם נכונים" />
          </AuthCard>
      </PageBackground>

  )
}

export default App
