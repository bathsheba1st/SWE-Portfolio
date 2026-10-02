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
        {repo
          ? <a className="button" href={`${repo}/tree/main/${folder}`}>View the code</a>
          : <code>{folder}/</code>}
      </footer>
    </article>
  );
}
