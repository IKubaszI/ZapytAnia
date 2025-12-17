import React from 'react';
import { Modal, Input, Alert, Upload, Space } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useTranslation } from 'react-i18next';

const { Dragger } = Upload;

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    parsedCount: number;
    newDeckName: string;
    setNewDeckName: (value: string) => void;
    handleFileUpload: UploadProps['beforeUpload'];
    importText: string;
    onImportTextChange: (value: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
    isOpen,
    onClose,
    onSave,
    parsedCount,
    newDeckName,
    setNewDeckName,
    handleFileUpload,
    importText,
    onImportTextChange,
}) => {
    const { t } = useTranslation();
    return (
        <Modal
            title={t('decks.createImport')}
            open={isOpen}
            onOk={onSave}
            onCancel={onClose}
            okText={t('common.save')}
            cancelText={t('common.cancel')}
            okButtonProps={{ disabled: !newDeckName.trim() }}
        >
            <Space
                direction="vertical"
                style={{ width: '100%', gap: 20 }}
            >
                <Alert
                    message={t('decks.importInfo')}
                    type="info"
                    showIcon
                />

                <Dragger
                    name="file"
                    multiple={false}
                    beforeUpload={handleFileUpload}
                    showUploadList={false}
                    style={{ padding: 20 }}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                        {t('decks.uploadFile')}
                    </p>
                </Dragger>

                <Input
                    addonBefore={t('decks.name')}
                    placeholder={t('decks.namePlaceholder')}
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                />

                <Input.TextArea
                    rows={6}
                    placeholder={t('decks.textPlaceholder')}
                    value={importText}
                    onChange={(e) => onImportTextChange(e.target.value)}
                />

                {parsedCount > 0 && (
                    <Alert
                        message={t('decks.detected', { count: parsedCount })}
                        type="success"
                        showIcon
                    />
                )}
            </Space>
        </Modal>
    );
};
