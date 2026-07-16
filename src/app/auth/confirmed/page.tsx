import Link from "next/link";
import styles from "../auth.module.css";

export default function ConfirmedPage() {
  return (
    <main className={styles.authPage}>
      <section className={`${styles.authCard} ${styles.confirmedCard}`}>
        <div className={`${styles.logoMark} ${styles.successMark}`}>✓</div>
        <p className={styles.eyebrow}>NO BUDGET PLAN</p>
        <h1>Email confirmed</h1>
        <p className={styles.subtitle}>Your account is ready. Welcome to a calmer way to manage your money.</p>

        <div className={styles.infoList}>
          <div><span>✓</span><p><strong>50 / 30 / 20 guidance</strong><br />See how your income is split between needs, wants, and savings.</p></div>
          <div><span>✓</span><p><strong>Private by design</strong><br />Your budget belongs to your account and is protected from other users.</p></div>
          <div><span>✓</span><p><strong>Available everywhere</strong><br />Your transactions sync securely between your phone and computer.</p></div>
          <div><span>✓</span><p><strong>No bank connection</strong><br />You enter your own information. No bank passwords or payment details are requested.</p></div>
        </div>

        <Link className={styles.primaryLink} href="/">Continue to my budget</Link>
        <p className={styles.note}>You can export or delete your budget data from the app at any time.</p>
      </section>
    </main>
  );
}
