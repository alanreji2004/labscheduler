import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../../firebase/firebase"
import styles from "./AdminLogin.module.css"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const login = async () => {
    await signInWithEmailAndPassword(auth, email, password)
    navigate("/admin/dashboard")
  }

  return (
    <div className={styles.container}>
      <h2>Admin Login</h2>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
    </div>
  )
}
