import React, { useEffect, useState } from 'react';
import { Layout, Menu, Switch, Space, Button, Drawer } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  BulbOutlined, BulbFilled, FormOutlined, HomeOutlined,
  BarChartOutlined, MenuOutlined
} from '@ant-design/icons';
import { profileRepository } from '../../services/repositories/profileRepository';
import type { Profile } from '../../domain/models';
import { ProfileMenu } from './ProfileMenu';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const { Header } = Layout;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

interface NavProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Nav: React.FC<NavProps> = ({ isDarkMode, toggleTheme }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
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
      } else {
        currentId = guest.id!;
      }
      if (currentId) await profileRepository.setActiveProfileId(currentId);
    }

    const activeProfile = currentId
      ? all.find(p => p.id === currentId) || (await profileRepository.getById(currentId))
      : null;
    setCurrentProfile(activeProfile || null);
    if (all.length !== (await profileRepository.getAll()).length) setProfiles(await profileRepository.getAll());
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

  // Menu items
  const menuItems = [
    { key: '1', icon: <HomeOutlined />, label: <Link to="/" onClick={() => setDrawerVisible(false)}>{t('nav.decks')}</Link> },
    { key: '3', icon: <FormOutlined />, label: <Link to="/writing" onClick={() => setDrawerVisible(false)}>{t('nav.writing')}</Link> },
    { key: '2', icon: <BarChartOutlined />, label: <Link to="/stats" onClick={() => setDrawerVisible(false)}>{t('nav.stats')}</Link> },
  ];

  return (
    <Header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0 16px' : '0 24px', position: 'sticky', top: 0, zIndex: 1000, width: '100%'
    }}>
      {/* LEWA STRONA: LOGO */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="logo" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginRight: '24px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🧠</span>
          {!isMobile && <span className="logo-text">ZapytAnia</span>}
        </div>

        {/* MENU DESKTOPOWE (Ukryte na mobile) */}
        {!isMobile && (
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={getSelectedKey()}
            items={menuItems}
            style={{ minWidth: 350, borderBottom: 'none' }}
          />
        )}
      </div>

      {/* PRAWA STRONA: SWITCH, PROFIL,*/}
      <Space size={isMobile ? 'small' : 'large'}>
        {!isMobile && <LanguageSwitcher />}
        <Switch
          checkedChildren={<BulbFilled />}
          unCheckedChildren={<BulbOutlined />}
          checked={isDarkMode}
          onChange={toggleTheme}
          size={isMobile ? "small" : "default"}
        />

        <ProfileMenu
          profiles={profiles}
          currentProfile={currentProfile}
          onProfileChange={ensureGuestAndLoad}
        />

        {/*(Tylko na mobile) */}
        {isMobile && (
          <Button
            type="primary"
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
          />
        )}
      </Space>

      {/*(MENU MOBILNE) */}
      <Drawer
        title={t('nav.menu')}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Drawer>
    </Header>
  );
};