import React, { useEffect, useState } from 'react';
import { Layout, Menu, Switch, Space, Button, Drawer } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  BulbOutlined, BulbFilled, FormOutlined, HomeOutlined,
  BarChartOutlined, MenuOutlined
} from '@ant-design/icons';
import { profileRepository } from '../../services/repositories/profileRepository';
import { db } from '../../services/db';
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
    try {
      const all = await profileRepository.getAll();
      setProfiles(all);
      let currentId = profileRepository.getActiveProfileId();

      if (!currentId) {
        let guest = all.find(p => p.name === "Gość");
        if (!guest) {
          console.log("No guest profile found, creating one...");
          try {
            const newId = await profileRepository.create("Gość");
            currentId = newId as number;
            console.log("Guest profile created with ID:", newId);
          } catch (createError) {
            console.error("Failed to create Guest profile:", createError);
            // Fallback: try to find any profile
            if (all.length > 0) {
              currentId = all[0].id!;
              console.log("Fallback to first available profile:", currentId);
            }
          }
        } else {
          currentId = guest.id!;
        }
        if (currentId) await profileRepository.setActiveProfileId(currentId);
      }

      const activeProfile = currentId
        ? all.find(p => p.id === currentId) || (await profileRepository.getById(currentId))
        : null;
      setCurrentProfile(activeProfile || null);

      // Double check if profiles list needs update
      const freshAll = await profileRepository.getAll();
      if (all.length !== freshAll.length) setProfiles(freshAll);

    } catch (error: any) {
      console.error("Critical error in ensureGuestAndLoad:", error);

      // Check for critical DB errors that require a reset
      const isDatabaseError = error.name === 'DatabaseClosedError' ||
        error.name === 'DataError' ||
        (error.message && error.message.includes('UpgradeError'));

      if (isDatabaseError) {
        const resetKey = 'zapytania.db_reset_attempt';
        const lastReset = localStorage.getItem(resetKey);
        const now = Date.now();

        // Prevent infinite loops: only reset once every 10 seconds
        if (!lastReset || (now - parseInt(lastReset)) > 10000) {
          console.warn("Detected corrupted database. Attempting to reset...");
          localStorage.setItem(resetKey, now.toString());
          try {
            await db.delete();
            console.log("Database deleted successfully. Reloading...");
            window.location.reload();
          } catch (deleteError) {
            console.error("Failed to delete database:", deleteError);
            alert("Critical Error: Database is corrupted and could not be reset automatically. Please clear your browser site data.");
          }
        } else {
          console.error("Database reset loop detected. Please clear site data manually.");
        }
      }
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
        styles={{ body: { padding: 0 } }}
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