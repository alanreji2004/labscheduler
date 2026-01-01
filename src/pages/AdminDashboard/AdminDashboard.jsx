import { addDoc, collection, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import { useEffect, useState } from "react"
import styles from "./AdminDashboard.module.css"

export default function AdminDashboard() {
  const [labs, setLabs] = useState([])
  const [requests, setRequests] = useState([])
  const [labName, setLabName] = useState("")

  useEffect(() => {
    getDocs(collection(db, "labs")).then(s =>
      setLabs(s.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    getDocs(collection(db, "requests")).then(s =>
      setRequests(s.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [])

  const addLab = async () => {
    await addDoc(collection(db, "labs"), { name: labName })
  }

  const approve = async id => {
    await updateDoc(doc(db, "requests", id), { status: "approved" })
  }

  return (
    <div className={styles.container}>
      <h2>Admin Panel</h2>
      <input placeholder="Lab Name" onChange={e => setLabName(e.target.value)} />
      <button onClick={addLab}>Add Lab</button>

      <h3>Requests</h3>
      {requests.map(r => (
        <div key={r.id} className={styles.request}>
          <span>{r.purpose}</span>
          <button onClick={() => approve(r.id)}>Approve</button>
        </div>
      ))}
    </div>
  )
}
