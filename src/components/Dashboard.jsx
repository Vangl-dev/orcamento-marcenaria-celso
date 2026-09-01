import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Edit3, 
  Check, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  Package,
  ScrollText
} from 'lucide-react';
import { formatCurrency, calculateEstimate } from '../utils/calculator';

export default function Dashboard({ 
  estimates, 
  settings, 
  onCreateNew, 
  onEdit, 
  onDelete,
  onStatusChange,
  onConvertToContract
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');

  // Calculate high-level stats
  const stats = useMemo(() => {
    let totalApprovedVal = 0;
    let pendingCount = 0;

    estimates.forEach(est => {
      const calc = calculateEstimate(est, settings);
      if (est.status === 'aprovada') {
        totalApprovedVal += calc.totalInvestment;
      } else if (est.status === 'rascunho' || est.status === 'enviada') {
        pendingCount++;
      }
    });

    return {
      approvedVal: totalApprovedVal,
      pendingCount
    };
  }, [estimates, settings]);

  // Filter estimates
  const filteredEstimates = useMemo(() => {
    return estimates.filter(est => {
      const matchesSearch = est.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            est.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = activeFilter === 'todos' || est.status === activeFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [estimates, searchTerm, activeFilter]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="dashboard-view">
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Aprovados</div>
          <div className="stat-value" style={{ color: 'var(--status-approved-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={16} />
            {formatCurrency(stats.approvedVal)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Em aberto</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package size={16} style={{ color: 'var(--primary-color)' }} />
            {stats.pendingCount} {stats.pendingCount === 1 ? 'proposta' : 'propostas'}
          </div>
        </div>
      </div>

      {/* Primary Action Card */}
      <div className="create-estimate-card" onClick={onCreateNew} style={{ cursor: 'pointer' }}>
        <div>
          <h3>Nova Estimativa</h3>
          <p>Crie um orçamento preliminar rápido em menos de 2 minutos durante ou após a visita ao cliente.</p>
        </div>
        <button className="btn btn-light" style={{ border: 'none', background: '#fff', color: 'var(--primary-color)', width: 'auto', alignSelf: 'flex-start', padding: '10px 16px', borderRadius: '10px' }}>
          <Plus size={18} /> Começar Agora
        </button>
      </div>

      {/* Search and Filters */}
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
          Todos ({estimates.length})
        </button>
        <button 
          className={`tab-btn ${activeFilter === 'rascunho' ? 'active' : ''}`}
          onClick={() => setActiveFilter('rascunho')}
        >
          Rascunhos
        </button>
        <button 
          className={`tab-btn ${activeFilter === 'enviada' ? 'active' : ''}`}
          onClick={() => setActiveFilter('enviada')}
        >
          Enviados
        </button>
        <button 
          className={`tab-btn ${activeFilter === 'aprovada' ? 'active' : ''}`}
          onClick={() => setActiveFilter('aprovada')}
        >
          Aprovados
        </button>
        <button 
          className={`tab-btn ${activeFilter === 'expirada' ? 'active' : ''}`}
          onClick={() => setActiveFilter('expirada')}
        >
          Expirados
        </button>
      </div>

      {/* Estimates List */}
      <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: '700' }}>Recent Estimates</h3>
      
      {filteredEstimates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', color: '#8c8279' }}>
          <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
          <p>Nenhuma estimativa encontrada.</p>
        </div>
      ) : (
        <div className="estimate-list">
          {filteredEstimates.map(est => {
            const calculated = calculateEstimate(est, settings);
            return (
              <div key={est.id} className="estimate-card">
                <div className="estimate-card-header">
                  <div>
                    <div className="client-name">{est.client.name}</div>
                    <div className="estimate-meta">
                      <span>{est.id}</span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {formatDate(est.date)}
                      </span>
                    </div>
                  </div>
                  <span className={`status-badge status-${est.status}`}>
                    {est.status}
                  </span>
                </div>
                
                <div className="estimate-card-footer">
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#8c8279', display: 'block' }}>Valor estimado</span>
                    <div className="estimate-value">
                      {calculated.useRange ? (
                        <span style={{ fontSize: '0.95rem' }}>
                          {formatCurrency(calculated.range.min)} a {formatCurrency(calculated.range.max)}
                        </span>
                      ) : (
                        <span>{formatCurrency(calculated.totalInvestment)}</span>
                      )}
                    </div>
                  </div>

                  <div className="estimate-actions">
                    {est.status === 'aprovada' && (
                      <button 
                        className="btn-icon" 
                        title="Converter em Contrato"
                        onClick={() => onConvertToContract(est)}
                        style={{ borderColor: '#2f6b3b', backgroundColor: '#e2ede5' }}
                      >
                        <ScrollText size={16} style={{ color: '#2f6b3b' }} />
                      </button>
                    )}
                    {est.status !== 'aprovada' && (
                      <button 
                        className="btn-icon" 
                        title="Marcar como Aprovado"
                        onClick={() => onStatusChange(est.id, 'aprovada')}
                      >
                        <Check size={16} style={{ color: 'var(--status-approved-text)' }} />
                      </button>
                    )}
                    {est.status === 'rascunho' && (
                      <button 
                        className="btn-icon" 
                        title="Marcar como Enviado"
                        onClick={() => onStatusChange(est.id, 'enviada')}
                      >
                        <ArrowRight size={16} style={{ color: 'var(--status-sent-text)' }} />
                      </button>
                    )}
                    <button 
                      className="btn-icon" 
                      title="Editar"
                      onClick={() => onEdit(est)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      className="btn-icon" 
                      title="Excluir"
                      style={{ borderColor: '#f8cecc' }}
                      onClick={() => {
                        if (confirm(`Excluir a estimativa de ${est.client.name}?`)) {
                          onDelete(est.id);
                        }
                      }}
                    >
                      <Trash2 size={16} style={{ color: 'var(--status-expired-text)' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
