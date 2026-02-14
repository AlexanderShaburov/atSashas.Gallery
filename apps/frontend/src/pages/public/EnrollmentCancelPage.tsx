// pages/public/EnrollmentCancelPage.tsx

import { Link } from 'react-router-dom';

export function EnrollmentCancelPage() {
  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
      <h1>Payment cancelled</h1>
      <p>Your payment was not completed. You can return to the gallery and try again.</p>
      <Link to="/" style={{ color: '#3b82f6' }}>
        Back to gallery
      </Link>
    </div>
  );
}

export default EnrollmentCancelPage;
