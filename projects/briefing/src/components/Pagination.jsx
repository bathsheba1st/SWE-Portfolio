export default function Pagination({ page, pageCount, linkFor }) {
  return (
    <nav aria-label='Pages' className='pagination'>
      {page > 1 ? (
        <a className='button' href={linkFor(page - 1)} rel='prev'>
          ← Newer
        </a>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <a className='button' href={linkFor(page + 1)} rel='next'>
          Older →
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
