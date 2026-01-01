import { useParams } from "react-router-dom"
import { addDoc, collection, getDocs, query, where } from "firebase/firestore"
import { db, auth } from "../../firebase/firebase"
import { useEffect, useState } from "react"
import styles from "./LabDetails.module.css"

export default function LabDetails() {
  const { id } = useParams()
  const [slots, setSlots] = useState([])
  const [purpose, setPurpose] = useState("")

  useEffect(() => {
    getDocs(query(collection(db, "labSlots"), where("labId", "==", id)))
      .then(s => setSlots(s.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  const requestLab = async slot => {
    await addDoc(collection(db, "requests"), {
      labId: id,
      userId: auth.currentUser.uid,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      purpose,
      status: "pending"
    })
  }

  return (
    <div className={styles.container}>
      <h2>Available Slots</h2>
      <input placeholder="Purpose" onChange={e => setPurpose(e.target.value)} />
      {slots.filter(s => s.status === "available").map(slot => (
        <button key={slot.id} onClick={() => requestLab(slot)}>
          {slot.date} {slot.startTime}-{slot.endTime}
        </button>
      ))}
    </div>
  )
}
