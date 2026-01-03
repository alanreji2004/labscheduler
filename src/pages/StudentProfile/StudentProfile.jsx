import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../../firebase/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore"
import { jsPDF } from "jspdf"
import styles from "./StudentProfile.module.css"
import logo from "../../assets/logo.svg"
import logoutIcon from "../../assets/logout.svg"

export default function StudentProfile() {
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [requests, setRequests] = useState([])
  const [activeTab, setActiveTab] = useState("pending")
  const [activeRequest, setActiveRequest] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        navigate("/login")
        return
      }

      const userSnap = await getDocs(
        query(collection(db, "users"), where("__name__", "==", user.uid))
      )
      if (!userSnap.empty) setStudent(userSnap.docs[0].data())

      const reqQuery = query(
        collection(db, "requests"),
        where("studentId", "==", user.uid)
      )
      const reqSnap = await getDocs(reqQuery)
      setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => unsub()
  }, [navigate])

  const logout = async () => {
    await signOut(auth)
    navigate("/login")
  }

  const formatTime = ts =>
    ts?.seconds ? new Date(ts.seconds * 1000).toLocaleString() : ""

  const deleteRequest = async r => {
    if (r.status === "approved by principal") return
    await deleteDoc(doc(db, "requests", r.id))
    setRequests(req => req.filter(x => x.id !== r.id))
    setActiveRequest(null)
  }

  const svgToPng = async src => {
    const svg = await fetch(src).then(r => r.text())
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        ctx.globalAlpha = 0.035
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL("image/png"))
      }
      img.src = url
    })
  }

  const downloadPDF = async r => {
    const pdf = new jsPDF()
    const watermark = await svgToPng(logo)

    pdf.addImage(watermark, "PNG", 35, 65, 140, 140)

    pdf.setTextColor(0)
    pdf.setFontSize(10)
    pdf.text(`Reference No: CEP/LAB/${r.id.slice(0, 8).toUpperCase()}`, 105, 14, { align: "center" })

    pdf.setFontSize(16)
    pdf.text("COLLEGE OF ENGINEERING PERUMON", 105, 22, { align: "center" })
    pdf.setFontSize(11)
    pdf.text(
      "Under the Cooperative Academy of Professional Education (CAPE)",
      105,
      30,
      { align: "center" }
    )

    let y = 46
    pdf.setFontSize(12)

    pdf.text("To", 20, y)
    y += 8
    pdf.text("The Principal", 20, y)
    y += 8
    pdf.text("College of Engineering Perumon", 20, y)

    y += 14
    pdf.text("From", 20, y)
    y += 7
    pdf.text(student.fullName, 20, y)
    y += 5
    pdf.text(student.department || "", 20, y)
    y += 5
    pdf.text(student.admissionNumber, 20, y)

    y += 14
    pdf.text("Subject", 20, y)
    y += 7
    pdf.text(r.subject, 20, y)

    y += 14
    pdf.text("Description", 20, y)
    y += 7
    pdf.text(r.description || "", 20, y, { maxWidth: 170 })

    y += 28
    pdf.text("Requested Date & Time", 20, y)
    y += 7
    r.slots.forEach(s => {
      pdf.text(`${s.date} - ${s.time}`, 20, y)
      y += 6
    })

    y += 12
    pdf.text("Approvals", 20, y)
    y += 9

    if (r.tutorRemarks) {
      pdf.text("Tutor Approval", 20, y)
      y += 6
      pdf.text(`Name: ${r.staffName || ""}`, 20, y)
      y += 5
      pdf.text(`Remarks: ${r.tutorRemarks}`, 20, y, { maxWidth: 170 })
      y += 9
    }

    if (r.hodRemarks) {
      pdf.text("HOD Approval", 20, y)
      y += 6
      pdf.text(`Name: ${r.hodName || ""}`, 20, y)
      y += 5
      pdf.text(`Remarks: ${r.hodRemarks}`, 20, y, { maxWidth: 170 })
      y += 9
    }

    if (r.principalRemarks) {
      pdf.text("Principal Approval", 20, y)
      y += 6
      pdf.text(`Name: ${r.principalName || ""}`, 20, y)
      y += 5
      pdf.text(`Remarks: ${r.principalRemarks}`, 20, y, { maxWidth: 170 })
    }

    pdf.save(`${r.subject}.pdf`)
  }

  const filtered = status => {
    if (status === "approved") {
      return requests.filter(r => r.status === "approved by principal")
    }
    if (status === "rejected") {
      return requests.filter(r => r.status === "sent_back")
    }
    return requests.filter(
      r =>
        r.status !== "approved by principal" &&
        r.status !== "sent_back"
    )
  }

  if (!student) return <div className={styles.loading}>Loading...</div>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={logo} className={styles.logo} />
          <div>
            <div className={styles.collegeName}>COLLEGE OF ENGINEERING PERUMON</div>
            <div className={styles.collegeSub}>
              Under the Cooperative Academy of Professional Education (CAPE)
            </div>
          </div>
        </div>

        <button className={styles.logout} onClick={logout}>
          <img src={logoutIcon} />
          Logout
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.profileCard}>
          <h2>{student.fullName}</h2>
          <p style={{ marginTop: 2 }}>{student.admissionNumber}</p>
        </div>

        <div className={styles.tabs}>
          <button className={activeTab === "pending" ? styles.active : ""} onClick={() => setActiveTab("pending")}>
            Requests
          </button>
          <button className={activeTab === "approved" ? styles.active : ""} onClick={() => setActiveTab("approved")}>
            Approved
          </button>
          <button className={activeTab === "rejected" ? styles.active : ""} onClick={() => setActiveTab("rejected")}>
            Rejected
          </button>
        </div>

        <div className={styles.list}>
          {filtered(activeTab).map(r => (
            <div key={r.id} className={styles.card}>
              <div>
                <strong>{r.subject}</strong>
                <p>{formatTime(r.createdAt)}</p>
              </div>
              <div className={styles.actions}>
                <button onClick={() => setActiveRequest(r)}>View</button>
                {r.status === "approved by principal" && (
                  <button onClick={() => downloadPDF(r)}>Download</button>
                )}
                {r.status !== "approved by principal" && (
                  <button onClick={() => deleteRequest(r)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {activeRequest && (
        <div className={styles.overlay} onClick={() => setActiveRequest(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{activeRequest.subject}</h3>
            <p>Status: {activeRequest.status.replaceAll("_", " ")}</p>
            {activeRequest.tutorRemarks && <p>Tutor: {activeRequest.tutorRemarks}</p>}
            {activeRequest.hodRemarks && <p>HOD: {activeRequest.hodRemarks}</p>}
            {activeRequest.principalRemarks && <p>Principal: {activeRequest.principalRemarks}</p>}
            <button onClick={() => setActiveRequest(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
