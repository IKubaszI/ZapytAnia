import React from 'react';
import { Dropdown, Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const items: MenuProps['items'] = [
    {
      key: 'pl',
      label: '🇵🇱 Polski',
      onClick: () => changeLanguage('pl'),
    },
    {
      key: 'en',
      label: '🇬🇧 English',
      onClick: () => changeLanguage('en'),
    },
  ];

  return (
    <Dropdown menu={{ items, selectedKeys: [i18n.language] }} placement="bottomRight">
      <Button
        type="text"
        icon={<GlobalOutlined style={{ fontSize: 20, color: 'white' }} />}
        style={{
          padding: '4px 8px',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
        }}
      />
    </Dropdown>
  );
};
