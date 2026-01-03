import { useParams, useNavigate } from "react-router-dom"
import { auth, db } from "../../firebase/firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where
} from "firebase/firestore"
import { useEffect, useState } from "react"
import styles from "./LabDetails.module.css"
import logo from "../../assets/logo.svg"
import profileIcon from "../../assets/profile.svg"

export default function LabDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [studentName, setStudentName] = useState("")
  const [admissionNumber, setAdmissionNumber] = useState("")
  const [department, setDepartment] = useState("")
  const [lab, setLab] = useState(null)

  const [staffs, setStaffs] = useState([])
  const [selectedStaff, setSelectedStaff] = useState("")

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [baseMonth] = useState(new Date())

  const [dates, setDates] = useState([{ date: "", time: "" }])
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)

  const [bookedSlots, setBookedSlots] = useState({})

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        navigate("/login")
        return
      }

      const userSnap = await getDoc(doc(db, "users", user.uid))
      if (userSnap.exists()) {
        setStudentName(userSnap.data().fullName)
        setAdmissionNumber(userSnap.data().admissionNumber)
      }

      const labSnap = await getDoc(doc(db, "labs", id))
      if (labSnap.exists()) setLab(labSnap.data())

      const staffQuery = query(
        collection(db, "users"),
        where("role", "==", "staff")
      )
      const staffSnap = await getDocs(staffQuery)
      setStaffs(
        staffSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(s => s.designation !== "principal")
      )

      const slotQuery = query(
        collection(db, "labSlots"),
        where("labId", "==", id)
      )
      const slotSnap = await getDocs(slotQuery)

      const slotMap = {}
      slotSnap.docs.forEach(d => {
        const { date, time } = d.data()
        if (!slotMap[date]) slotMap[date] = []
        slotMap[date].push(time)
      })
      setBookedSlots(slotMap)

      setLoading(false)
    })

    return () => unsub()
  }, [id, navigate])

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const canGoBack =
    currentMonth.getFullYear() > baseMonth.getFullYear() ||
    currentMonth.getMonth() > baseMonth.getMonth()

  const nextMonth = () => {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() + 1)
    setCurrentMonth(d)
  }

  const prevMonth = () => {
    if (!canGoBack) return
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() - 1)
    setCurrentMonth(d)
  }

  const addDateRow = () => {
    setDates(d => [...d, { date: "", time: "" }])
  }

  const updateDate = (i, field, value) => {
    setDates(d => d.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)))
  }

  const submitRequest = async () => {
    if (
      !subject ||
      !description ||
      !department ||
      !selectedStaff ||
      dates.some(d => !d.date || !d.time)
    ) return

    const staff = staffs.find(s => s.id === selectedStaff)

    await addDoc(collection(db, "requests"), {
      labId: id,
      labName: lab.name,
      labLocation: lab.location,
      studentId: auth.currentUser.uid,
      studentName,
      admissionNumber,
      department,
      staffId: staff.id,
      staffName: staff.fullName,
      subject,
      description,
      slots: dates,
      status: "pending",
      createdAt: serverTimestamp()
    })

    setSubject("")
    setDescription("")
    setDates([{ date: "", time: "" }])
    setSelectedStaff("")
    alert("Request submitted successfully")
  }

  const getDateStatus = dateStr => {
    const slots = bookedSlots[dateStr] || []
    if (slots.includes("FULL")) return "full"
    if (slots.length > 0) return "partial"
    return ""
  }

  if (loading || !lab) return <div className={styles.loading}>Loading...</div>

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

        <div className={styles.profile} onClick={() => navigate("/profile")}>
          <span>{studentName}</span>
          <img src={profileIcon} />
        </div>
      </header>

      <main className={styles.main}>
        <h1>{lab.name}</h1>
        <p className={styles.labMeta}>
          Capacity: {lab.capacity} | Location : {lab.location}
        </p>

        <section className={styles.calendar}>
          <div className={styles.monthHeader}>
            <button className={!canGoBack ? styles.disabled : ""} onClick={prevMonth}>‹</button>
            <h3>
              {currentMonth.toLocaleString("default", { month: "long" })}{" "}
              {currentMonth.getFullYear()}
            </h3>
            <button onClick={nextMonth}>›</button>
          </div>

          <div className={styles.grid}>
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
              const status = getDateStatus(dateStr)
              return (
                <div key={i} className={`${styles.day} ${styles[status]}`}>
                  {i + 1}
                  {status && (
                    <div className={styles.tooltip}>
                      {(bookedSlots[dateStr] || []).join(", ")}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className={styles.form}>
          <h2>Request Lab</h2>

          <input value={studentName} disabled />
          <input value={admissionNumber} disabled />

          <select value={department} onChange={e => setDepartment(e.target.value)}>
            <option value="">Select Department</option>
            <option value="Computer Science and Engineering">Computer Science and Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
            <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
            <option value="Artificial Intelligence and Data Science Engineering">Artificial Intelligence and Data Science Engineering</option>
          </select>

          <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
            <option value="">Select Tutor</option>
            {staffs.filter(s => s.department === department).map(s => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>

          <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

          {dates.map((d, i) => (
            <div key={i} className={styles.row}>
              <input type="date" value={d.date} onChange={e => updateDate(i, "date", e.target.value)} />
              <select value={d.time} onChange={e => updateDate(i, "time", e.target.value)}>
                <option value="">Time</option>
                <option value="FN">Forenoon</option>
                <option value="AN">Afternoon</option>
                <option value="FULL">Full Day</option>
              </select>
            </div>
          ))}

          <button className={styles.add} onClick={addDateRow}>Add Date</button>
          <button className={styles.submit} onClick={submitRequest}>Submit Request</button>
        </section>
      </main>
    </div>
  )
}
