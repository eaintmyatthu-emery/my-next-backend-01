"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./user.module.css";

const emptyForm = {
  username: "",
  email: "",
  firstname: "",
  lastname: "",
  status: "active",
  password: "",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const selectedUser = useMemo(
    () => users.find((u) => String(u._id) === String(selectedId)),
    [users, selectedId]
  );

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user?limit=50", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load users");
      }
      setUsers(data?.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setForm(emptyForm);
      return;
    }
    setForm({
      username: selectedUser.username ?? "",
      email: selectedUser.email ?? "",
      firstname: selectedUser.firstname ?? "",
      lastname: selectedUser.lastname ?? "",
      status: selectedUser.status ?? "active",
      password: "",
    });
  }, [selectedUser]);

  function onSelect(user) {
    setSelectedId(user?._id ? String(user._id) : "");
    setInfo("");
    setError("");
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSave(e) {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        username: form.username,
        email: form.email,
        firstname: form.firstname,
        lastname: form.lastname,
        status: form.status,
      };
      if (form.password) payload.password = form.password;

      const res = await fetch(`/api/user/${selectedUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Update failed");
      }
      setInfo("User updated.");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedUser) return;
    const confirmed = window.confirm(
      `Delete user ${selectedUser.username || selectedUser.email}?`
    );
    if (!confirmed) return;
    setDeleting(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch(`/api/user/${selectedUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Delete failed");
      }
      setInfo("User deleted.");
      setSelectedId("");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Admin Console</p>
          <h1>User Management</h1>
          <p className={styles.subtle}>
            View, update, and remove users using the backend API.
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.secondary} onClick={loadUsers} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Users</h2>
            <span className={styles.badge}>{users.length}</span>
          </div>

          {loading ? (
            <div className={styles.state}>Loading users...</div>
          ) : users.length === 0 ? (
            <div className={styles.state}>No users found.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className={
                        String(user._id) === String(selectedId)
                          ? styles.rowActive
                          : undefined
                      }
                    >
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        {(user.firstname ?? "") + " " + (user.lastname ?? "")}
                      </td>
                      <td>
                        <span
                          className={
                            String(user.status).toLowerCase() === "active"
                              ? styles.statusActive
                              : styles.statusInactive
                          }
                        >
                          {user.status ?? "active"}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.linkButton}
                          onClick={() => onSelect(user)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Details</h2>
            <span className={styles.badge}>
              {selectedUser ? "Selected" : "Idle"}
            </span>
          </div>

          {!selectedUser ? (
            <div className={styles.state}>
              Select a user to update or delete.
            </div>
          ) : (
            <form className={styles.form} onSubmit={onSave}>
              <label>
                Username
                <input
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  type="email"
                  required
                />
              </label>
              <div className={styles.split}>
                <label>
                  First name
                  <input
                    name="firstname"
                    value={form.firstname}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Last name
                  <input
                    name="lastname"
                    value={form.lastname}
                    onChange={onChange}
                  />
                </label>
              </div>
              <div className={styles.split}>
                <label>
                  Status
                  <select name="status" value={form.status} onChange={onChange}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </label>
                <label>
                  New password
                  <input
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    type="password"
                    placeholder="Leave blank to keep"
                  />
                </label>
              </div>
              <div className={styles.formActions}>
                <button className={styles.primary} type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  className={styles.danger}
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete user"}
                </button>
              </div>
            </form>
          )}

          {error ? <div className={styles.error}>{error}</div> : null}
          {info ? <div className={styles.info}>{info}</div> : null}
        </section>
      </div>
    </div>
  );
}
