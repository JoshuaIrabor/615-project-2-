import './Toast.css';

export default function Toast({ msg, success, visible }) {
  return (
    <div className={`toast ${visible ? 'show' : ''} ${success ? 'success' : ''}`}>
      {msg}
    </div>
  );
}
