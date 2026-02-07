export default function Home() {
  return (
    <main style={{ padding: "48px 6vw", fontFamily: "Baskervville, serif" }}>
      <h1>Next JS Backend Demo</h1>
      <p style={{ maxWidth: 520 }}>
        User APIs are available under <code>/api/user</code>. Open the management
        page to view, update, and delete users.
      </p>
      <a
        href="/user"
        style={{
          display: "inline-block",
          marginTop: 16,
          padding: "10px 18px",
          borderRadius: 999,
          background: "#1f2a44",
          color: "#fff",
          textDecoration: "none",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 13,
        }}
      >
        Go to User Management
      </a>
    </main>
  );
}
