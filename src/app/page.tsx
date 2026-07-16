"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import { createClient } from "../lib/supabase/client";

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

// Interface Definitions
interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  date: string;
}

interface Budget {
  category: string;
  limit: number;
}
interface Note {
  id: string;
  text: string;
  date: string;
  done: boolean;
}

// Categories list
const CATEGORIES = [
  "Housing & Rent",
  "Food & Dining",
  "Transportation",
  "Entertainment",
  "Utilities & Bills",
  "Shopping",
  "Salary & Income",
  "Miscellaneous",
];

// Color mapping for categories (curated premium palette)
const CATEGORY_COLORS: { [key: string]: string } = {
  "Housing & Rent": "#6366f1",    // Indigo
  "Food & Dining": "#f59e0b",     // Amber
  "Transportation": "#06b6d4",    // Cyan
  "Entertainment": "#ec4899",     // Pink
  "Utilities & Bills": "#14b8a6", // Teal
  "Shopping": "#8b5cf6",          // Violet
  "Salary & Income": "#10b981",   // Emerald
  "Miscellaneous": "#64748b",     // Slate
};

const DEFAULT_BUDGETS: Budget[] = [
  { category: "Housing & Rent", limit: 1200 },
  { category: "Food & Dining", limit: 400 },
  { category: "Transportation", limit: 150 },
  { category: "Entertainment", limit: 200 },
  { category: "Utilities & Bills", limit: 250 },
  { category: "Shopping", limit: 300 },
  { category: "Miscellaneous", limit: 150 },
];

const formatCurrency = (value: number, currency = "EUR", language = "en", fractionDigits = 2) =>
  new Intl.NumberFormat(language === "tr" ? "tr-TR" : "de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

const PLAN_GROUPS = [
  {
    key: "needs",
    label: "Needs",
    description: "Housing, food, transport & bills",
    percentage: 50,
    categories: ["Housing & Rent", "Food & Dining", "Transportation", "Utilities & Bills"],
    color: "#6366f1",
  },
  {
    key: "wants",
    label: "Wants",
    description: "Entertainment, shopping & extras",
    percentage: 30,
    categories: ["Entertainment", "Shopping", "Miscellaneous"],
    color: "#ec4899",
  },
  {
    key: "savings",
    label: "Savings",
    description: "Your 20% future fund",
    percentage: 20,
    categories: [],
    color: "#10b981",
  },
] as const;

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [cloudReady, setCloudReady] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [language, setLanguage] = useState<"en" | "tr">("en");
  const [currency, setCurrency] = useState<"EUR" | "TRY">("EUR");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteDate, setNoteDate] = useState("");
  
  // Form State
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[1]); // Food
  const [type, setType] = useState<"income" | "expense">("expense");
  const [date, setDate] = useState("");
  
  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Hydration safety check
  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem("no_budget_plan_language");
    const savedCurrency = localStorage.getItem("no_budget_plan_currency");
    if (savedLanguage === "tr" || savedLanguage === "en") setLanguage(savedLanguage);
    if (savedCurrency === "EUR" || savedCurrency === "TRY") setCurrency(savedCurrency);
    if (supabaseConfigured) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
          window.location.href = "/auth";
          return;
        }
        setUserEmail(data.user.email || "");
        setUserId(data.user.id);
        supabase.from("budget_data").select("transactions, budgets, notes").eq("user_id", data.user.id).maybeSingle().then(({ data: budgetData, error }) => {
          if (error) setSyncError("Could not load your synced budget. Try refreshing.");
          if (budgetData) {
            setTransactions(Array.isArray(budgetData.transactions) ? budgetData.transactions as Transaction[] : []);
            setBudgets(Array.isArray(budgetData.budgets) ? budgetData.budgets as Budget[] : DEFAULT_BUDGETS);
            setNotes(Array.isArray(budgetData.notes) ? budgetData.notes as Note[] : []);
          }
          setCloudReady(true);
        });
        setAuthChecked(true);
      });
    } else {
      setAuthChecked(true);
      setCloudReady(true);
    }
    const storedTx = localStorage.getItem("no_budget_plan_transactions") || localStorage.getItem("gravity_transactions");
    const storedBudgets = localStorage.getItem("no_budget_plan_budgets") || localStorage.getItem("gravity_budgets");
    
    if (storedTx) {
      try {
        setTransactions(JSON.parse(storedTx));
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    }
    
    if (storedBudgets) {
      try {
        setBudgets(JSON.parse(storedBudgets));
      } catch (e) {
        console.error("Failed to parse budgets", e);
      }
    }

    // Default current date
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  const formatMoney = (value: number, fractionDigits = 2) => formatCurrency(value, currency, language, fractionDigits);
  const copy = language === "tr" ? {
    income: "Gelir", expenses: "Harcamalar", balance: "Bakiye", plan: "50 / 30 / 20 planı", add: "Bir şey ekle", addIncome: "gelir", addExpense: "harcama", activity: "Hareketlerin", spendingGuide: "Harcama rehberin", moneyIn: "Gelen para", moneyOut: "Giden para", leftToUse: "Kullanılabilir", language: "Dil", currency: "Para birimi", signOut: "Çıkış yap", save: "Kaydet", intro: "Birkaç dokunuşla tamam.", description: "Açıklama", amount: "Tutar", date: "Tarih", category: "Kategori", whereMoneyGoes: "Paran nereye gidiyor", used: "kullanıldı", of: " / ", remaining: "kaldı", over: "hedef aşıldı", addIncomePrompt: "Gelir ekleyince hedeflerin hazır", noTransactions: "Henüz hareket yok", moneyStory: "Hazır olduğunda ilkini ekle", quickActions: "Hızlı işlemler", entry: "kayıt", entries: "kayıt", search: "Açıklamada ara...", allTypes: "Tüm türler", allCategories: "Tüm kategoriler", delete: "Kaydı sil", exampleIncome: "ör. Aylık maaş", exampleExpense: "ör. Kahve, kira, market", notes: "Notlar ve hatırlatıcılar", notePlaceholder: "Örn. Kira ödemesi", addNote: "Not ekle", noNotes: "Henüz not yok", done: "Tamamlandı"
  } : {
    income: "Income", expenses: "Expenses", balance: "Balance", plan: "50 / 30 / 20 plan", add: "Add something", addIncome: "income", addExpense: "expense", activity: "Your activity", spendingGuide: "Your spending guide", moneyIn: "Money coming in", moneyOut: "Money going out", leftToUse: "Left to use", language: "Language", currency: "Currency", signOut: "Sign out", save: "Save", intro: "Just a few taps.", description: "Description", amount: "Amount", date: "Date", category: "Category", whereMoneyGoes: "Where your money goes", used: "used", of: " of ", remaining: "remaining", over: "over target", addIncomePrompt: "Add income and your targets are ready", noTransactions: "Nothing here yet", moneyStory: "Your first one can go here", quickActions: "Quick actions", entry: "entry", entries: "entries", search: "Search description...", allTypes: "All types", allCategories: "All categories", delete: "Delete entry", exampleIncome: "e.g. Monthly salary", exampleExpense: "e.g. Coffee, rent, groceries", notes: "Notes & reminders", notePlaceholder: "e.g. Pay rent", addNote: "Add note", noNotes: "No notes yet", done: "Done"
  };

  // Save to local storage when state changes
  useEffect(() => {
    if (mounted && cloudReady && !supabaseConfigured) {
      localStorage.setItem("no_budget_plan_transactions", JSON.stringify(transactions));
    }
  }, [transactions, mounted, cloudReady]);

  useEffect(() => {
    if (mounted && cloudReady && !supabaseConfigured) {
      localStorage.setItem("no_budget_plan_budgets", JSON.stringify(budgets));
    }
  }, [budgets, mounted, cloudReady]);

  useEffect(() => {
    if (!mounted || !cloudReady || !supabaseConfigured || !userId) return;
    const timeout = window.setTimeout(() => {
      createClient().from("budget_data").upsert({
        user_id: userId,
        transactions,
        budgets,
        notes,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" }).then(({ error }) => {
        if (error) setSyncError("Your change could not sync. Please try again.");
        else setSyncError("");
      });
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [transactions, budgets, notes, mounted, cloudReady, userId]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("no_budget_plan_language", language);
      localStorage.setItem("no_budget_plan_currency", currency);
    }
  }, [language, currency, mounted]);

  if (!mounted) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Initializing dashboard...</p>
        </div>
      </div>
    );
  }

  if (!supabaseConfigured) {
    return (
      <div className={styles.container}>
        <div className={`${styles.glassPanel} ${styles.emptyState}`}>
          <h2>Supabase setup required</h2>
          <p>Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel, then reload.</p>
        </div>
      </div>
    );
  }

  if (!authChecked) {
    return <div className={styles.container}><div className={styles.emptyState}><p>Checking your secure session…</p></div></div>;
  }

  if (!cloudReady) {
    return <div className={styles.container}><div className={styles.emptyState}><p>Loading your synced budget…</p></div></div>;
  }

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    window.location.href = "/auth";
  };

  // Action handlers
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert("Please enter a valid description and a positive amount.");
      return;
    }

    const newTx: Transaction = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      description: description.trim(),
      amount: parseFloat(amount),
      category: type === "income" ? "Salary & Income" : category,
      type,
      date: date || new Date().toISOString().split("T")[0],
    };

    setTransactions([newTx, ...transactions]);
    
    // Reset Form (keep date and type for consecutive entries if needed, or reset standard)
    setDescription("");
    setAmount("");
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      setTransactions(transactions.filter((tx) => tx.id !== id));
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNotes([{ id: Date.now().toString(36), text: noteText.trim(), date: noteDate, done: false }, ...notes]);
    setNoteText("");
    setNoteDate("");
  };

  // Export data as JSON
  const handleExportData = () => {
    const backupData = {
      transactions,
      budgets,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `no_budget_plan_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && Array.isArray(parsed.transactions)) {
            setTransactions(parsed.transactions);
            if (parsed.budgets) setBudgets(parsed.budgets);
            alert("Backup imported successfully!");
          } else {
            alert("Invalid backup file structure.");
          }
        } catch (err) {
          alert("Error parsing backup JSON file.");
        }
      };
    }
  };

  // Financial Calculations
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  // Filtered transactions list
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || tx.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  // Calculate expenses by category
  const categoryTotals: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const planTotal = totalIncome;
  const planGroups = PLAN_GROUPS.map((group) => {
    const spent = group.key === "savings"
      ? Math.max(netBalance, 0)
      : group.categories.reduce((sum, name) => sum + (categoryTotals[name] || 0), 0);
    const target = planTotal * group.percentage / 100;
    return { ...group, spent, target, remaining: target - spent };
  });

  // Calculate coordinates for custom SVG Donut Chart
  const renderDonutChart = () => {
    const expenseData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || "#64748b",
    }));

    if (expenseData.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>{copy.noTransactions}</p>
          <small>{copy.intro}</small>
        </div>
      );
    }

    const total = expenseData.reduce((sum, d) => sum + d.value, 0);
    let accumulatedAngle = 0;
    const size = 180;
    const center = size / 2;
    const radius = 65;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * radius;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={strokeWidth}
        />
        {expenseData.map((d, i) => {
          const percentage = d.value / total;
          const strokeLength = percentage * circumference;
          const strokeOffset = circumference - (percentage * circumference) + (accumulatedAngle * circumference);
          
          const angleStart = accumulatedAngle * 360;
          accumulatedAngle -= percentage;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
              strokeDashoffset={strokeOffset}
              transform={`rotate(-90 ${center} ${center})`}
              style={{
                transition: "stroke-dashoffset 0.5s ease-in-out",
                cursor: "pointer",
              }}
            >
              <title>{`${d.name}: ${formatMoney(d.value)}`}</title>
            </circle>
          );
        })}
        <text
          x={center}
          y={center - 5}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="10px"
          fontWeight="600"
          style={{ letterSpacing: "0.05em" }}
        >
          TOTAL SPENT
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize="15px"
          fontWeight="700"
        >
          {formatMoney(totalExpenses)}
        </text>
      </svg>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header Area */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>No Budget Plan</h1>
          <p>Your money, made easy.</p>
        </div>
        <div className={styles.actions}>
          <span className={styles.userBadge}>{userEmail}</span>
          <label className={styles.settingControl}>{copy.language}
            <select value={language} onChange={(event) => setLanguage(event.target.value as "en" | "tr")}>
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
            </select>
          </label>
          <label className={styles.settingControl}>{copy.currency}
            <select value={currency} onChange={(event) => setCurrency(event.target.value as "EUR" | "TRY")}>
              <option value="EUR">€ EUR</option>
              <option value="TRY">₺ TRY</option>
            </select>
          </label>
          <button className={styles.iconButton} onClick={handleSignOut}>{copy.signOut}</button>
          <button className={styles.iconButton} onClick={handleExportData}>
            <span>📤</span> Export
          </button>
          <label className={styles.iconButton} style={{ cursor: "pointer" }}>
            <span>📥</span> Import
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportData} 
              style={{ display: "none" }} 
            />
          </label>
        </div>
      </header>

      <section className={styles.balanceHero}>
        <div>
          <span className={styles.heroEyebrow}>{copy.balance}</span>
          <strong className={styles.heroAmount}>
            {netBalance < 0 ? "-" : ""}{formatMoney(Math.abs(netBalance))}
          </strong>
          <span className={styles.heroHint}>{copy.leftToUse}</span>
        </div>
        <div className={styles.heroSparkles} aria-hidden="true">✦</div>
      </section>

      {/* Main KPI Summaries */}
      <section className={styles.summaryGrid}>
        <div className={`${styles.glassPanel} ${styles.card} ${styles.incomeCard}`}>
            <span className={styles.cardLabel}>{copy.income}</span>
          <h2 className={styles.cardValue} style={{ color: "var(--success)" }}>
            +{formatMoney(totalIncome)}
          </h2>
          <span className={styles.cardMeta}>{copy.moneyIn}</span>
        </div>
        <div className={`${styles.glassPanel} ${styles.card} ${styles.expenseCard}`}>
            <span className={styles.cardLabel}>{copy.expenses}</span>
          <h2 className={styles.cardValue} style={{ color: "var(--danger)" }}>
            -{formatMoney(totalExpenses)}
          </h2>
          <span className={styles.cardMeta}>{copy.moneyOut}</span>
        </div>
      </section>

      {/* 50/30/20 planning guide */}
      <section className={`${styles.glassPanel} ${styles.planPanel}`}>
        <div className={styles.planHeading}>
          <div>
            <h3 className={styles.panelTitle}>{copy.plan}</h3>
            <p className={styles.planIntro}>{copy.intro}</p>
          </div>
          <span className={styles.planIncome}>{formatMoney(planTotal, 0)} {copy.income}</span>
        </div>
        <div className={styles.planGrid}>
          {planGroups.map((group) => {
            const progress = group.target > 0 ? Math.min((group.spent / group.target) * 100, 100) : 0;
            return (
              <div className={styles.planItem} key={group.key}>
                <div className={styles.planItemTop}>
                  <div className={styles.planLabelWrap}>
                    <span className={styles.planDot} style={{ backgroundColor: group.color }} />
                    <strong>{group.label}</strong>
                  </div>
                  <strong>{group.percentage}%</strong>
                </div>
                <p>{group.description}</p>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBar} style={{ width: `${progress}%`, backgroundColor: group.color }} />
                </div>
                <div className={styles.planNumbers}>
                  <span>{formatMoney(group.spent, 0)} {copy.used}</span>
                  <span>{copy.of}{formatMoney(group.target, 0)}</span>
                </div>
                <small className={group.remaining < 0 ? styles.planOver : styles.planRemaining}>
                  {planTotal === 0 ? copy.addIncomePrompt : group.remaining >= 0 ? `${formatMoney(group.remaining, 0)} ${copy.remaining}` : `${formatMoney(Math.abs(group.remaining), 0)} ${copy.over}`}
                </small>
              </div>
            );
          })}
        </div>
      </section>

      {syncError && <div className={styles.syncError} role="alert">⚠ {syncError}</div>}

      <section className={styles.quickActions} aria-label={copy.quickActions}>
        <a className={`${styles.quickAction} ${styles.quickExpense}`} href="#logger" onClick={() => setType("expense")}>
          <span className={styles.quickIcon}>−</span>
          <span><strong>{copy.addExpense.charAt(0).toUpperCase() + copy.addExpense.slice(1)}</strong><small>{copy.expenses}</small></span>
        </a>
        <a className={`${styles.quickAction} ${styles.quickIncome}`} href="#logger" onClick={() => setType("income")}>
          <span className={styles.quickIcon}>+</span>
          <span><strong>{copy.addIncome.charAt(0).toUpperCase() + copy.addIncome.slice(1)}</strong><small>{copy.income}</small></span>
        </a>
      </section>

      {/* Layout Split */}
      <main className={styles.mainLayout}>
        {/* Left Column: Logger and Category Visualizers */}
        <div className={styles.leftColumn}>
          {/* Logger Panel */}
          <section id="logger" className={styles.glassPanel}>
            <h3 className={styles.panelTitle}>{copy.add}</h3>
            <p className={styles.panelIntro}>{copy.intro}</p>
            <form onSubmit={handleAddTransaction} className={styles.form}>
              <div className={styles.inputGroup}>
                  <button
                  type="button"
                  onClick={() => setType("expense")}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 600,
                    background: type === "expense" ? "var(--danger)" : "rgba(255,255,255,0.03)",
                    border: type === "expense" ? "none" : "1px solid var(--border)",
                    color: type === "expense" ? "white" : "var(--text-secondary)",
                  }}
                >
                  {copy.expenses}
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 600,
                    background: type === "income" ? "var(--success)" : "rgba(255,255,255,0.03)",
                    border: type === "income" ? "none" : "1px solid var(--border)",
                    color: type === "income" ? "white" : "var(--text-secondary)",
                  }}
                >
                  {copy.income}
                </button>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">{copy.description}</label>
                <input
                  id="description"
                  type="text"
                  placeholder={type === "income" ? copy.exampleIncome : copy.exampleExpense}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.formGroup}>
                  <label htmlFor="amount">{copy.amount} ({currency})</label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="date">{copy.date}</label>
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {type === "expense" && (
                <div className={styles.formGroup}>
                  <label htmlFor="category">{copy.category}</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.filter(cat => cat !== "Salary & Income").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" className={styles.submitBtn}>
                {copy.save} {type === "income" ? copy.addIncome : copy.addExpense}
              </button>
            </form>
          </section>

          {/* SVG Doughnut Chart Card */}
          <section className={styles.glassPanel}>
            <h3 className={styles.panelTitle}>{copy.whereMoneyGoes}</h3>
            <div className={styles.chartBox}>
              {renderDonutChart()}
            </div>
            {Object.keys(categoryTotals).length > 0 && (
              <div className={styles.chartLegend}>
                {Object.entries(categoryTotals).map(([name, val]) => (
                  <div key={name} className={styles.legendItem}>
                    <div 
                      className={styles.legendColor} 
                      style={{ backgroundColor: CATEGORY_COLORS[name] || "#64748b" }}
                    />
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {name}: <strong>{formatMoney(val, 0)}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Budgets progress & transaction list */}
        <div className={styles.rightColumn}>
          <section className={styles.glassPanel}>
            <h3 className={styles.panelTitle}>📝 {copy.notes}</h3>
            <form onSubmit={handleAddNote} className={styles.noteForm}>
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={copy.notePlaceholder} aria-label={copy.notePlaceholder} />
              <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} aria-label={copy.date} />
              <button type="submit" className={styles.noteButton}>{copy.addNote}</button>
            </form>
            <div className={styles.notesList}>
              {notes.length === 0 ? <small className={styles.noteEmpty}>{copy.noNotes}</small> : notes.map((note) => (
                <div className={`${styles.noteItem} ${note.done ? styles.noteDone : ""}`} key={note.id}>
                  <label><input type="checkbox" checked={note.done} onChange={() => setNotes(notes.map((item) => item.id === note.id ? { ...item, done: !item.done } : item))} /><span>{note.text}</span></label>
                  <small>{note.date || copy.done}</small>
                </div>
              ))}
            </div>
          </section>
          {/* Budget progress bars */}
          <section className={styles.glassPanel}>
            <h3 className={styles.panelTitle}>{copy.spendingGuide}</h3>
            <div className={styles.budgetTracker}>
              {budgets.map((b) => {
                const spent = categoryTotals[b.category] || 0;
                const percent = Math.min((spent / b.limit) * 100, 100);
                
                let progressClass = styles.successProgress;
                if (percent > 90) {
                  progressClass = styles.dangerProgress;
                } else if (percent > 70) {
                  progressClass = styles.warningProgress;
                }

                return (
                  <div key={b.category} className={styles.budgetItem}>
                    <div className={styles.budgetHeader}>
                      <span>{b.category}</span>
                      <span>
                        <strong>{formatMoney(spent, 0)}</strong> / {formatMoney(b.limit, 0)} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className={styles.progressBarContainer}>
                      <div 
                        className={`${styles.progressBar} ${progressClass}`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* History tracker */}
          <section className={styles.glassPanel}>
            <div className={styles.panelTitle}>
              <span>{copy.activity}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "normal" }}>
                {filteredTransactions.length} {filteredTransactions.length === 1 ? copy.entry : copy.entries}
              </span>
            </div>

            {/* List filters */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder={copy.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, minWidth: "150px" }}
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                style={{ width: "110px" }}
              >
                <option value="all">{copy.allTypes}</option>
                <option value="income">{copy.income}</option>
                <option value="expense">{copy.expenses}</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: "140px" }}
              >
                <option value="all">{copy.allCategories}</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.listContainer}>
              {filteredTransactions.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>{copy.noTransactions}</p>
                  <small>{copy.moneyStory}</small>
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div key={tx.id} className={styles.txItem}>
                    <div className={styles.txDetails}>
                      <span className={styles.txDesc}>{tx.description}</span>
                      <div className={styles.txMeta}>
                        <span>{tx.date}</span>
                        <span className={styles.categoryTag} style={{ borderColor: CATEGORY_COLORS[tx.category], borderLeft: `2px solid ${CATEGORY_COLORS[tx.category]}` }}>
                          {tx.category}
                        </span>
                      </div>
                    </div>
                    <div className={styles.txRight}>
                      <span className={`${styles.txAmount} ${tx.type === "income" ? styles.incomeAmount : styles.expenseAmount}`}>
                        {tx.type === "income" ? "+" : "-"}{formatMoney(tx.amount)}
                      </span>
                      <button 
                        onClick={() => handleDeleteTransaction(tx.id)} 
                        className={styles.deleteBtn}
                        title={copy.delete}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
