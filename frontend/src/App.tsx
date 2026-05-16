import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Topics from './pages/Topics';
import Recipients from './pages/Recipients';
import KafkaMonitor from './pages/KafkaMonitor';
import './index.css';
import styles from './App.module.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/recipients" element={<Recipients />} />
            <Route path="/kafka" element={<KafkaMonitor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
