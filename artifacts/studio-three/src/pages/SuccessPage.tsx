interface SuccessPageProps {
  onBack: () => void;
}

export default function SuccessPage({ onBack }: SuccessPageProps) {
  return (
    <div className="success-page">
      <div className="success-bg" />
      <div className="success-inner">
        <div className="success-ring">
          <div className="success-check">✓</div>
        </div>
        <h2 className="success-title">
          You're
          <br />
          Booked In.
        </h2>
        <p className="success-msg">
          Your 3-class pass is confirmed. Check your inbox — we've sent
          everything you need to book your first class. See you on the floor.
        </p>
        <button className="btn-back" onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M10 6.5H3M6 3L2.5 6.5 6 10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Studio Three
        </button>
      </div>
    </div>
  );
}
