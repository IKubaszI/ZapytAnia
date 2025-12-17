import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Table, Breadcrumb, Tag, Button, Modal, Input, Form,
    message, Space, Dropdown, List, Card, Typography, Popconfirm
} from 'antd';
import type { MenuProps } from 'antd';
import {
    FileTextOutlined, PlusOutlined, DeleteOutlined, DownOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { studyRepository } from '../../services/repositories/studyRepository';
import { profileRepository } from '../../services/repositories/profileRepository';
import { useTranslation } from 'react-i18next';
import type { Card as CardModel } from '../../domain/models';

const { Text } = Typography;

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isMobile;
};

export const DeckDetailsPage: React.FC = () => {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { deckId } = useParams();
    const [cards, setCards] = useState<CardModel[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const loadCards = () => {
        if (deckId) {
            studyRepository.getCardsForDeck(parseInt(deckId)).then(setCards);
        }
    };

    useEffect(() => {
        loadCards();
    }, [deckId]);

    const handleAddCard = async (values: { front: string; back: string }) => {
        const profileId = profileRepository.getActiveProfileId();
        if (!profileId || !deckId) return;

        await studyRepository.createCard({
            deckId: parseInt(deckId),
            profileId,
            front: values.front,
            back: values.back,
            nextReviewAt: Date.now(),
            ease: 2.5,
            interval: 0,
            repetitions: 0
        });

        message.success(t('deckDetails.cardAdded'));
        form.resetFields();
        loadCards();
    };

    const handleDeleteCard = async (id: number) => {
        await studyRepository.deleteCard(id);
        message.success(t('deckDetails.cardDeleted'));
        loadCards();
    };

    const handleBulkDelete = async () => {
        if (selectedRowKeys.length === 0) return;
        await studyRepository.bulkDeleteCards(selectedRowKeys as number[]);
        message.success(t('deckDetails.deletedCount', { count: selectedRowKeys.length }));
        setSelectedRowKeys([]);
        loadCards();
    };

    const handleBulkReset = async () => {
        if (selectedRowKeys.length === 0) return;
        await studyRepository.bulkResetProgress(selectedRowKeys as number[]);
        message.success(t('deckDetails.progressResetCount', { count: selectedRowKeys.length }));
        setSelectedRowKeys([]);
        loadCards();
    };

    const handleExportCSV = async () => {
        if (!deckId) return;
        const csv = await studyRepository.exportDeckToCSV(parseInt(deckId));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `zestaw_${deckId}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => setSelectedRowKeys(newSelectedRowKeys),
    };

    const columns = [
        { title: t('deckDetails.front'), dataIndex: 'front', key: 'front', width: '40%', render: (t: string) => <Text strong>{t}</Text> },
        { title: t('deckDetails.back'), dataIndex: 'back', key: 'back', width: '40%' },
        { title: t('deckDetails.status'), key: 'srs', render: (_: any, r: CardModel) => <Tag color={r.repetitions === 0 ? 'blue' : r.repetitions > 4 ? 'green' : 'orange'}>{r.repetitions === 0 ? t('deckDetails.new') : `${t('deckDetails.reps')}: ${r.repetitions}`}</Tag> },
        { title: '', key: 'action', render: (_: any, r: CardModel) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCard(r.id!)} /> }
    ];

    const bulkMenu: MenuProps['items'] = [
        { key: 'reset', label: t('deckDetails.resetSelected'), icon: <ReloadOutlined />, onClick: handleBulkReset },
        { type: 'divider' },
        { key: 'delete', label: t('deckDetails.deleteSelected'), icon: <DeleteOutlined />, danger: true, onClick: handleBulkDelete },
    ];

    return (
        <main style={{ paddingBottom: 80 }}> {/* Padding bottom na mobile żeby nie zasłaniać treści */}

            {/* NAGŁÓWEK - Responsywny */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: 20,
                gap: 16
            }}>
                <Breadcrumb items={[{ title: <Link to="/">{t('nav.decks')}</Link> }, { title: t('deckDetails.title') }]} />

                <Space wrap style={{ width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                    <Space>
                        <Button icon={<FileTextOutlined />} onClick={handleExportCSV}>{!isMobile && "CSV"}</Button>
                        {selectedRowKeys.length > 0 && (
                            <Dropdown menu={{ items: bulkMenu }}>
                                <Button>{t('deckDetails.selected')}: {selectedRowKeys.length} <DownOutlined /></Button>
                            </Dropdown>
                        )}
                    </Space>

                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} style={{ flex: isMobile ? 1 : 0 }}>
                        {t('deckDetails.addCard')}
                    </Button>
                </Space>
            </div>

            {/* TREŚĆ - Lista (Mobile) lub Tabela (PC) */}
            {isMobile ? (
                <List
                    dataSource={cards}
                    renderItem={(item) => (
                        <List.Item style={{ padding: '8px 0' }}>
                            <Card
                                style={{ width: '100%' }}
                                size="small"
                                actions={[
                                    <div style={{ color: '#888', fontSize: 12 }}>
                                        {item.repetitions === 0 ? t('deckDetails.new') : `${t('deckDetails.reviews')}: ${item.repetitions}`}
                                    </div>,
                                    <Popconfirm title="Usunąć?" onConfirm={() => handleDeleteCard(item.id!)}>
                                        <DeleteOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                                    </Popconfirm>
                                ]}
                            >
                                <div style={{ marginBottom: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 10 }}>PYTANIE</Text>
                                    <div style={{ fontSize: 16, fontWeight: 600 }}>{item.front}</div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 10 }}>ODPOWIEDŹ</Text>
                                    <div style={{ fontSize: 16 }}>{item.back}</div>
                                </div>
                            </Card>
                        </List.Item>
                    )}
                />
            ) : (
                <Table
                    rowSelection={rowSelection}
                    dataSource={cards}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            )}

            {/* MODAL DODAWANIA - Responsywny */}
            <Modal
                title={t('deckDetails.addNewCard')}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                width={isMobile ? '95%' : 500}
                style={{ top: isMobile ? 20 : 100 }}
                okText={t('deckDetails.addAndNext')}
            >
                <Form form={form} onFinish={handleAddCard} layout="vertical">
                    <Form.Item name="front" label={t('deckDetails.frontLabel')} rules={[{ required: true, message: t('deckDetails.frontRequired') }]}>
                        <Input autoFocus placeholder={t('deckDetails.frontPlaceholder')} size="large" />
                    </Form.Item>
                    <Form.Item name="back" label={t('deckDetails.backLabel')} rules={[{ required: true, message: t('deckDetails.backRequired') }]}>
                        <Input placeholder={t('deckDetails.backPlaceholder')} size="large" />
                    </Form.Item>
                </Form>
            </Modal>
        </main>
    );
};