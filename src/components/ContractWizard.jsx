import React, { useState } from 'react';
import { 
  User, 
  FileText, 
  Eye, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  Trash2
} from 'lucide-react';
import { formatCurrency } from '../utils/calculator';
import ContractPdf from './ContractPdf';

export default function ContractWizard({ 
  initialContract, 
  settings, 
  onSave, 
  onCancel 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [contract, setContract] = useState(initialContract || {
    id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'rascunho',
    estimateReference: '',
    origin: 'direct',
    client: { name: '', whatsapp: '', email: '', address: '', cpf: '' },
    items: [],
    totalValue: 0,
    discount: { type: 'fixed', value: 0 },
    services: {
      freight: { type: 'included', value: 0 },
      assembly: { type: 'included', value: 0 },
      installation: { type: 'included', value: 0 }
    },
    contractTerms: {
      paymentMethod: settings.contractDefaults?.payment?.paymentMethod || 'entrada_saldo',
      payment: settings.contractDefaults?.payment?.paymentDescription || '50% na aprovação + 50% na entrega',
      entryPercentage: settings.contractDefaults?.payment?.entryPercentage || 50,
      entryValue: 0,
      installments: settings.contractDefaults?.payment?.installments || 2,
      installmentValue: 0,
      balanceCondition: settings.contractDefaults?.payment?.balanceCondition || 'saldo na entrega dos móveis',
      lateFeePercentage: settings.contractDefaults?.defaultRate?.lateFeePercentage || 2,
      monthlyInterest: settings.contractDefaults?.defaultRate?.monthlyInterest || 1,
      monetaryCorrection: settings.contractDefaults?.defaultRate?.monetaryCorrection !== false,
      fabricationDays: settings.contractDefaults?.deadline?.fabricationDays || 30,
      installationDays: settings.contractDefaults?.deadline?.installationDays || 1,
      workingDaysOnly: settings.contractDefaults?.deadline?.workingDaysOnly !== false,
      surplus: settings.contractDefaults?.surplus || 'company'
    },
    address: '',
    notes: '',
    witnesses: [
      { name: '', cpf: '' },
      { name: '', cpf: '' }
    ],
    documentId: '',
    hash: '',
    acceptanceDate: null,
    acceptanceMethod: null
  });

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit: 'unidade',
    baseValue: ''
  });

  const handleClientChange = (field, value) => {
    setContract(prev => ({
      ...prev,
      client: { ...prev.client, [field]: value }
    }));
  };

  const handleTermsChange = (field, value) => {
    setContract(prev => ({
      ...prev,
      contractTerms: { ...prev.contractTerms, [field]: value }
    }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.description.trim()) return;
    
    const qty = parseFloat(newItem.quantity) || 1;
    const base = parseFloat(newItem.baseValue) || 0;

    const item = {
      id: `item-${Date.now()}`,
      description: newItem.description,
      quantity: qty,
      unit: newItem.unit,
      baseValue: base
    };

    setContract(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      description: '',
      quantity: 1,
      unit: 'unidade',
      baseValue: ''
    });
  };

  const handleRemoveItem = (id) => {
    setContract(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleServiceChange = (serviceId, field, val) => {
    setContract(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceId]: { ...prev.services[serviceId], [field]: val }
      }
    }));
  };

  const handleServiceValueChange = (serviceId, val) => {
    setContract(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceId]: { ...prev.services[serviceId], value: parseFloat(val) || 0 }
      }
    }));
  };

  const handlePaymentMethodChange = (method) => {
    setContract(prev => ({
      ...prev,
      contractTerms: {
        ...prev.contractTerms,
        paymentMethod: method,
        entryPercentage: method === 'a_vista' ? 0 : (method === 'parcelado' ? 0 : prev.contractTerms.entryPercentage)
      }
    }));
  };

  const calculateServicesTotal = () => {
    const freight = contract.services.freight.type === 'separate' ? contract.services.freight.value : 0;
    const assembly = contract.services.assembly.type === 'separate' ? contract.services.assembly.value : 0;
    const installation = contract.services.installation.type === 'separate' ? contract.services.installation.value : 0;
    return freight + assembly + installation;
  };

  const calculateGrandTotal = () => {
    return contract.totalValue + calculateServicesTotal();
  };

  const calculateEntryValue = () => {
    const percentage = contract.contractTerms.entryPercentage || 0;
    return contract.totalValue * (percentage / 100);
  };

  const calculateInstallmentValue = () => {
    const remaining = contract.totalValue - calculateEntryValue();
    const installments = contract.contractTerms.installments || 1;
    return remaining / installments;
  };

  const nextStep = () => {
    if (currentStep === 1 && !contract.client.name.trim()) {
      alert('O nome do cliente é obrigatório.');
      return;
    }
    if (currentStep === 2 && contract.totalValue <= 0) {
      alert('Informe o valor total do contrato.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSaveAndExit = () => {
    const updatedContract = {
      ...contract,
      contractTerms: {
        ...contract.contractTerms,
        entryValue: calculateEntryValue()
      }
    };
    onSave(updatedContract);
  };

  const progressPercentage = ((currentStep - 1) / 3) * 100;

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <div className="step-indicator">
          <div className="step-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
          <div className={`step-dot ${currentStep >= 1 ? 'active' : ''}`} onClick={() => setCurrentStep(1)}>1</div>
          <div className={`step-dot ${currentStep >= 2 ? 'active' : ''}`} onClick={() => { if(contract.client.name.trim()) setCurrentStep(2); }}>2</div>
          <div className={`step-dot ${currentStep >= 3 ? 'active' : ''}`} onClick={() => { if(contract.client.name.trim() && contract.totalValue > 0) setCurrentStep(3); }}>3</div>
          <div className={`step-dot ${currentStep >= 4 ? 'active' : ''}`} onClick={() => { if(contract.client.name.trim() && contract.totalValue > 0) setCurrentStep(4); }}>4</div>
        </div>
        <div className="step-labels">
          <span>Cliente</span>
          <span>Serviço</span>
          <span>Condições</span>
          <span>Prévia</span>
        </div>
      </div>

      {currentStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} style={{ color: 'var(--primary-color)' }} /> Dados do Cliente
          </h2>

          <div style={{ padding: '12px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: '#8c8279' }}>
            <span style={{ display: 'block', fontWeight: 700 }}>Contrato Nº: {contract.id || 'Gerado ao salvar'}</span>
            {contract.estimateReference && (
              <span style={{ display: 'block', marginTop: '4px' }}>Origem: Estimativa {contract.estimateReference}</span>
            )}
            {!contract.estimateReference && (
              <span style={{ display: 'block', marginTop: '4px' }}>Origem: Contrato direto</span>
            )}
            <span style={{ display: 'block', marginTop: '4px' }}>Data: {contract.date.split('-').reverse().join('/')}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Nome do Cliente (Contratante) *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: João da Silva"
              value={contract.client.name}
              onChange={(e) => handleClientChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp *</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="Ex: (11) 99999-9999"
              value={contract.client.whatsapp}
              onChange={(e) => handleClientChange('whatsapp', e.target.value)}
              inputMode="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label">CPF/CNPJ</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: 000.000.000-00"
              value={contract.client.cpf || ''}
              onChange={(e) => handleClientChange('cpf', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="Ex: joao@gmail.com"
              value={contract.client.email}
              onChange={(e) => handleClientChange('email', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereço do Cliente</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: Rua das Flores, 123"
              value={contract.client.address}
              onChange={(e) => handleClientChange('address', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereço da Obra/Entrega</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Se diferente do endereço do cliente"
              value={contract.address}
              onChange={(e) => setContract(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: 'var(--primary-color)' }} /> Serviço e Valor
          </h2>

          <div className="form-group">
            <label className="form-label">Descrição do Serviço</label>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="Ex: Fabricação e instalação de móveis planejados para cozinha, conforme projeto aprovado."
              value={contract.notes}
              onChange={(e) => setContract(prev => ({ ...prev, notes: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valor Total Contratado (R$) *</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Ex: 18500"
                value={contract.totalValue || ''}
                onChange={(e) => setContract(prev => ({ ...prev, totalValue: parseFloat(e.target.value) || 0 }))}
                style={{ paddingRight: '40px', fontSize: '1.2rem', fontWeight: 700 }}
                inputMode="decimal"
              />
              <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--primary-color)' }}>R$</span>
            </div>
          </div>

          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Itens Detalhados (Opcional)
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#8c8279', marginBottom: '12px' }}>
              Opcionalmente, discrimine os itens do contrato. Você pode avançar sem adicionar itens.
            </p>

            {contract.items.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                {contract.items.map((item) => (
                  <div key={item.id} className="added-item-card" style={{ marginBottom: '8px' }}>
                    <div className="added-item-info">
                      <h4>{item.description}</h4>
                      <p>{item.quantity} {item.unit} • {formatCurrency(item.baseValue)}</p>
                    </div>
                    <div className="added-item-actions">
                      <button 
                        type="button" 
                        className="btn-icon" 
                        onClick={() => handleRemoveItem(item.id)}
                        style={{ border: 'none', background: 'none' }}
                      >
                        <Trash2 size={16} style={{ color: 'var(--status-expired-text)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Descrição do item"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-input" 
                    placeholder="Qtd"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || '' }))}
                    inputMode="decimal"
                  />
                </div>
                <div className="form-group">
                  <select 
                    className="form-input select-unit"
                    value={newItem.unit}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    <option value="unidade">Unidade</option>
                    <option value="m">Metro linear</option>
                    <option value="m²">Metro quadrado</option>
                    <option value="valor fechado">Valor fechado</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Valor do item (R$)"
                    value={newItem.baseValue}
                    onChange={(e) => setNewItem(prev => ({ ...prev, baseValue: parseFloat(e.target.value) || '' }))}
                    inputMode="decimal"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary" style={{ borderStyle: 'dashed', width: '100%' }}>
                <Plus size={16} /> Adicionar Item
              </button>
            </form>
          </div>

          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Frete & Serviços</h4>
            
            <div className="cost-toggle-row">
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Frete</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select 
                  className="form-input select-unit"
                  value={contract.services.freight.type}
                  onChange={(e) => handleServiceChange('freight', 'type', e.target.value)}
                  style={{ padding: '6px 24px 6px 10px', fontSize: '0.8rem', width: '120px' }}
                >
                  <option value="included">Incluso</option>
                  <option value="separate">Valor separado</option>
                </select>
                {contract.services.freight.type === 'separate' && (
                  <input 
                    type="number" 
                    className="form-input"
                    value={contract.services.freight.value || ''}
                    onChange={(e) => handleServiceValueChange('freight', e.target.value)}
                    placeholder="R$"
                    style={{ width: '100px', padding: '6px 10px', fontSize: '0.8rem' }}
                    inputMode="decimal"
                  />
                )}
              </div>
            </div>

            <div className="cost-toggle-row">
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Montagem</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select 
                  className="form-input select-unit"
                  value={contract.services.assembly.type}
                  onChange={(e) => handleServiceChange('assembly', 'type', e.target.value)}
                  style={{ padding: '6px 24px 6px 10px', fontSize: '0.8rem', width: '120px' }}
                >
                  <option value="included">Inclusa</option>
                  <option value="separate">Valor separado</option>
                </select>
                {contract.services.assembly.type === 'separate' && (
                  <input 
                    type="number" 
                    className="form-input"
                    value={contract.services.assembly.value || ''}
                    onChange={(e) => handleServiceValueChange('assembly', e.target.value)}
                    placeholder="R$"
                    style={{ width: '100px', padding: '6px 10px', fontSize: '0.8rem' }}
                    inputMode="decimal"
                  />
                )}
              </div>
            </div>

            <div className="cost-toggle-row" style={{ borderBottom: 'none' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Instalação</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select 
                  className="form-input select-unit"
                  value={contract.services.installation.type}
                  onChange={(e) => handleServiceChange('installation', 'type', e.target.value)}
                  style={{ padding: '6px 24px 6px 10px', fontSize: '0.8rem', width: '120px' }}
                >
                  <option value="included">Inclusa</option>
                  <option value="separate">Valor separado</option>
                </select>
                {contract.services.installation.type === 'separate' && (
                  <input 
                    type="number" 
                    className="form-input"
                    value={contract.services.installation.value || ''}
                    onChange={(e) => handleServiceValueChange('installation', e.target.value)}
                    placeholder="R$"
                    style={{ width: '100px', padding: '6px 10px', fontSize: '0.8rem' }}
                    inputMode="decimal"
                  />
                )}
              </div>
            </div>
          </div>

          {calculateServicesTotal() > 0 && (
            <div className="realtime-total-banner" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b5a4b' }}>
                <span>Móveis:</span>
                <span>{formatCurrency(contract.totalValue)}</span>
              </div>
              {contract.services.freight.type === 'separate' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b5a4b' }}>
                  <span>Frete:</span>
                  <span>+{formatCurrency(contract.services.freight.value)}</span>
                </div>
              )}
              {contract.services.assembly.type === 'separate' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b5a4b' }}>
                  <span>Montagem:</span>
                  <span>+{formatCurrency(contract.services.assembly.value)}</span>
                </div>
              )}
              {contract.services.installation.type === 'separate' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b5a4b' }}>
                  <span>Instalação:</span>
                  <span>+{formatCurrency(contract.services.installation.value)}</span>
                </div>
              )}
              <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total Geral:</span>
                <span style={{ color: 'var(--primary-color)' }}>{formatCurrency(calculateGrandTotal())}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: 'var(--primary-color)' }} /> Condições do Contrato
          </h2>

          <div className="realtime-total-banner" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', border: '2px solid var(--primary-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Valor Total:</span>
              <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.5rem' }}>
                {formatCurrency(contract.totalValue)}
              </h3>
            </div>
            {calculateServicesTotal() > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b5a4b' }}>
                <span>Serviços (frete/montagem/instalação):</span>
                <span>+{formatCurrency(calculateServicesTotal())}</span>
              </div>
            )}
            {calculateServicesTotal() > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <span>Total Geral:</span>
                <span style={{ color: 'var(--primary-color)' }}>{formatCurrency(calculateGrandTotal())}</span>
              </div>
            )}
          </div>

          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Forma de Pagamento</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[
                { value: 'a_vista', label: 'À Vista' },
                { value: 'entrada_saldo', label: 'Entrada + Saldo' },
                { value: 'parcelado', label: 'Parcelado' },
                { value: 'entrada_parcelas', label: 'Entrada + Parcelas' }
              ].map(method => (
                <button
                  key={method.value}
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handlePaymentMethodChange(method.value)}
                  style={{
                    padding: '12px 8px',
                    fontSize: '0.8rem',
                    fontWeight: contract.contractTerms.paymentMethod === method.value ? 700 : 400,
                    border: contract.contractTerms.paymentMethod === method.value ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                    backgroundColor: contract.contractTerms.paymentMethod === method.value ? 'var(--primary-color-light)' : 'var(--card-bg)'
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {contract.contractTerms.paymentMethod !== 'a_vista' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Entrada (%)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={contract.contractTerms.entryPercentage}
                      onChange={(e) => handleTermsChange('entryPercentage', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor da Entrada</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formatCurrency(calculateEntryValue())}
                      readOnly
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                </div>
              </>
            )}

            {(contract.contractTerms.paymentMethod === 'parcelado' || contract.contractTerms.paymentMethod === 'entrada_parcelas') && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nº Parcelas</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={contract.contractTerms.installments}
                    onChange={(e) => handleTermsChange('installments', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor da Parcela</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formatCurrency(calculateInstallmentValue())}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
              </div>
            )}

            {contract.contractTerms.paymentMethod !== 'a_vista' && (
              <div className="form-group">
                <label className="form-label">Saldo Restante</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formatCurrency(contract.totalValue - calculateEntryValue())}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Descrição da Forma de Pagamento</label>
              <input 
                type="text" 
                className="form-input" 
                value={contract.contractTerms.payment}
                onChange={(e) => handleTermsChange('payment', e.target.value)}
                placeholder="Ex: 50% na aprovação + 50% na entrega"
              />
            </div>
          </div>

          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Inadimplência</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Multa (%)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={contract.contractTerms.lateFeePercentage}
                  onChange={(e) => handleTermsChange('lateFeePercentage', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Juros (% ao mês)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={contract.contractTerms.monthlyInterest}
                  onChange={(e) => handleTermsChange('monthlyInterest', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="cost-toggle-row" style={{ borderBottom: 'none', padding: '0' }}>
              <span style={{ fontSize: '0.85rem' }}>Correção Monetária</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={contract.contractTerms.monetaryCorrection}
                  onChange={(e) => handleTermsChange('monetaryCorrection', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Prazos</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fabricação (dias)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={contract.contractTerms.fabricationDays}
                  onChange={(e) => handleTermsChange('fabricationDays', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Instalação (dias)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={contract.contractTerms.installationDays}
                  onChange={(e) => handleTermsChange('installationDays', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="cost-toggle-row" style={{ borderBottom: 'none', padding: '0' }}>
              <span style={{ fontSize: '0.85rem' }}>Apenas dias úteis</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={contract.contractTerms.workingDaysOnly}
                  onChange={(e) => handleTermsChange('workingDaysOnly', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Destino das Sobras</h4>
            <div className="form-group">
              <select 
                className="form-input select-unit"
                value={contract.contractTerms.surplus}
                onChange={(e) => handleTermsChange('surplus', e.target.value)}
              >
                <option value="company">Ficam com a CONTRATADA (marcenaria)</option>
                <option value="client">Serão entregues ao CONTRATANTE (cliente)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={20} style={{ color: 'var(--primary-color)' }} /> Prévia do Contrato
          </h2>
          
          <ContractPdf 
            contract={contract} 
            settings={settings} 
            onBack={prevStep}
          />
        </div>
      )}

      {currentStep < 4 && (
        <div className="wizard-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={currentStep === 1 ? onCancel : prevStep}
          >
            <ChevronLeft size={16} /> Voltar
          </button>
          
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={nextStep}
          >
            {currentStep === 3 ? (
              <>
                Gerar Prévia <Eye size={16} />
              </>
            ) : (
              <>
                Continuar <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      )}

      {currentStep === 4 && (
        <div className="wizard-footer full" style={{ marginTop: '24px' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSaveAndExit}
            style={{ padding: '16px' }}
          >
            Salvar Contrato e Voltar
          </button>
        </div>
      )}
    </div>
  );
}
