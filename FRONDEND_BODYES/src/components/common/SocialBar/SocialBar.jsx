import './SocialBar.css'

function SocialBar() {
  return (
    <aside className="social-bar" aria-label="Redes sociales CLIO">
      <a
        className="social-bar__link"
        href="https://www.instagram.com/clioofficial.co?igsh=eTJib3kxdWo2ZjZ3"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram de CLIO"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="17.3" cy="6.7" r="1.15" fill="currentColor" />
        </svg>
      </a>
      <a
        className="social-bar__link"
        href="https://www.tiktok.com/@cliooficial.co?_r=1&_t=ZS-98I5UabDAAP"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok de CLIO"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M14.2 3.5c.6 2.3 2.1 3.9 4.3 4.4v2.5c-1.5-.1-2.9-.6-4.1-1.5v5.8c0 3.2-2.5 5.8-5.7 5.8S3 17.9 3 14.7c0-3.1 2.4-5.6 5.5-5.8v2.6c-1.5.2-2.6 1.4-2.6 3 0 1.7 1.3 3 3 3s3-1.3 3-3V3.5h2.3Z"
            fill="currentColor"
          />
        </svg>
      </a>
    </aside>
  )
}

export default SocialBar
