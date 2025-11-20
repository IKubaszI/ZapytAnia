import React, { useEffect, useState } from 'react';
import { Card, Typography, List, Button, Empty, Progress, Badge, Tooltip } from 'antd';
import { FormOutlined, PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { studyRepository } from '../../services/repositories/studyRepository';
import { profileRepository } from '../../services/repositories/profileRepository';
import type { Deck } from '../../domain/models';

const { Title, Text } = Typography;

interface DeckWithStats extends Deck {
    cardCount: number;
    learnedCount: number;
}

export const WritingPage: React.FC = () => {
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
      return (
        <Empty 
            description="Brak zestawów do nauki" 
            style={{marginTop: 50}} 
        >
            <Button type="primary" onClick={() => navigate('/')}>Dodaj zestaw w zakładce Zestawy</Button>
        </Empty>
      );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2}><FormOutlined /> Trening Pisania</Title>
        <Text type="secondary">Wybierz tryb i wpisuj poprawne odpowiedzi. To najlepszy sposób na utrwalenie pisowni!</Text>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 2 }}
        dataSource={decks}
        renderItem={(deck) => {
            const percent = deck.cardCount > 0 ? Math.round((deck.learnedCount / deck.cardCount) * 100) : 0;
            
            return (
                <List.Item>
                    <Badge.Ribbon text={`${deck.cardCount} fiszek`} color="blue">
                        <Card 
                            hoverable 
                            actions={[
                                // PRZYCISK 1: NAUKA (SRS)
                                <Tooltip title="Inteligentna powtórka (SRS)">
                                    <div 
                                        key="srs" 
                                        onClick={() => navigate(`/quiz?deck=${deck.id}&mode=srs&type=writing`)} 
                                        style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, height: '100%', color: '#1890ff', fontWeight: 500}}
                                    >
                                        <PlayCircleOutlined /> NAUKA
                                    </div>
                                </Tooltip>,
                                
                                // PRZYCISK 2: TRENING (WSZYSTKIE)
                                <Tooltip title="Przećwicz wszystkie słówka (bez wpływu na statystyki)">
                                    <div 
                                        key="train" 
                                        onClick={() => navigate(`/quiz?deck=${deck.id}&mode=all&type=writing`)} 
                                        style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, height: '100%', color: '#faad14', fontWeight: 500}}
                                    >
                                        <ThunderboltOutlined /> TRENING
                                    </div>
                                </Tooltip>
                            ]}
                        >
                            <Card.Meta
                                title={<div style={{fontSize: 18}}>{deck.name}</div>}
                                description={
                                    <div style={{marginTop: 10}}>
                                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2}}>
                                            <span>Opanowanie materiału:</span>
                                            <span>{percent}%</span>
                                        </div>
                                        <Progress percent={percent} showInfo={false} size="small" status="active" />
                                    </div>
                                }
                            />
                        </Card>
                    </Badge.Ribbon>
                </List.Item>
            );
        }}
      />
    </div>
  );
};