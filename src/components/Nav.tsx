import { Link, NavLink } from "react-router-dom";

export default function Nav() {
  return (
    <header
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
        display: "flex",
        gap: 16,
        alignItems: "center",
      }}
    >
      <Link to="/" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
        ZapytAnia
      </Link>
      <NavLink
        to="/"
        style={({ isActive }) => ({
          textDecoration: isActive ? "underline" : "none",
          color: isActive ? "#00796b" : "#333",
        })}
      >
        Zestawy
      </NavLink>
      <NavLink
        to="/quiz"
        style={({ isActive }) => ({
          textDecoration: isActive ? "underline" : "none",
          color: isActive ? "#00796b" : "#333",
        })}
      >
        Quiz
      </NavLink>
      <NavLink
        to="/stats"
        style={({ isActive }) => ({
          textDecoration: isActive ? "underline" : "none",
          color: isActive ? "#00796b" : "#333",
        })}
      >
        Statystyki
      </NavLink>
    </header>
  );
}
