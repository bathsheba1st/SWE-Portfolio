/** One project: screenshots, what it is, and what it demonstrates. */
export default function Project({ project, number, repo }) {
  const folder = `projects/${project.slug}`;
  // import.meta.env.BASE_URL is the address the site is served from, so the
  // images load whether the site lives at "/" or at "/some-folder/".
  const shotUrl = (file) => `${import.meta.env.BASE_URL}shots/${file}`;

  return (
    <article className="project" aria-labelledby={`${project.slug}-name`}>
      <header className="project-header">
        <p className="eyebrow">Project {number}</p>
        <h3 id={`${project.slug}-name`}>{project.name}</h3>
        <p className="tagline">{project.tagline}</p>
      </header>

      <div className={project.shots.length > 1 ? 'shots shots-two' : 'shots'}>
        {project.shots.map((shot) => (
          <img key={shot.file} src={shotUrl(shot.file)} alt={shot.alt} loading="lazy" width="1280" height={shot.height ?? 800} />
        ))}
      </div>

      <p className="summary">{project.summary}</p>

      <dl className="highlights">
        {project.highlights.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.text}</dd>
          </div>
        ))}
      </dl>

      <footer className="project-footer">
        <ul className="stack" aria-label="Built with">
          {project.stack.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div className="project-links">
          {project.demo && (
            // The visible text is short; aria-label tells screen reader users which project.
            <a
              className="button button-primary" href={project.demo}
              // target="_blank" opens a new tab. rel="noopener noreferrer" stops
              // the new page from being able to control this one.
              target="_blank" rel="noopener noreferrer"
              aria-label={`Live demo of ${project.name} (opens in a new tab)`}
            >
              Live demo
            </a>
          )}
          {repo
            ? (
              <a
                className="button" href={`${repo}/tree/main/${folder}`}
                target="_blank" rel="noopener noreferrer"
                aria-label={`View the code for ${project.name} (opens in a new tab)`}
              >
                View the code
              </a>
            )
            : <code>{folder}/</code>}
        </div>
      </footer>
    </article>
  );
}
