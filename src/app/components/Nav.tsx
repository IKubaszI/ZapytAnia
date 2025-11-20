import React, { useEffect, useState } from 'react';
import { Layout, Menu, Switch, Space, message } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { BulbOutlined, BulbFilled, FormOutlined, HomeOutlined, BarChartOutlined } from '@ant-design/icons';
import { profileRepository } from '../../services/repositories/profileRepository';
import type { Profile } from '../../domain/models';
import { ProfileMenu } from './ProfileMenu';

const { Header } = Layout;

interface NavProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Nav: React.FC<NavProps> = ({ isDarkMode, toggleTheme }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const location = useLocation();

  const ensureGuestAndLoad = async () => {
    const all = await profileRepository.getAll();
    setProfiles(all);

    let currentId = profileRepository.getActiveProfileId();

    if (!currentId) {
        let guest = all.find(p => p.name === "Gość");
        if (!guest) {
            const newId = await profileRepository.create("Gość");
            currentId = newId as number;
            message.info("Zalogowano jako Gość");
        } else {
            currentId = guest.id!;
        }
        
        if (currentId) {
            await profileRepository.setActiveProfileId(currentId);
        }
    }

    const activeProfile = currentId 
        ? all.find(p => p.id === currentId) || (await profileRepository.getById(currentId)) 
        : null;
        
    setCurrentProfile(activeProfile || null);
    
    if (all.length !== (await profileRepository.getAll()).length) {
        setProfiles(await profileRepository.getAll());
    }
  };

  useEffect(() => {
    ensureGuestAndLoad();
    const handleRefresh = () => { ensureGuestAndLoad(); };
    
    window.addEventListener('zapytania:profile-changed', handleRefresh);
    return () => window.removeEventListener('zapytania:profile-changed', handleRefresh);
  }, []);

  const getSelectedKey = () => {
      if (location.pathname === '/') return ['1'];
      if (location.pathname === '/stats') return ['2'];
      if (location.pathname === '/writing') return ['3'];
      return [];
  };

  return (
    <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Logo */}
        <div className="logo" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginRight: '24px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🧠</span> <span className="logo-text">ZapytAnia</span>
        </div>
        
        {/* Menu Główne */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={getSelectedKey()}
          items={[
            { key: '1', icon: <HomeOutlined />, label: <Link to="/">Zestawy</Link> },
            { key: '3', icon: <FormOutlined />, label: <Link to="/writing">Pisanie</Link> },
            { key: '2', icon: <BarChartOutlined />, label: <Link to="/stats">Statystyki</Link> },
          ]}
          style={{ minWidth: 350 }}
        />
      </div>
      
      <Space size="large">
        {/* Przełącznik Motywu */}
        <Switch
          checkedChildren={<BulbFilled />}
          unCheckedChildren={<BulbOutlined />}
          checked={isDarkMode}
          onChange={toggleTheme}
        />
        
        {/* Menu Profilu */}
        <ProfileMenu 
          profiles={profiles} 
          currentProfile={currentProfile} 
          onProfileChange={ensureGuestAndLoad} 
        />
      </Space>
    </Header>
  );
};