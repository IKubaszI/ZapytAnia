import React, { useEffect, useState } from 'react';
import {
  Button,
  Table,
  Modal,
  message,
  Space,
  Typography,
  Popconfirm,
  Progress,
  List,
  Card,
  Empty,
} from 'antd';
import {
  PlayCircleOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleFilled,
  FormOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import type { Deck } from '../../domain/models';
import type { UploadProps } from 'antd';
import { studyRepository } from '../../services/repositories/studyRepository';
import { profileRepository } from '../../services/repositories/profileRepository';
import { parseImportText } from '../../domain/parser';
import { ImportModal } from './components/ImportModal';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface DeckWithStats extends Deck {
  cardCount: number;
  learnedCount: number;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

export const DecksPage: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [newDeckName, setNewDeckName] = useState('');
  const [parsedCount, setParsedCount] = useState(0);

  const navigate = useNavigate();
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const loadData = async () => {
    try {
      const profileId = profileRepository.getActiveProfileId();
      if (!profileId) return;
      const data = await studyRepository.getDecks(profileId);
      setDecks(data as DeckWithStats[]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('zapytania:profile-changed', loadData);
    return () =>
      window.removeEventListener('zapytania:profile-changed', loadData);
  }, []);

  const openModal = () => {
    setImportText('');
    setNewDeckName('');
    setParsedCount(0);
    setIsModalOpen(true);
  };

  const handleImportTextChange = (value: string) => {
    setImportText(value);
    const tempParsed = parseImportText(value);
    setParsedCount(tempParsed.length);
  };

  const handleFileUpload: UploadProps['beforeUpload'] = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        // Ustawiamy importText + parsujemy od razu
        setImportText(content);
        const tempParsed = parseImportText(content);
        setParsedCount(tempParsed.length);

        const fileName = file.name.replace(/\.[^/.]+$/, '');
        setNewDeckName(fileName);
        messageApi.success(t('decks.fileLoaded', { fileName: file.name }));
      }
    };
    reader.readAsText(file);
    return false;
  };

  const executeImport = async (
    deckId: number,
    profileId: number,
    cardsData: { front: string; back: string }[],
  ) => {
    try {
      const addedCount = await studyRepository.importCardsSmart(
        deckId,
        profileId,
        cardsData,
      );
      if (addedCount > 0) messageApi.success(t('decks.cardsAdded', { count: addedCount }));
      else messageApi.info(t('decks.allCardsExist'));
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      messageApi.error(t('decks.errorSave'));
    }
  };

  const handleSave = async () => {
    try {
      const profileId = profileRepository.getActiveProfileId();
      if (!profileId) return messageApi.error(t('decks.noActiveProfile'));

      const nameToSave = newDeckName.trim();
      if (!nameToSave) {
        messageApi.warning(t('decks.enterName'));
        return;
      }

      const cardsData = parseImportText(importText);
      const existingDeck = await studyRepository.findDeckByName(
        profileId,
        nameToSave,
      );

      if (existingDeck) {
        if (cardsData.length === 0) {
          messageApi.error(t('decks.duplicateName'));
          return;
        }
        modal.confirm({
          title: t('decks.mergeWith', { deckName: existingDeck.name }),
          icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />,
          content: `Dodasz ${cardsData.length} fiszek.`,
          okText: 'Scal',
          cancelText: 'Anuluj',
          onOk: () =>
            executeImport(existingDeck.id!, profileId, cardsData),
        });
      } else {
        const newDeckId = await studyRepository.createDeck(
          profileId,
          nameToSave,
        );
        if (cardsData.length > 0) {
          await executeImport(newDeckId as number, profileId, cardsData);
        } else {
          messageApi.success(t('decks.emptyDeckCreated'));
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (error) {
      messageApi.error(t('decks.errorCreate'));
    }
  };

  const handleDelete = async (id: number) => {
    await studyRepository.deleteDeck(id);
    messageApi.success(t('decks.deleted'));
    loadData();
  };

  // --- WIDOK DESKTOPOWY (Tabela) ---
  const desktopColumns = [
    {
      title: t('decks.name'),
      dataIndex: 'name',
      key: 'name',
      render: (t: string) => (
        <Text strong style={{ fontSize: 16 }}>
          {t}
        </Text>
      ),
    },
    {
      title: t('decks.progress'),
      key: 'progress',
      width: 300,
      render: (_: any, record: DeckWithStats) => {
        const percent =
          record.cardCount > 0
            ? Math.round((record.learnedCount / record.cardCount) * 100)
            : 0;
        return (
          <div style={{ textAlign: 'center' }}>
            <Progress percent={percent} size="small" status="active" />
            <div className="deck-progress-meta">
              <span>{t('decks.learned')}: {record.learnedCount}</span>
              <span>{t('decks.total')}: {record.cardCount}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: t('decks.actions'),
      key: 'action',
      align: 'right' as const,
      width: 250,
      render: (_: any, record: DeckWithStats) => (
        <Space>
          <Button
            type="primary"
            ghost
            icon={<PlayCircleOutlined />}
            onClick={() => navigate(`/quiz?deck=${record.id}&mode=srs`)}
            title={t('decks.srsQuiz')}
          />
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => navigate(`/quiz?deck=${record.id}&mode=all`)}
            title={t('decks.training')}
          />
          <Link to={`/decks/${record.id}`}>
            <Button icon={<EyeOutlined />} />
          </Link>
          <Popconfirm
            title={t('decks.confirmDelete')}
            onConfirm={() => handleDelete(record.id!)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (decks.length === 0 && profileRepository.getActiveProfileId()) {
    return (
      <main>
        {modalContextHolder}
        {messageContextHolder}
        <Empty
          description="Brak zestawów"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 50 }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openModal}
          >
            {t('decks.newDeck')}
          </Button>
        </Empty>
        <ImportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          parsedCount={parsedCount}
          newDeckName={newDeckName}
          setNewDeckName={setNewDeckName}
          handleFileUpload={handleFileUpload}
          importText={importText}
          onImportTextChange={handleImportTextChange}
        />
      </main>
    );
  }

  return (
    <main>
      {modalContextHolder}
      {messageContextHolder}

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, fontSize: isMobile ? 20 : 32 }}>
            {t('decks.yourDecks')}
          </Title>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={openModal}
        >
          {t('decks.newDeck')}
        </Button>
      </header>

      {isMobile ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={decks}
          renderItem={(item) => {
            const percent =
              item.cardCount > 0
                ? Math.round((item.learnedCount / item.cardCount) * 100)
                : 0;
            return (
              <List.Item>
                <Card
                  title={item.name}
                  size="small"
                  actions={[
                    <PlayCircleOutlined
                      key="srs"
                      onClick={() =>
                        navigate(`/quiz?deck=${item.id}&mode=srs`)
                      }
                      style={{ color: '#1890ff', fontSize: 20 }}
                    />,
                    <FormOutlined
                      key="write"
                      onClick={() =>
                        navigate(
                          `/quiz?deck=${item.id}&mode=srs&type=writing`,
                        )
                      }
                      style={{ color: '#faad14', fontSize: 20 }}
                    />,
                    <ThunderboltOutlined
                      key="train"
                      onClick={() =>
                        navigate(`/quiz?deck=${item.id}&mode=all`)
                      }
                      style={{ fontSize: 20 }}
                    />,
                    <Link to={`/decks/${item.id}`} key="edit">
                      <EyeOutlined
                        style={{ fontSize: 20, color: '#666' }}
                      />
                    </Link>,
                    <Popconfirm
                      key="del"
                      title="Usunąć?"
                      onConfirm={() => handleDelete(item.id!)}
                    >
                      <DeleteOutlined
                        style={{ color: '#ff4d4f', fontSize: 20 }}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <div style={{ marginBottom: 10 }}>
                    <Text type="secondary">
                      {item.cardCount} fiszek
                    </Text>
                    <Progress percent={percent} size="small" status="active" />
                  </div>
                </Card>
              </List.Item>
            );
          }}
        />
      ) : (
        <Table
          dataSource={decks}
          columns={desktopColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}

      <ImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        parsedCount={parsedCount}
        newDeckName={newDeckName}
        setNewDeckName={setNewDeckName}
        handleFileUpload={handleFileUpload}
        importText={importText}
        onImportTextChange={handleImportTextChange}
      />
    </main>
  );
};
