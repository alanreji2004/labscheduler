import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "../../firebase/firebase"
import styles from "./StudentLogin.module.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import logo from "../../assets/logo.svg"
import createIcon from "../../assets/create.svg"

export default function StudentLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const login = async () => {
    await signInWithEmailAndPassword(auth, email, password)
    navigate("/student/dashboard")
  }

  const createAccount = async () => {
    await createUserWithEmailAndPassword(auth, email, password)
    navigate("/student/dashboard")
  }

  const forgotPassword = async () => {
    await sendPasswordResetEmail(auth, email)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={logo} className={styles.logo} />
          <div className={styles.collegeText}>
            <div className={styles.collegeName}>COLLEGE OF ENGINEERING PERUMON</div>
            <div className={styles.collegeSub}>
              Under the Cooperative Academy of Professional Education (CAPE)<br />
              Established by <span>Govt. of Kerala</span>
            </div>
          </div>
        </div>

        <div className={styles.navAction} onClick={createAccount}>
          <img src={createIcon} />
          <span>Create Account</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.formBox}>
          <div className={styles.heading}>
            <h1>Login</h1>
            <p>Lab Scheduler</p>
          </div>

          <div className={styles.field}>
            <input
              type="email"
              placeholder="Email"
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={e => setPassword(e.target.value)}
            />
            <span
              className={styles.toggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          <button className={styles.loginBtn} onClick={login}>
            Login
          </button>

          <div className={styles.formActions}>
            <span onClick={createAccount}>Create Account</span>
            <span onClick={forgotPassword}>Forgot Password?</span>
          </div>
        </div>
      </main>
    </div>
  )
}
