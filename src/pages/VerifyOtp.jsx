import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
  }, [email, navigate]);

  return null;
}
