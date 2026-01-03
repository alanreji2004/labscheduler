import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../firebase/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import styles from "./StudentDashboard.module.css"
import logo from "../../assets/logo.svg"
import profileIcon from "../../assets/profile.svg"

export default function StudentDashboard() {
  const [labs, setLabs] = useState([])
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        navigate("/login")
        return
      }

      const userSnap = await getDoc(doc(db, "users", user.uid))
      if (userSnap.exists()) {
        setUserName(userSnap.data().fullName)
      }

      const snap = await getDocs(collection(db, "labs"))
      setLabs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return () => unsub()
  }, [navigate])

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
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

        <div className={styles.profile} onClick={() => navigate("/student/profile")}>
          <span>{userName}</span>
          <img src={profileIcon} />
        </div>
      </header>

      <main className={styles.container}>
        <h2>Available Labs</h2>

        {labs.length === 0 && <p>No labs available</p>}

        <div className={styles.labGrid}>
          {labs.map(lab => (
            <Link
              key={lab.id}
              to={`/lab/${lab.id}`}
              className={styles.labCard}
            >
              <h3>{lab.name}</h3>
              <p>Capacity: {lab.capacity}</p>
              <p>Location: {lab.location}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
