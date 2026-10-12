import { studioReviews } from "@/lib/studio-reviews";

export default function StudioReviews({
  membershipHref,
}: {
  membershipHref: string;
}) {
  return (
    <section
      className="studio-reviews"
      id="reviews"
      aria-labelledby="reviews-heading"
    >
      <div className="reviews-intro">
        <h2 id="reviews-heading">
          What our
          <br />
          <span>community says.</span>
        </h2>
        <p>Selected ClassPass review excerpts from our six existing studios.</p>
      </div>
      <div className="reviews-grid">
        {studioReviews.map((review) => (
          <figure className="studio-review" key={review.studio}>
            <blockquote cite={review.source}>
              <p>“{review.quote}”</p>
            </blockquote>
            <figcaption>
              <div className="review-author">
                <strong>{review.reviewer}</strong>
                <span>
                  {review.studio}
                  {review.city !== review.studio ? ` · ${review.city}` : ""}
                </span>
              </div>
              <a
                href={review.source}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read the ${review.studio} review on ClassPass`}
              >
                ClassPass <span aria-hidden="true">↗</span>
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="reviews-invitation">
        <p>Find your people. Right here in Brickell.</p>
        <a className="text-link" href={membershipHref}>
          Explore founding membership <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
