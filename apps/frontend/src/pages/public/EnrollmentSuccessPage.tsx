// pages/public/EnrollmentSuccessPage.tsx

import { Link } from 'react-router-dom';

export function EnrollmentSuccessPage() {
  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
      <h1>Thank you!</h1>
      <p>Your enrollment is confirmed. We will send a confirmation email shortly.</p>
      <Link to="/" style={{ color: '#3b82f6' }}>
        Back to gallery
      </Link>
    </div>
  );
}

export default EnrollmentSuccessPage;
