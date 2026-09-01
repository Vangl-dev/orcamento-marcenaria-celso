import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ScrollText, 
  Trash2, 
  Edit3, 
  Check, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  FileText,
  Plus
} from 'lucide-react';
import { formatCurrency } from '../utils/calculator';

export default function ContractsList({ 
  contracts, 
  estimates, 
  settings: _settings, 
  onCreateNew, 
  onConvertFromEstimate,
  onEdit, 
  onDelete,
  onStatusChange 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSearch = contract.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (contract.estimateReference && contract.estimateReference.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = activeFilter === 'todos' || contract.status === activeFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [contracts, searchTerm, activeFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'rascunho': 'Rascunho',
      'enviado': 'Enviado',
      'aguardando': 'Aguardando',
      'aceito': 'Aceito',
      'assinado': 'Assinado',
      'em_execucao': 'Em Execução',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const approvedEstimates = estimates.filter(est => est.status === 'aprovada');

  return (
    <div className="dashboard-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScrollText size={20} style={{ color: 'var(--primary-color)' }} /> Contratos
        </h2>
        <button 
          className="btn btn-primary" 
          onClick={onCreateNew}
          style={{ width: 'auto', padding: '10px 16px', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      {approvedEstimates.length > 0 && (
        <div className="create-estimate-card" style={{ background: 'linear-gradient(135deg, #2f6b3b, #1a4d24)', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Estimativas Aprovadas</h3>
            <p style={{ fontSize: '0.85rem' }}>
              {approvedEstimates.length} {approvedEstimates.length === 1 ? 'estimativa pronta' : 'estimativas prontas'} para converter em contrato
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {approvedEstimates.slice(0, 3).map(est => (
              <button 
                key={est.id}
                className="btn btn-light" 
                style={{ border: 'none', background: '#fff', color: '#2f6b3b', width: '100%', padding: '10px 12px', borderRadius: '10px', fontSize: '0.85rem', justifyContent: 'flex-start' }}
                onClick={() => onConvertFromEstimate(est)}
              >
                <FileText size={14} /> {est.client.name} ({est.id})
              </button>
            ))}
            {approvedEstimates.length > 3 && (
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                +{approvedEstimates.length - 3} mais
              </span>
            )}
          </div>
        </div>
      )}

      <div className="search-container">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Buscar cliente ou número..." 
          className="form-input search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="filter-tabs">
        <button 
          className={`tab-btn ${activeFilter === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveFilter('todos')}
        >
          Todos ({contracts.length})
        </button>
        <button 
          className={`tab-btn ${activeFilter === 'rascunho' ? 'active' : ''}`}
          onClick={() => setActiveFilter('rascunho')}
        >
          Rascunhos
        </button>
        <button 
          className={`tab-btn ${activeFilter === 'enviado' ? 'active' : ''}`}
          onClick={() => setActiveFilter('enviado')}
        >
          Enviados
        </button>
        <button 
          className={`tab-btn ${activeFilter === 'aceito' ? 'active' : ''}`}
          onClick={() => setActiveFilter('aceito')}
        >
          Aceitos
        </button>
        <button 
          className={`tab-btn ${activeFilter === 'em_execucao' ? 'active' : ''}`}
          onClick={() => setActiveFilter('em_execucao')}
        >
          Em Execução
        </button>
      </div>

      <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: '700' }}>Contratos Recentes</h3>
      
      {filteredContracts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', color: '#8c8279' }}>
          <ScrollText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
          <p>Nenhum contrato encontrado.</p>
          <button 
            className="btn btn-primary" 
            onClick={onCreateNew}
            style={{ width: 'auto', padding: '10px 20px', marginTop: '12px', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Criar Novo Contrato
          </button>
        </div>
      ) : (
        <div className="estimate-list">
          {filteredContracts.map(contract => (
            <div key={contract.id} className="estimate-card">
              <div className="estimate-card-header">
                <div>
                  <div className="client-name">{contract.client.name}</div>
                  <div className="estimate-meta">
                    <span>{contract.id}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {formatDate(contract.date)}
                    </span>
                    <span>•</span>
                    <span style={{ fontSize: '0.75rem', color: contract.estimateReference ? 'var(--primary-color)' : '#8c8279' }}>
                      Origem: {contract.estimateReference || 'Contrato direto'}
                    </span>
                  </div>
                </div>
                <span className={`status-badge status-${contract.status === 'em_execucao' ? 'enviada' : contract.status === 'concluido' ? 'aprovada' : contract.status === 'cancelado' ? 'expirada' : 'rascunho'}`}>
                  {getStatusLabel(contract.status)}
                </span>
              </div>
              
              <div className="estimate-card-footer">
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#8c8279', display: 'block' }}>Valor contratado</span>
                  <div className="estimate-value">
                    {formatCurrency(contract.totalValue)}
                  </div>
                </div>

                <div className="estimate-actions">
                  {contract.status === 'rascunho' && (
                    <button 
                      className="btn-icon" 
                      title="Marcar como Enviado"
                      onClick={() => onStatusChange(contract.id, 'enviado')}
                    >
                      <ArrowRight size={16} style={{ color: 'var(--status-sent-text)' }} />
                    </button>
                  )}
                  {contract.status === 'enviado' && (
                    <button 
                      className="btn-icon" 
                      title="Marcar como Aceito"
                      onClick={() => onStatusChange(contract.id, 'aceito')}
                    >
                      <Check size={16} style={{ color: 'var(--status-approved-text)' }} />
                    </button>
                  )}
                  {contract.status === 'aceito' && (
                    <button 
                      className="btn-icon" 
                      title="Marcar como Em Execução"
                      onClick={() => onStatusChange(contract.id, 'em_execucao')}
                    >
                      <TrendingUp size={16} style={{ color: 'var(--primary-color)' }} />
                    </button>
                  )}
                  {contract.status === 'em_execucao' && (
                    <button 
                      className="btn-icon" 
                      title="Marcar como Concluído"
                      onClick={() => onStatusChange(contract.id, 'concluido')}
                    >
                      <Check size={16} style={{ color: 'var(--status-approved-text)' }} />
                    </button>
                  )}
                  <button 
                    className="btn-icon" 
                    title="Editar"
                    onClick={() => onEdit(contract)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    className="btn-icon" 
                    title="Excluir"
                    style={{ borderColor: '#f8cecc' }}
                    onClick={() => {
                      if (confirm(`Excluir o contrato de ${contract.client.name}?`)) {
                        onDelete(contract.id);
                      }
                    }}
                  >
                    <Trash2 size={16} style={{ color: 'var(--status-expired-text)' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
