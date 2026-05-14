import { Routes, Route } from 'react-router-dom';
import { useState, useCallback, createContext, useContext } from 'react';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import EventsList from './pages/EventsList.jsx';
import EventForm from './pages/EventForm.jsx';
import EventView from './pages/EventView.jsx';

const ToastContext = createContext({ show: () => {} });
export const useToast = () => useContext(ToastContext);

export default function App() {
  const [toast, setToast] = useState({ msg: '', success: false, visible: false });

  const show = useCallback((msg, success = false) => {
    setToast({ msg, success, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      <title>Schedule Buddy</title>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<EventsList />} />
          <Route path="/create" element={<EventForm mode="create" />} />
          <Route path="/edit/:id" element={<EventForm mode="edit" />} />
          <Route path="/event/:id" element={<EventView />} />
        </Routes>
      </main>
      <Toast {...toast} />
    </ToastContext.Provider>
  );
}
