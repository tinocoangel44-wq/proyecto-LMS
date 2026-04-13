import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './context/ThemeContext';

window.addEventListener("error", (event) => {
  document.body.innerHTML += `<div style="background:red;color:white;padding:20px;font-family:sans-serif;z-index:99999;position:fixed;top:0;left:0;width:100%;">
    <b>Global Error:</b> ${event.error?.stack || event.message}
  </div>`;
});
window.addEventListener("unhandledrejection", (event) => {
  document.body.innerHTML += `<div style="background:orange;color:black;padding:20px;font-family:sans-serif;z-index:99999;position:fixed;top:80px;left:0;width:100%;">
    <b>Unhandled Promise Rejection:</b> ${event.reason?.stack || event.reason}
  </div>`;
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
