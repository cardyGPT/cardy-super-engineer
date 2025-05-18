
import { Navigate } from 'react-router-dom';

// Redirect from old Stories page to new Generate page
const StoriesPage = () => {
  return <Navigate to="/generate" replace />;
};

export default StoriesPage;
