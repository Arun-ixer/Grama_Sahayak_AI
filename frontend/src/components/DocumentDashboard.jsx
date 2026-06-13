import React, { useEffect, useState } from 'react';
import { UploadCloud, Trash, FileText, Calendar } from 'lucide-react';
import { api } from '../services/api';

export default function DocumentDashboard({ userProfile, t }) {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchDocuments = async () => {
    try {
      const docs = await api.documents.getDocuments(userProfile.id);
      setDocuments(docs);
    } catch (e) {
      console.error('Failed to fetch documents:', e);
    }
  };

  useEffect(() => {
    if (userProfile?.id) {
      fetchDocuments();
    }
  }, [userProfile]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage({ text: '', type: '' });
    }
  };

  const handleUpload = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!file) return;

    setUploading(true);
    setMessage({ text: t('processing_pdf'), type: 'info' });

    try {
      await api.documents.upload(userProfile.id, file);
      setMessage({ text: t('upload_success'), type: 'success' });
      setFile(null);
      // Reset input element
      const inputEl = document.getElementById('pdf-file-upload');
      if (inputEl) inputEl.value = '';
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setMessage({ 
        text: err.response?.data?.error || 'Failed to process document. Verify Supabase tables and Gemini key.', 
        type: 'error' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document? This will remove all its trained RAG embeddings.')) {
      return;
    }
    try {
      await api.documents.deleteDocument(docId, userProfile.id);
      fetchDocuments();
      setMessage({ text: 'Document deleted successfully.', type: 'success' });
    } catch (e) {
      console.error('Delete error:', e);
      setMessage({ text: 'Failed to delete document.', type: 'error' });
    }
  };

  const triggerFileSelect = () => {
    const inputEl = document.getElementById('pdf-file-upload');
    if (inputEl) inputEl.click();
  };

  return (
    <div className="dashboard-view-container">
      <h2 className="view-title">📊 {t('nav_dashboard')}</h2>
      <hr className="divider" />

      {/* Upload Box */}
      <div className="premium-card">
        <h3 className="card-title">{t('upload_doc')}</h3>
        <p className="card-subtitle">{t('upload_doc_help')}</p>
        
        <div 
          onClick={triggerFileSelect} 
          className="upload-dropzone"
          style={{ cursor: 'pointer' }}
        >
          <UploadCloud size={40} className="upload-icon" />
          <input 
            type="file" 
            id="pdf-file-upload" 
            accept="application/pdf" 
            onChange={handleFileChange}
            onClick={(e) => e.stopPropagation()}
            className="file-input-hidden"
            required
          />
          <span className="file-input-label" style={{ fontWeight: '700', color: 'var(--accent-green)' }}>
            {file ? file.name : 'Choose a PDF file...'}
          </span>

          {file && (
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                handleUpload(e);
              }} 
              disabled={uploading} 
              className="btn btn-primary btn-upload-submit"
              style={{ marginTop: '12px' }}
            >
              {uploading ? <div className="spinner"></div> : 'Process Document'}
            </button>
          )}
        </div>

        {message.text && (
          <div className={`message-banner ${message.type}`} style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {message.type === 'info' && <div className="spinner spinner-small"></div>}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Document Listing */}
      <div className="premium-card">
        <h3 className="card-title">{t('your_documents')}</h3>
        <div className="document-list-container">
          {documents.length === 0 ? (
            <div className="empty-state">{t('no_documents')}</div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="document-row">
                <div className="doc-meta-info">
                  <FileText className="doc-icon" size={20} />
                  <div className="doc-text-block">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="doc-title">
                      {doc.title}
                    </a>
                    <span className="doc-date" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <Calendar size={12} />
                      {t('upload_date')}: {doc.upload_date ? doc.upload_date.substring(0, 10) : ''}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => handleDelete(doc.id)} 
                  className="btn btn-danger btn-circle"
                  style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
                  title={t('delete')}
                >
                  <Trash size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
