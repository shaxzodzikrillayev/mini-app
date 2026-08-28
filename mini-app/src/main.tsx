import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { webAppReady } from './lib/telegram';
import { initThemeListener } from './store/theme';
import { useAuth } from './store/auth';

webAppReady();
initThemeListener();
void useAuth.getState().init();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
