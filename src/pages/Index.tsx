import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/home${window.location.search}${window.location.hash}`, { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
