import { useEffect, useState } from "react"
import { auth, db } from "../../firebase/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import styles from "./AdminDashboard.module.css"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [labs, setLabs] = useState([])
  const [staffs, setStaffs] = useState([])
  const [labName, setLabName] = useState("")
  const [capacity, setCapacity] = useState("")
  const [location, setLocation] = useState("")
  const [editLab, setEditLab] = useState(null)
  const [confirmStaff, setConfirmStaff] = useState(null)
  const [confirmLab, setConfirmLab] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        navigate("/admin")
        return
      }

      const snap = await getDoc(doc(db, "users", user.uid))
      if (!snap.exists() || snap.data().role !== "admin") {
        await signOut(auth)
        navigate("/")
        return
      }

      const labSnap = await getDocs(collection(db, "labs"))
      setLabs(labSnap.docs.map(d => ({ id: d.id, ...d.data() })))

      const staffSnap = await getDocs(collection(db, "users"))
      setStaffs(
        staffSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.role === "staff")
      )

      setLoading(false)
    })

    return () => unsub()
  }, [navigate])

  const refreshLabs = async () => {
    const snap = await getDocs(collection(db, "labs"))
    setLabs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const addLab = async () => {
    if (!labName || !capacity || !location) return

    await addDoc(collection(db, "labs"), {
      name: labName,
      capacity,
      location,
      createdAt: serverTimestamp()
    })

    setLabName("")
    setCapacity("")
    setLocation("")
    refreshLabs()
  }

  const saveLab = async () => {
    await updateDoc(doc(db, "labs", editLab.id), {
      capacity: editLab.capacity,
      location: editLab.location
    })
    setEditLab(null)
    refreshLabs()
  }

  const deleteLab = async () => {
    await deleteDoc(doc(db, "labs", confirmLab))
    setConfirmLab(null)
    refreshLabs()
  }

  const assignPrincipal = async id => {
    if (staffs.some(s => s.designation === "principal")) {
      alert("Remove current Principal first")
      return
    }
    await updateDoc(doc(db, "users", id), { designation: "principal" })
    setStaffs(s => s.map(u => u.id === id ? { ...u, designation: "principal" } : u))
  }

  const assignHod = async staff => {
    if (staffs.some(s => s.designation === "hod" && s.department === staff.department)) {
      alert("Remove existing HOD for this department first")
      return
    }
    await updateDoc(doc(db, "users", staff.id), { designation: "hod" })
    setStaffs(s => s.map(u => u.id === staff.id ? { ...u, designation: "hod" } : u))
  }

  const removeDesignation = async id => {
    await updateDoc(doc(db, "users", id), { designation: null })
    setStaffs(s => s.map(u => u.id === id ? { ...u, designation: null } : u))
  }

  const deleteStaff = async () => {
    await deleteDoc(doc(db, "users", confirmStaff))
    setStaffs(s => s.filter(u => u.id !== confirmStaff))
    setConfirmStaff(null)
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  const grouped = staffs.reduce((acc, s) => {
    acc[s.department] = acc[s.department] || []
    acc[s.department].push(s)
    return acc
  }, {})

  return (
    <div className={styles.container}>
      <h1>Admin Dashboard</h1>

      <section className={styles.section}>
        <h2>Add Lab</h2>
        <div className={styles.formRow}>
          <input placeholder="Lab Name" value={labName} onChange={e => setLabName(e.target.value)} />
          <input placeholder="Capacity" value={capacity} onChange={e => setCapacity(e.target.value)} />
          <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          <button onClick={addLab}>Add</button>
        </div>

        <div className={styles.labList}>
          {labs.map(l => (
            <div key={l.id} className={styles.labRow}>
              <div>
                <strong>{l.name}</strong>
                <div>Capacity: {l.capacity}</div>
                <div>Location: {l.location}</div>
              </div>
              <div className={styles.actions}>
                <button onClick={() => setEditLab(l)}>Edit</button>
                <button className={styles.danger} onClick={() => setConfirmLab(l.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {Object.keys(grouped).map(dep => {
        const sorted = [
          ...grouped[dep].filter(s => s.designation),
          ...grouped[dep].filter(s => !s.designation)
        ]

        return (
          <section key={dep} className={styles.section}>
            <h2>{dep}</h2>

            {sorted.map(s => (
              <div key={s.id} className={styles.staffRow}>
                <div>
                  <strong>{s.fullName}</strong>
                  <div>{s.designation ? s.designation.toUpperCase() : "Staff"}</div>
                </div>

                <div className={styles.actions}>
                  {!s.designation && (
                    <>
                      <button onClick={() => assignPrincipal(s.id)}>Make Principal</button>
                      <button onClick={() => assignHod(s)}>Make HOD</button>
                    </>
                  )}

                  {s.designation && (
                    <button onClick={() => removeDesignation(s.id)}>Remove Role</button>
                  )}

                  <button className={styles.danger} onClick={() => setConfirmStaff(s.id)}>Delete</button>
                </div>
              </div>
            ))}
          </section>
        )
      })}

      {confirmStaff && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete Staff</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button onClick={() => setConfirmStaff(null)}>Cancel</button>
              <button className={styles.danger} onClick={deleteStaff}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {confirmLab && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete Lab</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button onClick={() => setConfirmLab(null)}>Cancel</button>
              <button className={styles.danger} onClick={deleteLab}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {editLab && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit Lab</h3>
            <input value={editLab.capacity} onChange={e => setEditLab({ ...editLab, capacity: e.target.value })} />
            <input value={editLab.location} onChange={e => setEditLab({ ...editLab, location: e.target.value })} />
            <div className={styles.modalActions}>
              <button onClick={() => setEditLab(null)}>Cancel</button>
              <button onClick={saveLab}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
