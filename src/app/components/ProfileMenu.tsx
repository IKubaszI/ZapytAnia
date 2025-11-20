import React, { useState, useEffect } from 'react';
import { Dropdown, Avatar, Modal, Input, Button, message, Upload, Typography, Popconfirm } from 'antd';
import type { MenuProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { profileRepository } from '../../services/repositories/profileRepository';
import type { Profile } from '../../domain/models';

const { Text } = Typography;

function fileToBase64(file: RcFile): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

interface Props {
  profiles: Profile[];
  currentProfile: Profile | null;
  onProfileChange: () => void;
}

export const ProfileMenu: React.FC<Props> = ({ profiles, currentProfile, onProfileChange }) => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [editorOpen, setEditorOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempAvatar, setTempAvatar] = useState<string | undefined>(undefined);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (editorOpen) {
      if (currentProfile && !isCreatingNew) {
        setTempName(currentProfile.name);
        setTempAvatar(currentProfile.avatarUrl);
      } else {
        setTempName("");
        setTempAvatar(undefined);
      }
    }
  }, [editorOpen, currentProfile, isCreatingNew]);

  const triggerGlobalRefresh = () => {
    onProfileChange();
    window.dispatchEvent(new Event('zapytania:profile-changed'));
    window.dispatchEvent(new Event('zapytania:stats-changed'));
  };

  const handleSave = async () => {
    const name = tempName.trim();
    if (!name) {
        messageApi.warning("Podaj nazwę profilu");
        return;
    }
    
    try {
      if (currentProfile && !isCreatingNew) {
        await profileRepository.update(currentProfile.id!, { name, avatarUrl: tempAvatar });
        messageApi.success("Profil zaktualizowany!");
      } else {
        const newId = await profileRepository.create(name, tempAvatar);
        await profileRepository.setActiveProfileId(newId as number);
        messageApi.success("Witaj w aplikacji!");
      }
      
      triggerGlobalRefresh();
      setEditorOpen(false);
      setIsCreatingNew(false);
    } catch (error: any) {
      if (error.message === "PROFILE_EXISTS") {
          messageApi.error("Taki profil już istnieje!");
      } else {
          messageApi.error("Błąd zapisu");
      }
    }
  };

  const handleDeleteCurrent = async () => {
      if (!currentProfile?.id) return;
      try {
          await profileRepository.delete(currentProfile.id);
          await handleLogout(); 
      } catch (error) {
          messageApi.error("Nie udało się usunąć profilu");
      }
  };

  const handleSwitchProfile = async (id: number) => {
    await profileRepository.setActiveProfileId(id);
    triggerGlobalRefresh();
    navigate('/');
    messageApi.success('Przełączono profil');
  };

  const handleLogout = async () => {
    try {
        const allProfiles = await profileRepository.getAll();
        let guest = allProfiles.find(p => p.name === "Gość");
        let guestId = guest?.id;

        if (!guestId) {
            guestId = await profileRepository.create("Gość") as number;
        }

        await profileRepository.setActiveProfileId(guestId);
        triggerGlobalRefresh();
        navigate('/');
        
        if (editorOpen) {
             setEditorOpen(false);
        } else {
             messageApi.info('Wylogowano (Gość)');
        }
    } catch (error) {
        console.error(error);
    }
  };

  const openCreator = () => { setIsCreatingNew(true); setEditorOpen(true); };
  const openEditor = () => { setIsCreatingNew(false); setEditorOpen(true); };

  const menuItems: MenuProps['items'] = [
    { key: 'header', label: <Text strong style={{ padding: '0 12px' }}>Cześć, {currentProfile?.name}!</Text>, disabled: true },
    { type: 'divider' },
    { key: 'edit', icon: <SettingOutlined />, label: 'Edytuj ten profil', onClick: openEditor },
    { key: 'new', icon: <PlusOutlined />, label: 'Stwórz nowy profil', onClick: openCreator },
    { type: 'divider' },
    { key: 'others', label: <Text type="secondary" style={{ fontSize: 12 }}>Przełącz na:</Text>, disabled: true },
    ...profiles.filter(p => p.id !== currentProfile?.id).map(p => ({
      key: `p-${p.id}`,
      label: p.name,
      icon: <Avatar src={p.avatarUrl} size="small" icon={<UserOutlined />} />,
      onClick: () => p.id && handleSwitchProfile(p.id),
    })),
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Wyloguj', danger: true, onClick: handleLogout }
  ];

  const initialLetter = (currentProfile?.name?.[0] || "G").toUpperCase();

  const modalFooter = (
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
        <Button onClick={() => setEditorOpen(false)}>Anuluj</Button>
        <Button type="primary" size="large" onClick={handleSave} style={{ minWidth: 100 }}>
            {isCreatingNew || !currentProfile ? "Stwórz!" : "Zapisz"}
        </Button>
      </div>
  );

  return (
    <>
      {contextHolder}

      {currentProfile ? (
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
             <span style={{ fontWeight: 600, fontSize: "0.95rem", color: 'white' }}>
               {currentProfile?.name}
             </span>
             <Avatar src={currentProfile?.avatarUrl} size={36} icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }}>
               {!currentProfile?.avatarUrl ? initialLetter : null}
             </Avatar>
          </div>
        </Dropdown>
      ) : (
        <Button type="primary" ghost icon={<PlusOutlined />} onClick={openCreator}>
          Zaloguj / Stwórz profil
        </Button>
      )}

      <Modal open={editorOpen} onCancel={() => setEditorOpen(false)} footer={null} centered destroyOnClose width={400}>
        <div style={{ textAlign: "center", padding: "24px 8px" }}>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
              {!isCreatingNew && currentProfile ? (
                  <Popconfirm title="Usunąć profil?" description="To nieodwracalne." onConfirm={handleDeleteCurrent} okText="Tak" cancelText="Nie">
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" title="Usuń profil" />
                  </Popconfirm>
              ) : <div style={{width: 24}}></div>}
              
              <p style={{ fontSize: "1.2rem", fontWeight: 600, margin: 0 }}>
                {isCreatingNew || !currentProfile ? "Hejjko dodaj nowy profil!" : "Edytujesz swój profil"}
              </p>
              <div style={{width: 24}}></div>
          </div>

          <Upload showUploadList={false} accept="image/*" beforeUpload={async (file) => {
              const img = await fileToBase64(file as RcFile);
              setTempAvatar(img);
              return false; 
            }}>
            <div style={{
              width: 140, height: 140, borderRadius: "50%", border: "2px dashed #999",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px", cursor: "pointer", overflow: "hidden", position: "relative"
            }}>
              {tempAvatar ? (
                <img src={tempAvatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#999'}}>
                    <span style={{ fontSize: 40 }}>📷</span>
                    <span style={{ fontSize: 12 }}>Kliknij by dodać</span>
                </div>
              )}
            </div>
          </Upload>

          <Input 
            style={{ maxWidth: 260, margin: "0 auto 24px", display: "block", textAlign: 'center' }} 
            placeholder="Twój nick..." 
            prefix={<UserOutlined style={{color: 'rgba(0,0,0,.25)'}} />}
            value={tempName} 
            onChange={(e) => setTempName(e.target.value)}
            maxLength={20}
          />

          {modalFooter}
        </div>
      </Modal>
    </>
  );
};