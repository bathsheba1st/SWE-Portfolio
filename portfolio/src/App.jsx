import Project from './components/Project.jsx';
import { profile, projects, skills } from './content.js';

const NAV = [
  { href: '#projects', label: 'Projects' },
  { href: '#skills', label: 'Skills' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

export default function App() {
  const links = [
    { label: 'Email', href: `mailto:${profile.email}`, text: profile.email },
    {
      label: 'GitHub',
      href: profile.github,
      text: profile.github.replace('https://', ''),
    },
    {
      label: 'LinkedIn',
      href: profile.linkedin,
      text: profile.linkedin.replace('https://', ''),
    },
  ].filter((link) => link.href && link.text);

  return (
    <>
      <a className='skip-link' href='#main'>
        Skip to content
      </a>

      <header className='site-header'>
        <a className='site-name' href='#top'>
          {profile.name}
        </a>
        <nav aria-label='Sections'>
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main id='main'>
        <section className='hero' id='top'>
          <p className='eyebrow'>
            {profile.role}
            {profile.location && ` · ${profile.location}`}
          </p>
          <h1>{profile.headline}</h1>
          <p className='intro'>{profile.intro}</p>
          <div className='hero-actions'>
            <a className='button button-primary' href='#projects'>
              See the projects
            </a>
            <a className='button' href='#contact'>
              Get in touch
            </a>
          </div>
        </section>

        <section id='projects' aria-labelledby='projects-heading'>
          <h2 id='projects-heading' className='section-title'>
            Projects
          </h2>
          <p className='section-intro'>
            Three small full stack applications. Each has a React front end, a
            Node.js API, a SQL database and a test suite, and each README
            explains the decisions behind it.
          </p>
          {projects.map((project, index) => (
            <Project
              key={project.slug}
              project={project}
              number={index + 1}
              repo={profile.repo}
            />
          ))}
        </section>

        <section id='skills' aria-labelledby='skills-heading'>
          <h2 id='skills-heading' className='section-title'>
            Skills
          </h2>
          <dl className='skills'>
            {skills.map((skill) => (
              <div key={skill.group}>
                <dt>{skill.group}</dt>
                <dd>{skill.items.join(' · ')}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id='about' aria-labelledby='about-heading'>
          <h2 id='about-heading' className='section-title'>
            About
          </h2>
          <div className='about'>
            <div>
              {profile.about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {profile.experience.length > 0 && (
              <div>
                <h3>Experience</h3>
                <ul className='experience'>
                  {profile.experience.map((job) => (
                    <li key={job.company + job.period}>
                      <strong>
                        {job.title}, {job.company}
                      </strong>
                      <span className='muted'>{job.period}</span>
                      <p>{job.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section id='contact' aria-labelledby='contact-heading'>
          <h2 id='contact-heading' className='section-title'>
            Contact
          </h2>
          <ul className='contact'>
            {links.map((link) => (
              <li key={link.label}>
                <span className='muted'>{link.label}</span>
                <a href={link.href}>{link.text}</a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className='site-footer'>
        <p>Built with React and Vite. All data in the projects is invented.</p>
      </footer>
    </>
  );
}
