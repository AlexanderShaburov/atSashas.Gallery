import { Link } from "react-router-dom";
import "./bottomBar.css";

export default function BottomBar() {
  const year = new Date().getFullYear();
  const artist = "Alexandra Shaburova";
  const email = "shaburova450@gmail.com";
  const username = "a.sasha.art";

  const sections = [
    { to: "/watercolor", label: "Watercolor" },
    { to: "/mixed-media", label: "Mixed Media" },
    // { to: "/about", label: "About" }, // если добавишь страницы
    // { to: "/contact", label: "Contact" },
  ];

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <p className="footer-note">
            © {year} {artist}. “All images are protected by copyright. Any
            publication, reproduction, or other use is permitted only with prior
            written consent.”
          </p>
          <p className="footer-contact">
            For inquiries, please contact:{" "}
            <a href={`mailto: ${email}`}>{email}</a>
          </p>
        </div>
        <nav className="footer-col">
          <div className="footer-title">Explore</div>
          <ul className="footer-links">
            {sections.map((s) => (
              <li key={s.to}>
                <Link to={s.to}>{s.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-col">
          <div className="footer-title">Get in touch</div>
          <ul className="footer-links">
            <li>
              {" "}
              <a
                href={`https://www.instagram.com/${username}/`}
                target="_blank"
                rel="norefferrer"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://www.behance.net/alexanrshaburo"
                target="_blank"
                rel="noreferrer"
              >
                Behance
              </a>
            </li>
          </ul>
          <button className="footer-cta" type="button">
            For inquiries
          </button>
        </div>
      </div>
      <div className="container footer-bottom">
        <Link className="back-to-top" to="/">
          Home ↑
        </Link>
      </div>
    </footer>
  );
}
