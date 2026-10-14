import { useCallback, useEffect, useState } from 'react';
import './App.css';

const API_URL = 'https://jsonplaceholder.typicode.com/users?_limit=1';

const slides = [
  { title: 'Good Morning', subtitle: 'Cybers and Spaces.' },
  { title: 'Explore the World', subtitle: 'Ideas connect us.' },
  { title: 'Discover More', subtitle: 'A little inspiration every day.' },
];

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  const loadUsers = useCallback(async (signal) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_URL, { signal });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('The API returned an invalid user list.');
      }

      setUsers(data);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError('Could not load users. Please try again.');
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  const changeSlide = (direction) => {
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  };

  const currentSlide = slides[activeSlide];

  return (
    <div className="page" id="home">
      <header className="site-header">
        <nav className="navigation" aria-label="Main navigation">
          <a className="brand" href="#home">MY APP</a>
          <a className="nav-link" href="#home">Home</a>
          <a className="nav-link" href="#content">Link</a>
          <details className="nav-options">
            <summary>Options</summary>
            <div className="options-menu">
              <a href="#content">User directory</a>
            </div>
          </details>
        </nav>
      </header>

      <main>
        <section className="banner" aria-label="Featured messages">
          <svg className="banner-art" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true">
            <polygon points="0,0 210,0 120,130" />
            <polygon points="210,0 390,0 330,155 120,130" />
            <polygon points="390,0 570,0 470,112 330,155" />
            <polygon points="570,0 760,0 690,150 470,112" />
            <polygon points="760,0 945,0 860,110 690,150" />
            <polygon points="945,0 1120,0 1070,145 860,110" />
            <polygon points="1120,0 1440,0 1440,175 1240,125 1070,145" />
            <polygon points="0,0 120,130 0,235" />
            <polygon points="120,130 330,155 250,260 0,235" />
            <polygon points="330,155 470,112 550,260 250,260" />
            <polygon points="470,112 690,150 770,260 550,260" />
            <polygon points="690,150 860,110 940,260 770,260" />
            <polygon points="860,110 1070,145 1110,260 940,260" />
            <polygon points="1070,145 1240,125 1440,175 1440,260 1110,260" />
          </svg>
          <button
            className="banner-arrow banner-arrow--previous"
            type="button"
            aria-label="Previous message"
            onClick={() => changeSlide(-1)}
          >
            ‹
          </button>
          <div className="banner-copy" aria-live="polite">
            <h1>{currentSlide.title}</h1>
            <p>{currentSlide.subtitle}</p>
          </div>
          <button
            className="banner-arrow banner-arrow--next"
            type="button"
            aria-label="Next message"
            onClick={() => changeSlide(1)}
          >
            ›
          </button>
          <div className="banner-dots" aria-label="Choose a featured message">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                className={`banner-dot${activeSlide === index ? ' is-active' : ''}`}
                type="button"
                aria-label={`Show message ${index + 1}`}
                aria-current={activeSlide === index ? 'true' : undefined}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
        </section>

        <section className="content" id="content" aria-label="User information">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">ID</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="table-message" colSpan="3">Loading users…</td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td className="table-message table-error" colSpan="3">
                      {error}{' '}
                      <button className="retry-button" type="button" onClick={() => loadUsers()}>
                        Try again
                      </button>
                    </td>
                  </tr>
                )}
                {!loading && !error && users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.id}</td>
                    <td><span className="status-badge">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 15s5-4.7 5-9A5 5 0 1 0 3 6c0 4.3 5 9 5 9Zm0-6.7A2.3 2.3 0 1 1 8 3.7a2.3 2.3 0 0 1 0 4.6Z" />
        </svg>
        <span>Hanoi, {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())}</span>
      </footer>
    </div>
  );
}

export default App;
