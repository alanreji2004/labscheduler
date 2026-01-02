import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebase/firebase"
import styles from "./StaffSignup.module.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import logo from "../../assets/logo.svg"
import loginIcon from "../../assets/login.svg"

export default function StaffSignup() {
  const [staffId, setStaffId] = useState("")
  const [fullName, setFullName] = useState("")
  const [department, setDepartment] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const signup = async () => {
    setError("")

    if (!staffId || !fullName || !department || !email || !password || !confirmPassword) {
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
        staffId,
        fullName,
        department,
        email,
        role: "staff",
        createdAt: serverTimestamp()
      })

      navigate("/staff/login")
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

        <div className={styles.navAction} onClick={() => navigate("/staff/login")}>
          <img src={loginIcon} />
          <span>Login</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.formBox}>
          <div className={styles.heading}>
            <h1>Staff Signup</h1>
            <p>Lab Scheduler</p>
          </div>

          <div className={styles.field}>
            <input
              placeholder="Staff ID"
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
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
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
            >
              <option value="">Select Department</option>
              <option>Computer Science and Engineering</option>
              <option>Mechanical Engineering</option>
              <option>Electrical and Electronics Engineering</option>
              <option>Electronics and Communication Engineering</option>
              <option>Electronics and Computer Science Engineering</option>
              <option>Artificial Intelligence and Data Science Engineering</option>
            </select>
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
            <span onClick={() => navigate("/staff/login")}>Already have an account? Login</span>
          </div>
        </div>
      </main>
    </div>
  )
}
