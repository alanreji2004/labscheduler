import { Link, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../../firebase/firebase"
import styles from "./Navbar.module.css"

export default function Navbar({ role }) {
  const navigate = useNavigate()

  const logout = async () => {
    await signOut(auth)
    navigate(role === "admin" ? "/admin" : "/")
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        LabScheduler
      </div>

      <div className={styles.links}>
        {role === "student" && (
          <>
            <Link to="/student/dashboard">Labs</Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link to="/admin/dashboard">Dashboard</Link>
          </>
        )}

        <button onClick={logout} className={styles.logout}>
          Logout
        </button>
      </div>
    </nav>
  )
}
