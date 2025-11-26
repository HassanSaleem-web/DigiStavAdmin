import { useEffect, useState } from "react";
import axios from "axios";
import "./admin.css"; // optional theme file

// =====================
// CONFIG — change this
// =====================
const API_BASE = "https://builder-authbackend-yne2.onrender.com"; // <-- UPDATE THIS

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export default function App() {
  // SECTION STATE
  const [section, setSection] = useState("dashboard");

  // DATA
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  const [docs, setDocs] = useState([]);
  const [chat, setChat] = useState([]);

  // INPUTS
  const [deductAmount, setDeductAmount] = useState("");

  // =====================
  // LOAD CURRENT USER
  // =====================
  async function loadUser() {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch user");
    }
  }
// =====================
// LOAD ALL USERS (ADMIN)
// =====================
async function loadAllUsers() {
  try {
    const res = await api.get("/api/auth/users");
    setAllUsers(res.data);
  } catch (err) {
    console.error("Failed to load all users", err);
  }
}

  // =====================
  // LOAD DOCUMENTS
  // =====================
  async function loadDocs() {
    try {
      const res = await api.get("/api/documents");
      setDocs(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  // =====================
  // LOAD LAST 10 CHATS
  // =====================
  async function loadChat() {
    try {
      const res = await api.get("/api/chat/last");
      setChat(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  }
  // 🗑️ ADMIN: Delete a user completely
// =====================
// DELETE USER (FRONTEND)
// =====================
async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    await api.delete(`/api/auth/user/${id}`);
    await loadAllUsers();   // refresh list
  } catch (err) {
    console.error("Failed to delete user:", err);
    alert("Failed to delete user");
  }
}


  // =====================
  // DEDUCT CREDITS
  // =====================
  async function handleDeduct() {
    if (!deductAmount) return alert("Enter amount");
    try {
      const res = await api.put("/api/auth/deduct-credits", {
        userId: user._id,
        amount: Number(deductAmount),
      });
      alert("Credits updated: " + res.data.creditsLeft);
      await loadUser();
    } catch (err) {
      console.error(err);
      alert("Failed to deduct credits");
    }
  }
  async function updateUser(id, newCredits, newPlan) {
    try {
      const body = {};
      if (newCredits !== undefined) body.creditsLeft = newCredits;
      if (newPlan !== undefined) body.subscription = newPlan;
  
      const res = await api.put(`api/auth/admin/user/${id}/update`, body);
  
      alert("User updated!");
      loadAllUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to update user.");
    }
  }
  
  // =====================
  // DELETE DOCUMENT
  // =====================
  async function deleteDoc(id) {
    if (!confirm("Delete this document?")) return;
    try {
      await api.delete(`/api/documents/${id}`);
      loadDocs();
    } catch (err) {
      console.error(err);
      alert("Failed to delete document");
    }
  }

  useEffect(() => {
    
    loadAllUsers();  // <-- NEW
  }, []);
  
  return (
    <div className="admin-container">

      {/* ==========================
          SIDEBAR
      =========================== */}
      <aside className="sidebar">
        <h2 className="brand">DigiStav | Admin</h2>

        <nav>
          <button className={section === "dashboard" ? "active" : ""} onClick={() => setSection("dashboard")}>📊 Dashboard</button>
          <button className={section === "users" ? "active" : ""} onClick={() => setSection("users")}>👥 Users</button>
          <button className={section === "documents" ? "active" : ""} onClick={() => setSection("documents")}>📂 Documents</button>
          <button className={section === "chat" ? "active" : ""} onClick={() => setSection("chat")}>💬 Chat</button>
          <button className={section === "settings" ? "active" : ""} onClick={() => setSection("settings")}>⚙️ Settings</button>
        </nav>
      </aside>

      {/* ==========================
          MAIN CONTENT
      =========================== */}
      <main className="content">

        {/* --------------------------
            DASHBOARD
        --------------------------- */}
        {section === "dashboard" && (
          <div>
            <h1>Dashboard</h1>

            {user && (
              <div className="card">
                <p><strong>Logged in as:</strong> {user.email}</p>
                <p><strong>Plan:</strong> {user.subscription}</p>
                <p><strong>Credits:</strong> {user.creditsLeft}</p>
              </div>
            )}

<div className="stats-row">
  <div className="stat-card">
    Total Users: {allUsers.length}
  </div>
  <div className="stat-card">
    Total Chats: {
      allUsers.reduce(
        (sum, u) => sum + (u.chat?.last10?.length || 0),
        0
      )
    }
  </div>
  <div className="stat-card">
    Subscriptions:
    <ul>
      <li>free: {allUsers.filter(u => u.subscription === "free").length}</li>
      <li>Starter: {allUsers.filter(u => u.subscription === "starter").length}</li>
      <li>Best Value: {allUsers.filter(u => u.subscription === "Best Value").length}</li>
      <li>Most Popular: {allUsers.filter(u => u.subscription === "Most Popular").length}</li>
    </ul>
  </div>
</div>

          </div>
        )}

        {/* --------------------------
            USERS
        --------------------------- */}
     {section === "users" && (
  <div>
    <h1>User Management</h1>

    {allUsers.length === 0 && <p>Loading users...</p>}

    {allUsers.map((u, index) => (
      <details key={u._id} className="user-card">
        <summary>
          <strong>{index + 1}. {u.username || u.email}</strong>
          <span>({u.subscription})</span>
        </summary>

        <div className="user-card-body">
  <p><strong>Email:</strong> {u.email}</p>
  <p><strong>Subscription:</strong> {u.subscription}</p>
  <p><strong>Credits:</strong> {u.creditsLeft}</p>
  <p><strong>Chats:</strong> {u.chat?.last10?.length || 0}</p>

  {/* Update credits */}
  <input
    type="number"
    placeholder="New credits"
    onChange={(e) => u._newCredits = e.target.value}
  />

  {/* Update plan */}
  <select onChange={(e) => u._newPlan = e.target.value}>
    <option value="">Select plan</option>
    <option value="free">Free</option>
    <option value="starter">Starter</option>
    <option value="Best Value">Best Value</option>
    <option value="Most Popular">Most Popular</option>
  </select>

  <button
    className="primary"
    onClick={() => updateUser(u._id, u._newCredits, u._newPlan)}
  >
    Update User
  </button>

  <button 
    className="danger"
    onClick={() => deleteUser(u._id)}
  >
    Delete User
  </button>
</div>
      </details>
    ))}
  </div>
)}

        {/* --------------------------
            DOCUMENTS
        --------------------------- */}
        {section === "documents" && (
          <div>
            <h1>Documents</h1>

            <table className="doc-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc._id}>
                    <td><a href={doc.url} target="_blank">{doc.originalName}</a></td>
                    <td>{doc.mimeType}</td>
                    <td>{doc.createdAt.slice(0, 19).replace("T", " ")}</td>
                    <td>
                      <button className="danger" onClick={() => deleteDoc(doc._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}

        {/* --------------------------
            CHAT
        --------------------------- */}
        {section === "chat" && (
          <div>
            <h1>Chat History (Last 10 messages)</h1>

            <div className="chat-box">
              {chat.map((m, idx) => (
                <div key={idx} className={`chat-msg ${m.role}`}>
                  <strong>{m.role}:</strong> {m.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------
            SETTINGS
        --------------------------- */}
        {section === "settings" && (
          <div>
            <h1>System</h1>

            <div className="card">
              <p><strong>Backend URL:</strong> {API_BASE}</p>
              <button onClick={() => window.location.reload()}>Reload</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
