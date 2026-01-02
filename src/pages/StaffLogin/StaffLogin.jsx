import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { auth } from "../../firebase/firebase"
import styles from "./StaffLogin.module.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import logo from "../../assets/logo.svg"
import createIcon from "../../assets/create.svg"

export default function StaffLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const login = async () => {
    setError("")

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/staff/dashboard")
    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Incorrect email or password")
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address")
      } else if (err.code === "auth/user-disabled") {
        setError("This account has been disabled")
      } else {
        setError("Login failed. Please try again")
      }
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async () => {
    setError("")

    if (!email) {
      setError("Enter your email to reset password")
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setError("Password reset link sent to your email")
    } catch {
      setError("Unable to send reset email")
    }
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

        <div className={styles.navAction} onClick={() => navigate("/staff/signup")}>
          <img src={createIcon} />
          <span>Create Account</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.formBox}>
          <div className={styles.heading}>
            <h1>Staff Login</h1>
            <p>Lab Scheduler</p>
          </div>

          <div className={styles.field}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <span
              className={styles.toggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.loginBtn}
            onClick={login}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className={styles.formActions}>
            <span onClick={() => navigate("/staff/signup")}>Create Account</span>
            <span onClick={forgotPassword}>Forgot Password?</span>
          </div>
        </div>
      </main>
    </div>
  )
}
