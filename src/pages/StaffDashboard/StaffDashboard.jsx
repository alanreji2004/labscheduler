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
  addDoc,
  doc,
  serverTimestamp
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
  const [conflict, setConflict] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        navigate("/login")
        return
      }

      const userSnap = await getDocs(
        query(collection(db, "users"), where("__name__", "==", user.uid))
      )

      if (userSnap.empty) return

      const staffData = userSnap.docs[0].data()
      setStaff(staffData)

      let q

      if (staffData.designation === "principal") {
        q = query(
          collection(db, "requests"),
          where("status", "==", "forwarded_to_principal"),
          orderBy("createdAt", "desc")
        )
      } else if (staffData.designation === "hod") {
        q = query(
          collection(db, "requests"),
          where("department", "==", staffData.department),
          orderBy("createdAt", "desc")
        )
      } else {
        q = query(
          collection(db, "requests"),
          where("staffId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        )
      }

      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      if (staffData.designation === "principal") {
        setPending(data)
        setApproved([])
      } else if (staffData.designation === "hod") {
        setPending(data.filter(r => r.status === "forwarded_to_hod"))
        setApproved(data.filter(r => r.status !== "forwarded_to_hod"))
      } else {
        setPending(data.filter(r => r.status === "pending"))
        setApproved(data.filter(r => r.status !== "pending"))
      }
    })

    return () => unsub()
  }, [navigate])

  const checkConflicts = async request => {
    const slotQuery = query(
      collection(db, "labSlots"),
      where("labId", "==", request.labId)
    )

    const snap = await getDocs(slotQuery)

    for (const docSnap of snap.docs) {
      const slot = docSnap.data()
      for (const rSlot of request.slots) {
        if (
          slot.date === rSlot.date &&
          (slot.time === "FULL" ||
            rSlot.time === "FULL" ||
            slot.time === rSlot.time)
        ) {
          return { date: rSlot.date, time: rSlot.time }
        }
      }
    }
    return null
  }

  const updateStatus = useCallback(async status => {
    if (!active || !staff) return

    if (staff.designation === "principal" && status === "approved") {
      const conflictResult = await checkConflicts(active)
      if (conflictResult) {
        setConflict(conflictResult)
        return
      }

      for (const s of active.slots) {
        await addDoc(collection(db, "labSlots"), {
          labId: active.labId,
          labName: active.labName,
          date: s.date,
          time: s.time,
          requestId: active.id,
          createdAt: serverTimestamp()
        })
      }
    }

    const updateData =
      staff.designation === "principal"
        ? {
            status,
            principalRemarks: remark,
            principalId: auth.currentUser.uid,
            principalName: staff.fullName
          }
        : staff.designation === "hod"
        ? {
            status,
            hodRemarks: remark,
            hodId: auth.currentUser.uid,
            hodName: staff.fullName
          }
        : {
            status,
            tutorRemarks: remark,
            staffName: staff.fullName
          }

    await updateDoc(doc(db, "requests", active.id), updateData)

    setPending(p => p.filter(r => r.id !== active.id))
    setApproved(a => [{ ...active, status }, ...a])
    setActive(null)
    setRemark("")
    setConflict(null)
  }, [active, remark, staff])

  const formatTime = ts =>
    ts?.seconds ? new Date(ts.seconds * 1000).toLocaleString() : ""

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
                  setRemark("")
                  setConflict(null)
                }}
              >
                Open Ticket
              </button>
            </div>
          ))}
        </section>

        {approved.length > 0 && (
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
        )}
      </main>

      {active && (
        <div className={styles.overlay} onClick={() => setActive(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.close} onClick={() => setActive(null)}>×</button>

            <div className={styles.modalContent}>
              <h3>{active.subject}</h3>

              <div className={styles.detail}>
                <span>Student</span>
                <p>{active.studentName}</p>
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
                <span>Approval Trail</span>
                {active.status !== "pending" && active.staffName && (
                  <p>Approved by Tutor: {active.staffName}</p>
                )}
                {(active.status === "forwarded_to_principal" || active.status === "approved") &&
                  active.hodName && <p>Approved by HOD: {active.hodName}</p>}
                {active.status === "approved" && active.principalName && (
                  <p>Approved by Principal: {active.principalName}</p>
                )}
              </div>

              {conflict && (
                <div className={styles.detail}>
                  <span style={{ color: "red" }}>Slot Already Booked</span>
                  <p>{conflict.date} · {conflict.time}</p>
                </div>
              )}

              <textarea
                placeholder={
                  staff.designation === "principal"
                    ? "Type Principal remarks"
                    : staff.designation === "hod"
                    ? "Type HOD remarks"
                    : "Type tutor remarks"
                }
                value={remark}
                onChange={e => setRemark(e.target.value)}
              />

              <div className={styles.actions}>
                <button onClick={() => updateStatus("sent_back")}>
                  Send Back
                </button>

                {staff.designation === "principal" ? (
                  <button
                    className={styles.forward}
                    onClick={() => updateStatus("approved")}
                  >
                    Approve
                  </button>
                ) : (
                  <button
                    className={styles.forward}
                    onClick={() =>
                      updateStatus(
                        staff.designation === "hod"
                          ? "forwarded_to_principal"
                          : "forwarded_to_hod"
                      )
                    }
                  >
                    Forward
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
