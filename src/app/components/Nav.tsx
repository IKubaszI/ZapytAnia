import { Link, NavLink } from "react-router-dom";

export default function Nav() {
  return (
    <header style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>
      <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link to="/" style={{ fontWeight: 700 }}>ZapytAnia</Link>
        <NavLink to="/" style={({isActive}) => ({ textDecoration: isActive ? "underline" : "none" })}>
          Zestawy
        </NavLink>
        <NavLink to="/quiz" style={({isActive}) => ({ textDecoration: isActive ? "underline" : "none" })}>
          Quiz
        </NavLink>
        <NavLink to="/stats" style={({isActive}) => ({ textDecoration: isActive ? "underline" : "none" })}>
          Statystyki
        </NavLink>
      </nav>
    </header>
  );
}
