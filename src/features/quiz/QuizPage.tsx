import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card as AntCard, Button, Row, Col, Typography, Progress, Result, Switch, Space, Tooltip, message, Input, Alert } from 'antd';
import { SmileOutlined, UndoOutlined, SoundOutlined, TranslationOutlined, CheckCircleFilled, CloseCircleFilled, EnterOutlined } from '@ant-design/icons';
import { studyRepository } from '../../services/repositories/studyRepository';
import { profileRepository } from '../../services/repositories/profileRepository';
import { calculateNextReview } from '../../domain/srs';
import { Grade, type Card } from '../../domain/models';
import Confetti from 'react-confetti';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const DAILY_GOAL = 20;

export const QuizPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const deckId = searchParams.get('deck');
    const mode = searchParams.get('mode') as 'srs' | 'all';
    const quizType = searchParams.get('type') as 'writing' | null;

    const [queue, setQueue] = useState<Card[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayedIndex, setDisplayedIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(true);

    const [reverseMode, setReverseMode] = useState(false);
    const [previousCardState, setPreviousCardState] = useState<Card | null>(null);
    const [canUndo, setCanUndo] = useState(false);

    const [userAnswer, setUserAnswer] = useState('');
    const [checkResult, setCheckResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const inputRef = useRef<any>(null);

    const [dailyGoal, setDailyGoal] = useState(DAILY_GOAL);
    const [todayCount, setTodayCount] = useState(0);

    useEffect(() => {
        const loadCards = async () => {
            const profileId = profileRepository.getActiveProfileId();
            if (!profileId || !deckId) return;

            const savedGoal = localStorage.getItem('zapytania.dailyGoal');
            if (savedGoal) setDailyGoal(parseInt(savedGoal));
            const today = await studyRepository.getTodayReviewCount(profileId);
            setTodayCount(today);

            let cards: Card[] = [];
            if (mode === 'srs') cards = await studyRepository.getDueCards(parseInt(deckId), Date.now());
            else cards = await studyRepository.getCardsForDeck(parseInt(deckId));

            setQueue(cards.sort(() => Math.random() - 0.5));
            setLoading(false);
        };
        loadCards();
    }, [deckId, mode]);

    useEffect(() => {
        if (quizType === 'writing' && !isFlipped && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [displayedIndex, isFlipped, quizType]);

    const checkWrittenAnswer = () => {
        const card = queue[displayedIndex];
        const correctText = reverseMode ? card.front : card.back;

        const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

        if (normalize(userAnswer) === normalize(correctText)) {
            setCheckResult('correct');
            speak(correctText);
        } else {
            setCheckResult('wrong');
        }
        setIsFlipped(true);
    };

    const handleGrade = async (grade: number) => {
        const currentCard = queue[currentIndex];
        const profileId = profileRepository.getActiveProfileId();

        if (profileId && currentCard.id && deckId) {
            setPreviousCardState({ ...currentCard });
            setCanUndo(true);
            await studyRepository.saveReview({ cardId: currentCard.id, profileId, deckId: parseInt(deckId), grade, reviewedAt: Date.now(), mode: mode === 'all' ? 'training' : 'srs' });
            if (mode === 'srs') await studyRepository.updateCard(calculateNextReview(currentCard, grade));
            setTodayCount(prev => prev + 1);
        }

        if (currentIndex < queue.length - 1) {
            setIsFlipped(false);
            // Immediate update as requested
            setCurrentIndex(prev => prev + 1);
            setDisplayedIndex(prev => prev + 1);
            setUserAnswer('');
            setCheckResult('idle');
        } else {
            setFinished(true);
        }
        window.dispatchEvent(new Event('zapytania:stats-changed'));
    };

    const handleUndo = async () => {
        if (!canUndo || !previousCardState || currentIndex === 0) return;
        try {
            await studyRepository.undoLastReview(previousCardState.id!, previousCardState);
            setCurrentIndex(prev => prev - 1);
            setDisplayedIndex(prev => prev - 1);
            setIsFlipped(true);
            setCheckResult('idle');
            setTodayCount(prev => Math.max(0, prev - 1));
            setCanUndo(false);
            setPreviousCardState(null);
            message.info(t('quiz.undo'));
            window.dispatchEvent(new Event('zapytania:stats-changed'));
        } catch (e) { message.error(t('common.error')); }
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    const openDictionary = (text: string) => {
        window.open(`https://translate.google.com/?sl=auto&tl=pl&text=${encodeURIComponent(text)}&op=translate`, '_blank');
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (loading || finished) return;
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); return; }

        if (quizType === 'writing') {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (!isFlipped) {
                    checkWrittenAnswer();
                } else {
                    const grade = checkResult === 'correct' ? Grade.Good : Grade.Again;
                    handleGrade(grade);
                }
            }
            return;
        }

        if (!isFlipped) {
            if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); setIsFlipped(true); }
        } else {
            if (mode === 'srs') {
                if (e.key === '1') handleGrade(Grade.Again);
                if (e.key === '2') handleGrade(Grade.Hard);
                if (e.key === '3') handleGrade(Grade.Good);
            } else {
                if (e.key === '1') handleGrade(0);
                if (e.key === '2') handleGrade(5);
            }
            if (e.code === 'Space') { e.preventDefault(); setIsFlipped(false); }
            if (e.code === 'Enter') { e.preventDefault(); handleGrade(mode === 'srs' ? Grade.Good : 5); }
        }
    }, [loading, finished, isFlipped, mode, currentIndex, canUndo, previousCardState, quizType, userAnswer, checkResult]);

    useEffect(() => {
        if (quizType !== 'writing') {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleKeyDown, quizType]);

    if (loading) return null;

    if (queue.length === 0 && !finished) {
        if (mode === 'srs') return <Result icon={<SmileOutlined style={{ color: '#52c41a' }} />} title={t('quiz.noCards')} subTitle={t('quiz.comeBackTomorrow')} extra={[<Button type="primary" onClick={() => navigate('/')}>{t('common.back')}</Button>]} />;
        return <Result title={t('quiz.empty')} extra={[<Button onClick={() => navigate('/')}>{t('common.back')}</Button>]} />;
    }

    if (finished) return (
        <>
            <Confetti recycle={false} numberOfPieces={500} />
            <Result status="success" title={t('quiz.finished')} subTitle={t('quiz.congratulations')} extra={[<Button type="primary" onClick={() => navigate('/stats')}>{t('nav.stats')}</Button>, <Button onClick={() => navigate('/')}>{t('common.back')}</Button>]} />
        </>
    );

    const card = queue[displayedIndex];
    const question = reverseMode ? card.back : card.front;
    const answer = reverseMode ? card.front : card.back;
    const goalPercent = Math.min(100, Math.round((todayCount / dailyGoal) * 100));

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 20 }}>

            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <Text type="secondary" strong>{t('quiz.dailyGoal')}: {todayCount} / {dailyGoal}</Text>
                    <Space>
                        <Tooltip title={t('quiz.reverseMode')}><Switch checkedChildren="Rev" unCheckedChildren="Std" checked={reverseMode} onChange={setReverseMode} /></Tooltip>
                        <Button icon={<UndoOutlined />} disabled={!canUndo} onClick={handleUndo} />
                    </Space>
                </div>
                <Progress percent={goalPercent} showInfo={false} strokeColor="#1890ff" size="small" />
            </div>

            <div style={{ marginBottom: 20, fontSize: 12, color: '#999', textAlign: 'left' }}>
                Fiszka: {currentIndex + 1} / {queue.length}
                <Progress percent={Math.round(((currentIndex) / queue.length) * 100)} showInfo={false} size="small" strokeColor="#52c41a" style={{ marginTop: 5 }} />
            </div>

            {quizType === 'writing' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <AntCard>
                        <div style={{ fontSize: 24, marginBottom: 10 }}>{question}</div>
                        {!isFlipped ? (
                            <Input
                                ref={inputRef}
                                size="large"
                                placeholder={t('quiz.typeAnswer')}
                                value={userAnswer}
                                onChange={e => setUserAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && checkWrittenAnswer()}
                                suffix={<EnterOutlined style={{ color: '#ccc' }} />}
                                autoFocus
                            />
                        ) : (
                            <div>
                                {checkResult === 'correct' ? (
                                    <Alert message={<span style={{ fontSize: 18 }}>{t('quiz.correct')} <b>{answer}</b></span>} type="success" showIcon icon={<CheckCircleFilled />} />
                                ) : (
                                    <Alert message={<span style={{ fontSize: 16 }}>{t('quiz.incorrect')} {t('quiz.yourAnswer')}: <s>{userAnswer}</s></span>} description={<span style={{ fontSize: 18 }}>{t('quiz.correctAnswer')}: <b>{answer}</b></span>} type="error" showIcon icon={<CloseCircleFilled />} />
                                )}
                            </div>
                        )}
                    </AntCard>
                    {isFlipped && (
                        <div style={{ marginTop: 10 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 10 }}>{t('quiz.rateResult')}</Text>
                            <Row gutter={16}>
                                <Col span={8}><Button danger block size="large" onClick={() => handleGrade(Grade.Again)}>{t('quiz.wrong')} (1)</Button></Col>
                                <Col span={8}><Button block size="large" onClick={() => handleGrade(Grade.Hard)}>{t('quiz.typo')} (2)</Button></Col>
                                <Col span={8}><Button type="primary" block size="large" onClick={() => handleGrade(Grade.Good)} style={checkResult === 'correct' ? { boxShadow: '0 0 10px #52c41a' } : {}}>{t('quiz.perfect')} (3)</Button></Col>
                            </Row>
                        </div>
                    )}
                    {!isFlipped && <Button type="primary" block size="large" onClick={checkWrittenAnswer}>{t('quiz.check')}</Button>}
                </div>
            ) : (
                <>
                    <div className={`flip-container ${isFlipped ? 'flipped' : ''}`}>
                        <div className="flipper">
                            <div className="front">
                                <div style={{ fontSize: 24, marginBottom: 20 }}>{question}</div>
                                <Button type="text" icon={<SoundOutlined />} onClick={(e) => { e.stopPropagation(); speak(question); }} />
                            </div>
                            <div className="back">
                                <div style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold' }}>{answer}</div>
                                <div style={{ marginTop: 20 }}><Button size="small" icon={<TranslationOutlined />} onClick={() => openDictionary(answer)}>{t('quiz.dictionary')}</Button></div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 30 }}>
                        {!isFlipped ? (
                            <Button type="primary" size="large" block onClick={() => setIsFlipped(true)}>{t('quiz.showKey')}</Button>
                        ) : (
                            <Row gutter={16}>
                                {mode === 'srs' ? (
                                    <>
                                        <Col span={8}><Button danger block size="large" onClick={() => handleGrade(Grade.Again)}>1</Button></Col>
                                        <Col span={8}><Button block size="large" onClick={() => handleGrade(Grade.Hard)}>2</Button></Col>
                                        <Col span={8}><Button type="primary" block size="large" onClick={() => handleGrade(Grade.Good)}>3</Button></Col>
                                    </>
                                ) : (
                                    <>
                                        <Col span={12}><Button danger block size="large" onClick={() => handleGrade(0)}>{t('quiz.wrong')}</Button></Col>
                                        <Col span={12}><Button type="primary" block size="large" onClick={() => handleGrade(5)}>{t('quiz.good')}</Button></Col>
                                    </>
                                )}
                            </Row>
                        )}
                    </div>
                </>
            )}

            <div style={{ marginTop: 20, fontSize: 12, color: '#999' }}>
                {quizType === 'writing' ? t('quiz.writingHint') : (mode === 'srs' ? t('quiz.quizHint') : t('quiz.trainingHint'))}
            </div>
        </div>
    );
};