import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Calendar size={44} strokeWidth={2} />
      </div>
      <h2>No events yet</h2>
      <p>Create your first event to get started and plan something amazing with your friends!</p>
      <Link to="/create" className="btn btn-primary">
        <Plus size={18} strokeWidth={2.5} />
        Create Your First Event
      </Link>
    </div>
  );
}
