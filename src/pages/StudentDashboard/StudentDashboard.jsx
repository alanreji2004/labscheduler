import { collection, getDocs } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import styles from "./StudentDashboard.module.css"

export default function StudentDashboard() {
  return (
    <div className={styles.container}>
      <h2>Available Labs</h2>
    </div>
  )
}
