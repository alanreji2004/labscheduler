import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../../firebase/firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore"
import styles from "./StaffDashboard.module.css"
import logo from "../../assets/logo.svg"
import profileIcon from "../../assets/profile.svg"

export default function StaffDashboard() {
  const navigate = useNavigate()
  const [staff, setStaff] = useState(null)
  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])
  const [active, setActive] = useState(null)
  const [remark, setRemark] = useState("")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        navigate("/login")
        return
      }

      const userSnap = await getDocs(
        query(collection(db, "users"), where("__name__", "==", user.uid))
      )

      if (!userSnap.empty) setStaff(userSnap.docs[0].data())

      const q = query(
        collection(db, "requests"),
        where("staffId", "==", user.uid),
        orderBy("createdAt", "desc")
      )

      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      setPending(data.filter(r => r.status === "pending"))
      setApproved(data.filter(r => r.status !== "pending"))
    })

    return () => unsub()
  }, [navigate])

  const updateStatus = useCallback(async status => {
    if (!active) return

    await updateDoc(doc(db, "requests", active.id), {
      status,
      tutorRemarks: remark
    })

    setPending(p => p.filter(r => r.id !== active.id))
    setApproved(a => [{ ...active, status }, ...a])
    setActive(null)
    setRemark("")
  }, [active, remark])

  const formatTime = ts =>
    ts?.seconds
      ? new Date(ts.seconds * 1000).toLocaleString()
      : ""

  if (!staff) return <div className={styles.loading}>Loading...</div>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={logo} className={styles.logo} />
          <div>
            <div className={styles.collegeName}>COLLEGE OF ENGINEERING PERUMON</div>
            <div className={styles.collegeSub}>
              Under the Cooperative Academy of Professional Education (CAPE)<br />
              Established by <span>Govt. of Kerala</span>
            </div>
          </div>
        </div>

        <div className={styles.profile} onClick={() => navigate("/staff/profile")}>
          <span>{staff.fullName}</span>
          <img src={profileIcon} />
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <h2>Pending Requests</h2>

          {pending.map(r => (
            <div key={r.id} className={styles.card}>
              <div className={styles.meta}>
                <strong>{r.studentName}</strong>
                <span>{r.subject}</span>
              </div>

              <div className={styles.time}>
                Sent on {formatTime(r.createdAt)}
              </div>

              <button
                className={styles.open}
                onClick={() => {
                  setActive(r)
                  setRemark(r.tutorRemarks || "")
                }}
              >
                Open Ticket
              </button>
            </div>
          ))}
        </section>

        <section className={styles.section}>
          <h2>Approved / Forwarded</h2>

          {approved.map(r => (
            <div key={r.id} className={styles.cardMuted}>
              <div className={styles.meta}>
                <strong>{r.studentName}</strong>
                <span>{r.subject}</span>
              </div>
              <div className={styles.status}>
                {r.status.replaceAll("_", " ")}
              </div>
            </div>
          ))}
        </section>
      </main>

      {active && (
        <div className={styles.overlay} onClick={() => setActive(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.close} onClick={() => setActive(null)}>×</button>

            <h3>{active.subject}</h3>

            <div className={styles.detail}>
              <span>Student</span>
              <p>{active.studentName}</p>
            </div>

            <div className={styles.detail}>
              <span>Department</span>
              <p>{active.department}</p>
            </div>

            <div className={styles.detail}>
              <span>Description</span>
              <p>{active.description}</p>
            </div>

            <div className={styles.detail}>
              <span>Requested Slots</span>
              {active.slots.map((s, i) => (
                <p key={i}>{s.date} · {s.time}</p>
              ))}
            </div>

            <div className={styles.detail}>
              <span>Request Sent</span>
              <p>{formatTime(active.createdAt)}</p>
            </div>

            <textarea
              placeholder="Type tutor remarks"
              value={remark}
              onChange={e => setRemark(e.target.value)}
            />

            <div className={styles.actions}>
              <button onClick={() => updateStatus("sent_back")}>
                Send Back
              </button>
              <button
                className={styles.forward}
                onClick={() => updateStatus("forwarded_to_hod")}
              >
                Forward to HOD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
