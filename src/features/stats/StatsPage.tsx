import React, { useEffect, useState } from 'react';
import { Row, Col, Statistic, Card, Typography, Tooltip, Empty, Button, message, Upload, List, InputNumber } from 'antd';
import { FireOutlined, CheckCircleOutlined, HistoryOutlined, DownloadOutlined, UploadOutlined, TrophyFilled, LockOutlined, EditOutlined } from '@ant-design/icons';
import { studyRepository } from '../../services/repositories/studyRepository';
import { profileRepository } from '../../services/repositories/profileRepository';
import type { Review } from '../../domain/models';
import dayjs from 'dayjs';
import CountUp from 'react-countup';

const { Title, Text } = Typography;

const formatter = (value: number | string) => <CountUp end={Number(value)} separator=" " duration={2.0} />;

const ACHIEVEMENTS = [
    // Łatwe
    { id: 'first_step', title: 'Pierwszy Krok', desc: 'Zrób pierwszą powtórkę', condition: (stats: any) => stats.total >= 1 },
    { id: 'master', title: 'Dobry Start', desc: '10 poprawnych odpowiedzi', condition: (stats: any) => stats.correct >= 10 },
    { id: 'hot_streak', title: 'W Ogniu', desc: 'Ucz się przez 3 dni z rzędu', condition: (stats: any) => stats.streak >= 3 },
    
    // Średnie
    { id: 'week_warrior', title: 'Tygodniowy Wojownik', desc: 'Ucz się przez 7 dni z rzędu', condition: (stats: any) => stats.streak >= 7 },

    { id: 'unstoppable', title: 'Nie do zatrzymania', desc: 'Ucz się przez 14 dni z rzędu', condition: (stats: any) => stats.streak >= 14 },
    { id: 'veteran', title: 'Weteran', desc: 'Zrób łącznie 50 powtórek', condition: (stats: any) => stats.total >= 50 },
    { id: 'perfectionist', title: 'Perfekcjonista', desc: '50 poprawnych odpowiedzi', condition: (stats: any) => stats.correct >= 50 },

    // Trudne
    { id: 'marathon', title: 'Maratończyk', desc: 'Zrób łącznie 100 powtórek', condition: (stats: any) => stats.total >= 100 },
    { id: 'XD?', title: 'JAK ty tu ?', desc: '1000 powtórek', condition: (stats: any) => stats.total >= 1000 },
  ];

export const StatsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [streak, setStreak] = useState(0);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [statsMetrics, setStatsMetrics] = useState({ total: 0, streak: 0, correct: 0 });
  
  // Globalny Cel
  const [dailyGoal, setDailyGoal] = useState(20);
  const [todayCount, setTodayCount] = useState(0);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const loadStats = async () => {
    const profileId = profileRepository.getActiveProfileId();
    if (!profileId) return;

    const data = await studyRepository.getStats(profileId);
    setReviews(data);
    calculateMetrics(data);

    // Zliczanie z wszystkich zestawów
    const today = await studyRepository.getTodayReviewCount(profileId);
    setTodayCount(today);

    const savedGoal = localStorage.getItem('zapytania.dailyGoal');
    if (savedGoal) setDailyGoal(parseInt(savedGoal));
  };

  const saveGoal = () => {
      localStorage.setItem('zapytania.dailyGoal', dailyGoal.toString());
      setIsEditingGoal(false);
      message.success("Cel zaktualizowany!");
  };

  const calculateMetrics = (data: Review[]) => {
    const activityMap: Record<string, number> = {};
    data.forEach(r => {
        const dateKey = dayjs(r.reviewedAt).format('YYYY-MM-DD');
        activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
    });
    setHeatmapData(activityMap);

    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    let currentStreak = 0;
    if (activityMap[today] || activityMap[yesterday]) {
        let checkDate = dayjs();
        if (!activityMap[today]) checkDate = checkDate.subtract(1, 'day');
        while (activityMap[checkDate.format('YYYY-MM-DD')] > 0) {
            currentStreak++;
            checkDate = checkDate.subtract(1, 'day');
        }
    }
    setStreak(currentStreak);
    setStatsMetrics({ total: data.length, streak: currentStreak, correct: data.filter(r => r.grade >= 3).length });
  };

  useEffect(() => {
    loadStats();
    window.addEventListener('zapytania:stats-changed', loadStats);
    return () => window.removeEventListener('zapytania:stats-changed', loadStats);
  }, []);

  const handleDownloadBackup = async () => {
    const profileId = profileRepository.getActiveProfileId();
    if (!profileId) return;
    try {
      const json = await studyRepository.exportProfileData(profileId);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${dayjs().format('YYYY-MM-DD')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success("Pobrano kopię zapasową!");
    } catch (e) { message.error("Błąd eksportu"); }
  };

  const handleRestoreBackup = async (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
          if (e.target?.result) {
              try {
                  await studyRepository.importProfileData(e.target.result as string);
                  message.success("Przywrócono!");
                  setTimeout(() => window.location.reload(), 1000);
              } catch (err) { message.error("Błąd pliku"); }
          }
      };
      reader.readAsText(file);
      return false;
  };

  const renderHeatmap = () => {
      const days = [];
      for (let i = 29; i >= 0; i--) {
          const date = dayjs().subtract(i, 'day');
          const dateKey = date.format('YYYY-MM-DD');
          const count = heatmapData[dateKey] || 0;
          let bgColor = '#ebedf0';
          if (count > 0) bgColor = '#9be9a8';
          if (count >= 5) bgColor = '#40c463';
          if (count >= 10) bgColor = '#30a14e';
          if (count >= 20) bgColor = '#216e39';
          if (document.body.classList.contains('dark-mode') && count === 0) bgColor = '#333';
          days.push(<Tooltip title={`${dateKey}: ${count}`} key={dateKey}><div style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: bgColor, transition: 'all 0.3s' }} /></Tooltip>);
      }
      return <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{days}</div>;
  };

  if (!profileRepository.getActiveProfileId()) return <Empty description="Wybierz profil" />;

  const accuracy = reviews.length > 0 ? Math.round((statsMetrics.correct / reviews.length) * 100) : 0;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Title level={2}>Twoje Statystyki</Title>
          <Card size="small" style={{ borderColor: '#1890ff' }}>
             <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                {isEditingGoal ? (
                    <>
                        <InputNumber min={1} max={500} value={dailyGoal} onChange={(v) => setDailyGoal(v || 20)} size="small" />
                        <Button type="primary" size="small" onClick={saveGoal}>OK</Button>
                    </>
                ) : (
                    <>
                        <Text strong>Cel na dziś: <span style={{color: todayCount >= dailyGoal ? '#52c41a' : '#1890ff'}}>{todayCount}</span> / {dailyGoal}</Text>
                        <EditOutlined onClick={() => setIsEditingGoal(true)} style={{cursor: 'pointer', color: '#999'}} />
                    </>
                )}
             </div>
          </Card>
      </div>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><Card hoverable><Statistic title="Streak (dni)" value={streak} formatter={formatter} prefix={<FireOutlined style={{ color: '#fa541c' }} />} /></Card></Col>
        <Col xs={24} sm={8}><Card hoverable><Statistic title="Wszystkie powtórki" value={reviews.length} formatter={formatter} prefix={<HistoryOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card hoverable><Statistic title="Poprawne odp." value={accuracy} formatter={formatter} suffix="%" prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} /></Card></Col>
      </Row>

      <div style={{ marginTop: 32 }}><Title level={4}>Aktywność (30 dni)</Title><Card>{renderHeatmap()}</Card></div>

      <div style={{ marginTop: 32 }}>
          <Title level={4}>Osiągnięcia</Title>
          <List grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }} dataSource={ACHIEVEMENTS} renderItem={(item) => {
                const unlocked = item.condition(statsMetrics);
                return (
                    <List.Item>
                        <Card style={{ opacity: unlocked ? 1 : 0.5, textAlign: 'center', backgroundColor: unlocked ? (document.body.classList.contains('dark-mode') ? '#443b21' : '#fffbe6') : undefined, borderColor: unlocked ? '#faad14' : undefined }}>
                            <div style={{fontSize: 28, color: unlocked ? '#faad14' : '#ccc', marginBottom: 8}}>{unlocked ? <TrophyFilled /> : <LockOutlined />}</div>
                            <Text strong style={{ display: 'block' }}>{item.title}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                        </Card>
                    </List.Item>
                )
            }} />
      </div>

      <div style={{ marginTop: 40, marginBottom: 40 }}>
        <Title level={4}>Dane</Title>
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <Text type="secondary">Kopia zapasowa (.json)</Text>
                <div style={{display: 'flex', gap: 10}}>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadBackup}>Pobierz</Button>
                    <Upload showUploadList={false} beforeUpload={handleRestoreBackup} accept=".json"><Button icon={<UploadOutlined />}>Wgraj</Button></Upload>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};