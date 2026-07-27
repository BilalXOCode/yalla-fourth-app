// App entry point. Wraps everything in the router and the two persistent
// providers (language/RTL and text size) so every page can read them.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LangProvider } from './context/LangContext.jsx';
import { TextSizeProvider } from './context/TextSizeContext.jsx';

// Load design tokens + global base FIRST so component styles (imported inside
// App) can override them when needed.
import './styles/tokens.css';
import './styles/global.css';

import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LangProvider>
        <TextSizeProvider>
          <App />
        </TextSizeProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
