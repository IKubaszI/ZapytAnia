import React, { useState, useEffect } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import { Outlet } from 'react-router-dom';
import { Nav } from './components/Nav';

const { Content, Footer } = Layout;

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('zapytania.theme');
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('zapytania.theme', newMode ? 'dark' : 'light');
    if (newMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Nav isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <Content className="layout-content">
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          ZapytAnia ©2025 - Projekt na zaliczenie TiJO
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default App;