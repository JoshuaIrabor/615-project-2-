import { Link, useLocation } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const onCreatePage = location.pathname === '/create' || location.pathname.startsWith('/edit');

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <div className="brand-icon">
            <Calendar size={26} strokeWidth={2.2} />
          </div>
          <div className="brand-text">
            <h1>Schedule Buddy</h1>
            <p>Plan with friends, effortlessly</p>
          </div>
        </Link>

        {!onCreatePage && (
          <Link to="/create" className="btn btn-primary">
            <Plus size={18} strokeWidth={2.5} />
            Create Event
          </Link>
        )}
      </div>
    </header>
  );
}
