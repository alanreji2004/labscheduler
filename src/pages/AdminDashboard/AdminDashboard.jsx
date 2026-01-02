import { addDoc, collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, db } from "../../firebase/firebase"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./AdminDashboard.module.css"

export default function AdminDashboard() {
  const [labs, setLabs] = useState([])
  const [requests, setRequests] = useState([])
  const [labName, setLabName] = useState("")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) {
        navigate("/admin")
        return
      }

      const snap = await getDoc(doc(db, "users", user.uid))

      if (!snap.exists()) {
        await signOut(auth)
        navigate("/")
        return
      }

      const role = snap.data().role

      if (role !== "admin") {
        if (role === "student") navigate("/student/dashboard")
        else if (role === "staff") navigate("/staff/dashboard")
        else navigate("/")
        return
      }

      const labsSnap = await getDocs(collection(db, "labs"))
      setLabs(labsSnap.docs.map(d => ({ id: d.id, ...d.data() })))

      const reqSnap = await getDocs(collection(db, "requests"))
      setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() })))

      setLoading(false)
    })

    return () => unsubscribe()
  }, [navigate])

  const addLab = async () => {
    if (!labName.trim()) return
    await addDoc(collection(db, "labs"), { name: labName })
    setLabName("")
    const s = await getDocs(collection(db, "labs"))
    setLabs(s.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const approve = async id => {
    await updateDoc(doc(db, "requests", id), { status: "approved" })
    setRequests(r => r.map(x => x.id === id ? { ...x, status: "approved" } : x))
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <h2>Admin Panel</h2>

      <div className={styles.addLab}>
        <input
          placeholder="Lab Name"
          value={labName}
          onChange={e => setLabName(e.target.value)}
        />
        <button onClick={addLab}>Add Lab</button>
      </div>

      <h3>Requests</h3>

      {requests.length === 0 && <p>No requests</p>}

      {requests.map(r => (
        <div key={r.id} className={styles.request}>
          <div>
            <strong>{r.purpose}</strong>
            <div>Status: {r.status || "pending"}</div>
          </div>
          {r.status !== "approved" && (
            <button onClick={() => approve(r.id)}>Approve</button>
          )}
        </div>
      ))}
    </div>
  )
}
