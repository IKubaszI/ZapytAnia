import React, { useEffect, useState } from 'react';
import { 
    Button, Table, Modal, Input, message, Space, Typography, 
    Popconfirm, Alert, Upload, Progress 
} from 'antd';
import { 
    UploadOutlined, PlayCircleOutlined, ThunderboltOutlined, 
    DeleteOutlined, EyeOutlined, InboxOutlined, FileTextOutlined,
    ExclamationCircleFilled, FolderOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import type { Deck } from '../../domain/models';
import type { UploadProps } from 'antd';
import { studyRepository } from '../../services/repositories/studyRepository';
import { profileRepository } from '../../services/repositories/profileRepository';
import { parseImportText } from '../../domain/parser';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface DeckWithStats extends Deck {
    cardCount: number;
    learnedCount: number;
}

export const DecksPage: React.FC = () => {
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [newDeckName, setNewDeckName] = useState('');
  const [parsedCount, setParsedCount] = useState(0);

  const navigate = useNavigate();
  
  // 1. Hooki Ant Design (naprawa błędów konsoli)
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const loadData = async () => {
    try {
        const profileId = profileRepository.getActiveProfileId();
        if (!profileId) return;
        const data = await studyRepository.getDecks(profileId);
        setDecks(data as DeckWithStats[]);
    } catch (e) {
        console.error("Błąd ładowania:", e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('zapytania:profile-changed', loadData);
    return () => window.removeEventListener('zapytania:profile-changed', loadData);
  }, []);

  const openModal = () => {
    setImportText('');
    setNewDeckName('');
    setParsedCount(0);
    setIsModalOpen(true);
  };

  const handleFileUpload: UploadProps['beforeUpload'] = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setImportText(content);
        const tempParsed = parseImportText(content);
        setParsedCount(tempParsed.length);
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setNewDeckName(fileName);
        messageApi.success(`Wczytano plik: ${file.name}`);
      }
    };
    reader.readAsText(file);
    return false;
  };

  const executeImport = async (deckId: number, profileId: number, cardsData: {front: string, back: string}[]) => {
    try {
        const addedCount = await studyRepository.importCardsSmart(deckId, profileId, cardsData);
        const duplicates = cardsData.length - addedCount;

        if (addedCount > 0) {
            let msg = `Sukces! Dodano ${addedCount} nowych fiszek.`;
            if (duplicates > 0) {
                msg += ` (Pominięto ${duplicates} duplikatów)`;
            }
            messageApi.success(msg);
        } else {
            messageApi.info("Wszystkie fiszki z pliku są już w tym zestawie.");
        }
        
        setIsModalOpen(false);
        loadData();
    } catch (e) {
        console.error(e);
        messageApi.error("Wystąpił błąd podczas zapisywania fiszek.");
    }
  };

  const handleSave = async () => {
    try {
        const profileId = profileRepository.getActiveProfileId();
        if (!profileId) {
            messageApi.error('Brak aktywnego profilu!');
            return;
        }
        
        const nameToSave = newDeckName.trim();
        if (!nameToSave) {
            messageApi.warning('Podaj nazwę zestawu');
            return;
        }

        const cardsData = parseImportText(importText);
        if (cardsData.length === 0) {
            messageApi.error('Nie wykryto poprawnych fiszek.');
            return;
        }

        const existingDeck = await studyRepository.findDeckByName(profileId, nameToSave);

        if (existingDeck) {
            modal.confirm({
                title: `Zestaw "${existingDeck.name}" już istnieje`,
                icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />,
                content: (
                    <div>
                        <p>Czy chcesz dodać te <b>{parsedCount}</b> fiszek do istniejącego zestawu?</p>
                        <p style={{fontSize: 12, color: '#666'}}>Duplikaty zostaną pominięte.</p>
                    </div>
                ),
                okText: 'Tak, scal',
                cancelText: 'Anuluj',
                onOk: () => executeImport(existingDeck.id!, profileId, cardsData)
            });
        } else {
            const newDeckId = await studyRepository.createDeck(profileId, nameToSave);
            await executeImport(newDeckId as number, profileId, cardsData);
        }
    } catch (error: any) {
        messageApi.error(`Błąd: ${error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    await studyRepository.deleteDeck(id);
    messageApi.success('Usunięto zestaw');
    loadData();
  };

  const columns = [
    { 
        title: 'Nazwa zestawu', 
        dataIndex: 'name', 
        key: 'name', 
        render: (t: string) => <Text strong style={{fontSize: 16}}>{t}</Text> 
    },
    { 
        title: 'Postęp nauki', 
        key: 'progress', 
        width: 250,
        render: (_: any, record: DeckWithStats) => {
            const percent = record.cardCount > 0 
                ? Math.round((record.learnedCount / record.cardCount) * 100) 
                : 0;
            return (
                <div style={{ textAlign: 'center' }}>
                    <Progress percent={percent} size="small" status={percent === 100 ? "success" : "active"} />
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888'}}>
                        <span>Nauczone: {record.learnedCount}</span>
                        <span>Razem: {record.cardCount}</span>
                    </div>
                </div>
            );
        }
    },
    {
      title: 'Akcje',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: DeckWithStats) => (
        <Space size="small">
          <Button type="primary" ghost icon={<PlayCircleOutlined />} onClick={() => navigate(`/quiz?deck=${record.id}&mode=srs`)}>Nauka</Button>
          <Button icon={<ThunderboltOutlined />} onClick={() => navigate(`/quiz?deck=${record.id}&mode=all`)}>Trening</Button>
          <Link to={`/decks/${record.id}`}><Button icon={<EyeOutlined />} /></Link>
          <Popconfirm title="Usunąć zestaw?" onConfirm={() => handleDelete(record.id!)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
        {/* Renderowanie Context Holders */}
        {modalContextHolder}
        {messageContextHolder}

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
            <div>
                <Title level={2} style={{marginBottom: 0}}>Twoje zestawy</Title>
                <Text type="secondary">Wybierz zestaw do nauki lub stwórz nowy</Text>
            </div>
            <Button type="primary" size="large" icon={<UploadOutlined />} onClick={openModal}>
                Importuj / Utwórz
            </Button>
        </div>
      
      <Table dataSource={decks} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} locale={{ emptyText: 'Brak zestawów. Dodaj pierwszy!' }} />

      <Modal 
        title="Importuj zestaw" 
        open={isModalOpen} 
        onOk={handleSave} 
        onCancel={() => setIsModalOpen(false)}
        okText={parsedCount > 0 ? `Zapisz (${parsedCount} fiszek)` : "Zapisz"}
        cancelText="Anuluj"
        okButtonProps={{ disabled: parsedCount === 0 && !newDeckName }}
      >
        <Space direction="vertical" style={{width: '100%', gap: 20}}>
            <Alert message="Format: 'angielski = polski' lub tabulacja." type="info" showIcon />

            <Dragger name="file" multiple={false} beforeUpload={handleFileUpload} showUploadList={false} style={{ padding: 20, background: '#fafafa' }}>
                <p className="ant-upload-drag-icon"><InboxOutlined style={{color: '#1890ff'}} /></p>
                <p className="ant-upload-text">Kliknij lub przeciągnij plik .txt tutaj</p>
            </Dragger>

            {parsedCount > 0 && (
                <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: 10, borderRadius: 4 }}>
                    <Space align="center"><FileTextOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                        <div><Text type="success" strong>Wczytano poprawnie</Text><br/><Text style={{fontSize: 12}}>Znaleziono {parsedCount} par słówek</Text></div>
                    </Space>
                </div>
            )}

            {/* 2. Naprawa Inputa: usunięcie addonBefore */}
            <Input 
                placeholder="Nazwa zestawu (np. Angielski B2)" 
                prefix={<FolderOutlined style={{color: 'rgba(0,0,0,.25)'}} />}
                value={newDeckName} 
                onChange={e => setNewDeckName(e.target.value)} 
                status={!newDeckName && parsedCount > 0 ? "warning" : ""}
            />
        </Space>
      </Modal>
    </div>
  );
};