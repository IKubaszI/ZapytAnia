import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// POPRAWKA: Rozdzielenie importów wartości i typów
import { Table, Breadcrumb, Tag, Button, Modal, Input, Form, message, Space, Dropdown, Popconfirm } from 'antd';
import type { MenuProps } from 'antd'; 

import { PlusOutlined, DeleteOutlined, DownOutlined, ReloadOutlined, ExportOutlined, FileTextOutlined } from '@ant-design/icons';
import { studyRepository } from '../../services/repositories/studyRepository';
import { profileRepository } from '../../services/repositories/profileRepository';
import type { Card } from '../../domain/models';

export const DeckDetailsPage: React.FC = () => {
  const { deckId } = useParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  
  // Stan dla zaznaczonych wierszy (Bulk Actions)
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
    
    message.success('Dodano fiszkę');
    setIsModalOpen(false);
    form.resetFields();
    loadCards();
  };

  const handleDeleteCard = async (id: number) => {
      await studyRepository.deleteCard(id);
      message.success('Usunięto fiszkę');
      loadCards();
  };

  // --- BULK ACTIONS ---
  const handleBulkDelete = async () => {
      if (selectedRowKeys.length === 0) return;
      await studyRepository.bulkDeleteCards(selectedRowKeys as number[]);
      message.success(`Usunięto ${selectedRowKeys.length} fiszek`);
      setSelectedRowKeys([]);
      loadCards();
  };

  const handleBulkReset = async () => {
      if (selectedRowKeys.length === 0) return;
      await studyRepository.bulkResetProgress(selectedRowKeys as number[]);
      message.success(`Zresetowano postęp ${selectedRowKeys.length} fiszek`);
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
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Konfiguracja zaznaczania wierszy
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => setSelectedRowKeys(newSelectedRowKeys),
  };

  const columns = [
    { title: 'Słowo / Pytanie', dataIndex: 'front', key: 'front', width: '40%' },
    { title: 'Tłumaczenie / Odpowiedź', dataIndex: 'back', key: 'back', width: '40%' },
    { 
        title: 'Stan SRS', 
        key: 'srs',
        render: (_: any, r: Card) => (
            <Tag color={r.repetitions === 0 ? 'blue' : r.repetitions > 4 ? 'green' : 'orange'}>
                {r.repetitions === 0 ? 'Nowa' : `Powtórki: ${r.repetitions}`}
            </Tag>
        )
    },
    {
        title: 'Akcje',
        key: 'action',
        render: (_: any, r: Card) => (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCard(r.id!)} />
        )
    }
  ];

  // Menu dla przycisku "Masowe akcje"
  const bulkMenu: MenuProps['items'] = [
      { key: 'reset', label: 'Zresetuj postęp SRS', icon: <ReloadOutlined />, onClick: handleBulkReset },
      { type: 'divider' },
      { key: 'delete', label: 'Usuń zaznaczone', icon: <DeleteOutlined />, danger: true, onClick: handleBulkDelete },
  ];

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
          <Breadcrumb items={[{ title: <Link to="/">Zestawy</Link> }, { title: 'Szczegóły i Edycja' }]} />
          
          <Space>
            <Button icon={<FileTextOutlined />} onClick={handleExportCSV}>CSV</Button>
            
            {selectedRowKeys.length > 0 && (
                <Dropdown menu={{ items: bulkMenu }}>
                    <Button>
                        Wybrano: {selectedRowKeys.length} <DownOutlined />
                    </Button>
                </Dropdown>
            )}
            
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                Dodaj fiszkę
            </Button>
          </Space>
      </div>
      
      <Table 
        rowSelection={rowSelection}
        dataSource={cards} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 10 }} 
      />

      <Modal 
        title="Dodaj nową fiszkę" 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
          <Form form={form} onFinish={handleAddCard} layout="vertical">
              <Form.Item name="front" label="Przód (Pytanie)" rules={[{ required: true }]}>
                  <Input autoFocus placeholder="np. cat" />
              </Form.Item>
              <Form.Item name="back" label="Tył (Odpowiedź)" rules={[{ required: true }]}>
                  <Input placeholder="np. kot" />
              </Form.Item>
          </Form>
      </Modal>
    </div>
  );
};