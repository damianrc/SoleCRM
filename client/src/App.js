import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Protected from './components/Protected';
import ContactsPage from './components/ContactsPage';
import TasksPage from './components/TasksPage';
import ContactDetailPage from './components/ContactDetailPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/protected" element={<Protected />}>
          <Route index element={<ContactsPage />} /> {/* Default child route for /protected */}
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
        </Route>
        {/* other routes */}
      </Routes>
    </Router>
  );
};

export default App;