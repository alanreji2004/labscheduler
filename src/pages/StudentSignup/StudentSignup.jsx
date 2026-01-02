import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebase/firebase"
import styles from "./StudentSignup.module.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import logo from "../../assets/logo.svg"
import loginIcon from "../../assets/login.svg"

export default function StudentSignup() {
  const [admissionNumber, setAdmissionNumber] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const signup = async () => {
    setError("")

    if (!admissionNumber || !fullName || !email || !password || !confirmPassword) {
      setError("All fields are required")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setLoading(true)

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      await setDoc(doc(db, "users", uid), {
        admissionNumber,
        fullName,
        email,
        role: "student",
        createdAt: serverTimestamp()
      })

      navigate("/")
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use")
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address")
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters")
      } else {
        setError("Unable to create account. Try again")
      }
    } finally {
      setLoading(false)
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

        <div className={styles.navAction} onClick={() => navigate("/")}>
          <img src={loginIcon} />
          <span>Login</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.formBox}>
          <div className={styles.heading}>
            <h1>Student Signup</h1>
            <p>Lab Scheduler</p>
          </div>

          <div className={styles.field}>
            <input
              placeholder="Admission Number"
              value={admissionNumber}
              onChange={e => setAdmissionNumber(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <input
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
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
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={styles.signupBtn}
            onClick={signup}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className={styles.formActions}>
            <span onClick={() => navigate("/")}>Already have an account? Login</span>
          </div>
        </div>
      </main>
    </div>
  )
}
