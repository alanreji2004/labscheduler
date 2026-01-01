import { collection, getDocs } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import styles from "./StudentDashboard.module.css"

export default function StudentDashboard() {
  const [labs, setLabs] = useState([])

  useEffect(() => {
    getDocs(collection(db, "labs")).then(snapshot =>
      setLabs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [])

  return (
    <div className={styles.container}>
      <h2>Available Labs</h2>
      {labs.map(lab => (
        <Link key={lab.id} to={`/lab/${lab.id}`} className={styles.lab}>
          {lab.name}
        </Link>
      ))}
    </div>
  )
}
