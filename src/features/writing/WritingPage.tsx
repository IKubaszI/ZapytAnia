import React, { useEffect, useState } from 'react';
import { Card, Typography, List, Button, Empty, Progress, Badge } from 'antd';
import { FormOutlined, PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { studyRepository } from '../../services/repositories/studyRepository';
import { profileRepository } from '../../services/repositories/profileRepository';
import type { Deck } from '../../domain/models';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
interface DeckWithStats extends Deck { cardCount: number; learnedCount: number; }

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

export const WritingPage: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDecks = async () => {
      const profileId = profileRepository.getActiveProfileId();
      if (!profileId) return;
      const data = await studyRepository.getDecks(profileId);
      setDecks(data as DeckWithStats[]);
    };
    loadDecks();
  }, []);

  if (decks.length === 0) {
    return (<Empty description={t('writing.noDecks')} style={{ marginTop: 50 }}> <Button type="primary" onClick={() => navigate('/')}>{t('writing.addDeck')}</Button> </Empty>);
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2}><FormOutlined /> {t('writing.title')}</Title>
        <Text type="secondary">{t('writing.description')}</Text>
      </header>

      <List
        grid={isMobile ? { gutter: 16, column: 1 } : { gutter: 16, column: 2 }}
        dataSource={decks}
        renderItem={(deck) => {
          const percent = deck.cardCount > 0 ? Math.round((deck.learnedCount / deck.cardCount) * 100) : 0;
          return (
            <List.Item>
              <Badge.Ribbon text={`${deck.cardCount}`} color="blue">
                <Card hoverable actions={[
                  <div key="srs" onClick={() => navigate(`/quiz?deck=${deck.id}&mode=srs&type=writing`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#1890ff', padding: 8, cursor: 'pointer' }}>
                    <PlayCircleOutlined style={{ fontSize: 20 }} /> <span style={{ fontSize: 12 }}>{t('writing.learn')}</span>
                  </div>,
                  <div key="train" onClick={() => navigate(`/quiz?deck=${deck.id}&mode=all&type=writing`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#faad14', padding: 8, cursor: 'pointer' }}>
                    <ThunderboltOutlined style={{ fontSize: 20 }} /> <span style={{ fontSize: 12 }}>{t('writing.training')}</span>
                  </div>
                ]}>
                  <Card.Meta title={<span style={{ fontSize: 16 }}>{deck.name}</span>} description={<Progress percent={percent} showInfo={false} size="small" />} />
                </Card>
              </Badge.Ribbon>
            </List.Item>
          );
        }}
      />
    </main>
  );
};