import React, { useState } from 'react';
import { 
  User, 
  Layers, 
  Sliders, 
  Eye, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft
} from 'lucide-react';
import { formatCurrency, calculateEstimate } from '../utils/calculator';
import PdfProposal from './PdfProposal';

export default function EstimateWizard({ 
  initialEstimate, 
  settings, 
  onSave, 
  onCancel 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [estimate, setEstimate] = useState(initialEstimate || {
    id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'rascunho',
    client: { name: '', whatsapp: '', email: '', address: '' },
    items: [],
    compositionMarkup: settings.pricing.compositionMarkup,
    labor: { ...settings.pricing.labor },
    services: {
      freight: { type: settings.pricing.services?.freight?.type || 'included', value: settings.pricing.services?.freight?.value || 0 },
      assembly: { type: settings.pricing.services?.assembly?.type || 'included', value: settings.pricing.services?.assembly?.value || 0 },
      installation: { type: settings.pricing.services?.installation?.type || 'included', value: settings.pricing.services?.installation?.value || 0 }
    },
    flatPrice: false,
    flatTotalValue: 0,
    discount: { type: 'fixed', value: 0 },
    useRange: settings.pricing.useRange,
    safetyMargin: settings.pricing.safetyMargin,
    terms: { ...settings.terms },
    paymentConditions: {
      paymentMethod: 'personalizado',
      paymentDescription: settings.terms?.payment || '50% na aprovação + 50% na entrega',
      entryPercentage: 50,
      installments: 2,
      balanceCondition: 'saldo na entrega dos móveis'
    },
    notes: ''
  });

  // Local state for the item being added in Step 2
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit: 'm',
    baseValue: ''
  });

  const calculated = calculateEstimate(estimate, settings);

  // Handlers for Step 1: Client
  const handleClientChange = (field, value) => {
    setEstimate(prev => ({
      ...prev,
      client: { ...prev.client, [field]: value }
    }));
  };

  // Handlers for Step 2: Items
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

    setEstimate(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    // Reset item form
    setNewItem({
      description: '',
      quantity: 1,
      unit: 'm',
      baseValue: ''
    });
  };

  const handleRemoveItem = (id) => {
    setEstimate(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Handlers for Step 3: Pricing & Conditions overrides
  const handleCompositionChange = (val) => {
    setEstimate(prev => ({ ...prev, compositionMarkup: val }));
  };

  const handleLaborChange = (field, val) => {
    setEstimate(prev => ({
      ...prev,
      labor: { ...prev.labor, [field]: val }
    }));
  };

  const handleAdditionalCostChange = (serviceId, field, val) => {
    setEstimate(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceId]: { ...prev.services[serviceId], [field]: val }
      }
    }));
  };

  const handleServiceValueChange = (serviceId, val) => {
    setEstimate(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceId]: { ...prev.services[serviceId], value: parseFloat(val) || 0 }
      }
    }));
  };

  const handleDiscountChange = (field, val) => {
    setEstimate(prev => ({
      ...prev,
      discount: { ...prev.discount, [field]: val }
    }));
  };

  const handleTermsChange = (field, val) => {
    setEstimate(prev => ({
      ...prev,
      terms: { ...prev.terms, [field]: val }
    }));
  };

  const handleNotesChange = (val) => {
    setEstimate(prev => ({ ...prev, notes: val }));
  };

  const handlePaymentConditionChange = (field, val) => {
    setEstimate(prev => ({
      ...prev,
      paymentConditions: { ...prev.paymentConditions, [field]: val }
    }));
  };

  const handlePaymentMethodSelect = (method) => {
    setEstimate(prev => ({
      ...prev,
      paymentConditions: {
        ...prev.paymentConditions,
        paymentMethod: method,
        entryPercentage: method === 'a_vista' ? 0 : (method === 'parcelado' ? 0 : prev.paymentConditions.entryPercentage)
      }
    }));
  };

  const calculateEstEntryValue = () => {
    const total = estimate.flatPrice ? estimate.flatTotalValue : calculated.totalInvestment;
    const pct = estimate.paymentConditions.entryPercentage || 0;
    return total * (pct / 100);
  };

  const calculateEstInstallmentValue = () => {
    const total = estimate.flatPrice ? estimate.flatTotalValue : calculated.totalInvestment;
    const entry = calculateEstEntryValue();
    const remaining = total - entry;
    const inst = estimate.paymentConditions.installments || 1;
    return remaining / inst;
  };

  const handleSaveAndExit = () => {
    onSave(estimate);
  };

  // Next / Prev step navigation
  const nextStep = () => {
    if (currentStep === 1 && !estimate.client.name.trim()) {
      alert('O nome do cliente é obrigatório.');
      return;
    }
    if (currentStep === 2 && estimate.items.length === 0) {
      if (!confirm('Você está avançando sem adicionar nenhum item. Continuar mesmo assim?')) {
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const progressPercentage = ((currentStep - 1) / 3) * 100;

  return (
    <div className="wizard-container">
      {/* Wizard Header Progress Bar */}
      <div className="wizard-header">
        <div className="step-indicator">
          <div className="step-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
          <div className={`step-dot ${currentStep >= 1 ? 'active' : ''}`} onClick={() => setCurrentStep(1)}>1</div>
          <div className={`step-dot ${currentStep >= 2 ? 'active' : ''}`} onClick={() => { if(estimate.client.name.trim()) setCurrentStep(2); }}>2</div>
          <div className={`step-dot ${currentStep >= 3 ? 'active' : ''}`} onClick={() => { if(estimate.client.name.trim()) setCurrentStep(3); }}>3</div>
          <div className={`step-dot ${currentStep >= 4 ? 'active' : ''}`} onClick={() => { if(estimate.client.name.trim()) setCurrentStep(4); }}>4</div>
        </div>
        <div className="step-labels">
          <span>Cliente</span>
          <span>Itens</span>
          <span>Ajustes</span>
          <span>Prévia</span>
        </div>
      </div>

      {/* STEP 1: CLIENT DETAILS */}
      {currentStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} style={{ color: 'var(--primary-color)' }} /> Identificação do Cliente
          </h2>

          <div className="form-group">
            <label className="form-label">Nome do Cliente *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: João da Silva"
              value={estimate.client.name}
              onChange={(e) => handleClientChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp (para envio direto)</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="Ex: (11) 99999-9999"
              value={estimate.client.whatsapp}
              onChange={(e) => handleClientChange('whatsapp', e.target.value)}
              inputMode="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="Ex: joao@gmail.com"
              value={estimate.client.email}
              onChange={(e) => handleClientChange('email', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereço da Obra</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: Rua Apinajés, 450, Ap 52"
              value={estimate.client.address}
              onChange={(e) => handleClientChange('address', e.target.value)}
            />
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: '#8c8279' }}>
            <span style={{ display: 'block', fontWeight: 700 }}>Número do Orçamento: {estimate.id || 'Gerado ao salvar'}</span>
            <span>Data de Emissão: {estimate.date.split('-').reverse().join('/')}</span>
          </div>
        </div>
      )}

      {/* STEP 2: ITEMS BUILDER */}
      {currentStep === 2 && (
        <div className="item-builder">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} style={{ color: 'var(--primary-color)' }} /> Itens da Estimativa
          </h2>
          
          <div className="info-box">
            Adicione ambientes ou móveis planejados. Use valores aproximados por metro para obter o custo base do material.
          </div>

          {/* List of Added Items */}
          <div className="items-list">
            {estimate.items.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#8c8279', fontSize: '0.9rem', border: '1px dashed var(--border-color)', borderRadius: '12px', backgroundColor: '#fff' }}>
                Nenhum item adicionado. Use o formulário abaixo para começar.
              </p>
            ) : (
              estimate.items.map((item) => {
                const itemValue = item.quantity * item.baseValue;
                return (
                  <div key={item.id} className="added-item-card">
                    <div className="added-item-info">
                      <h4>{item.description}</h4>
                      <p>
                        {item.quantity} {item.unit} • {formatCurrency(item.baseValue)}/{item.unit}
                      </p>
                    </div>
                    <div className="added-item-actions">
                      <span className="added-item-price">{formatCurrency(itemValue)}</span>
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
                );
              })
            )}
          </div>

          {/* Form to Add New Item */}
          <form onSubmit={handleAddItem} className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Adicionar Item</h4>
            
            <div className="form-group">
              <label className="form-label">Descrição (Ex: Cozinha Planejada)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ambiente / Móvel"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                list="common-furniture"
              />
              <datalist id="common-furniture">
                <option value="Cozinha planejada" />
                <option value="Guarda-roupa Suíte" />
                <option value="Painel de TV" />
                <option value="Home office" />
                <option value="Banheiro" />
                <option value="Lavanderia" />
                <option value="Armário" />
                <option value="Bancada" />
              </datalist>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantidade</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  placeholder="Ex: 5.2"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || '' }))}
                  inputMode="decimal"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unidade</label>
                <select 
                  className="form-input select-unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                >
                  <option value="m">Metro linear (m)</option>
                  <option value="m²">Metro quadrado (m²)</option>
                  <option value="unidade">Unidade (un)</option>
                  <option value="valor fechado">Valor fechado</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Valor-base de Material (R$)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Ex: 1000"
                  value={newItem.baseValue}
                  onChange={(e) => setNewItem(prev => ({ ...prev, baseValue: parseFloat(e.target.value) || '' }))}
                  style={{ paddingRight: '40px' }}
                  inputMode="numeric"
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>R$</span>
              </div>
            </div>

            <button type="submit" className="btn btn-secondary" style={{ borderStyle: 'dashed' }}>
              <Plus size={16} /> Adicionar no Projeto
            </button>
          </form>

          {/* Running Subtotal Banner */}
          {estimate.items.length > 0 && (
            <div className="realtime-total-banner">
              <span>Subtotal Acumulado:</span>
              <h3>{formatCurrency(calculated.rawMaterialSum)}</h3>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: COST ADJUSTMENTS & TERMS */}
      {currentStep === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} style={{ color: 'var(--primary-color)' }} /> Ajustes Comerciais
          </h2>

          {/* Collapsible Section: Composição Interna de Custos */}
          <details className="add-item-form" style={{ cursor: 'pointer' }}>
            <summary style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-color)', outline: 'none' }}>
              Parâmetros de Custo Interno
            </summary>
            <div style={{ marginTop: '12px', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
              <div className="form-group">
                <label className="form-label">Fator de Composição de Materiais (%)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={estimate.compositionMarkup}
                  onChange={(e) => handleCompositionChange(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mão de Obra</label>
                <div className="form-row" style={{ marginBottom: '8px' }}>
                  <select 
                    className="form-input select-unit"
                    value={estimate.labor.type}
                    onChange={(e) => handleLaborChange('type', e.target.value)}
                  >
                    <option value="percentage">% sobre Base de Materiais</option>
                    <option value="fixed">Valor Fixo Comercial</option>
                    <option value="unit">Valor por Metro</option>
                  </select>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={estimate.labor.value}
                    onChange={(e) => handleLaborChange('value', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Desconto */}
          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Desconto Especial</h4>
            <div className="form-row">
              <select 
                className="form-input select-unit"
                value={estimate.discount.type}
                onChange={(e) => handleDiscountChange('type', e.target.value)}
              >
                <option value="fixed">Valor Fixo (R$)</option>
                <option value="percentage">Percentual (%)</option>
              </select>
              <input 
                type="number" 
                className="form-input" 
                value={estimate.discount.value}
                onChange={(e) => handleDiscountChange('value', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Custos Adicionais específicos */}
          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Frete & Serviços</h4>
            
            <div className="cost-toggle-row">
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Frete</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select 
                  className="form-input select-unit"
                  value={estimate.services.freight.type}
                  onChange={(e) => handleAdditionalCostChange('freight', 'type', e.target.value)}
                  style={{ padding: '6px 24px 6px 10px', fontSize: '0.8rem', width: '120px' }}
                >
                  <option value="included">Incluso</option>
                  <option value="separate">Valor separado</option>
                </select>
                {estimate.services.freight.type === 'separate' && (
                  <input 
                    type="number" 
                    className="form-input"
                    value={estimate.services.freight.value || ''}
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
                  value={estimate.services.assembly.type}
                  onChange={(e) => handleAdditionalCostChange('assembly', 'type', e.target.value)}
                  style={{ padding: '6px 24px 6px 10px', fontSize: '0.8rem', width: '120px' }}
                >
                  <option value="included">Inclusa</option>
                  <option value="separate">Valor separado</option>
                </select>
                {estimate.services.assembly.type === 'separate' && (
                  <input 
                    type="number" 
                    className="form-input"
                    value={estimate.services.assembly.value || ''}
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
                  value={estimate.services.installation.type}
                  onChange={(e) => handleAdditionalCostChange('installation', 'type', e.target.value)}
                  style={{ padding: '6px 24px 6px 10px', fontSize: '0.8rem', width: '120px' }}
                >
                  <option value="included">Inclusa</option>
                  <option value="separate">Valor separado</option>
                </select>
                {estimate.services.installation.type === 'separate' && (
                  <input 
                    type="number" 
                    className="form-input"
                    value={estimate.services.installation.value || ''}
                    onChange={(e) => handleServiceValueChange('installation', e.target.value)}
                    placeholder="R$"
                    style={{ width: '100px', padding: '6px 10px', fontSize: '0.8rem' }}
                    inputMode="decimal"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Preço Fechado */}
          <div className="add-item-form">
            <div className="cost-toggle-row" style={{ borderBottom: 'none', padding: '0' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Preço Fechado</span>
                <p style={{ fontSize: '0.75rem', color: '#8c8279', margin: '2px 0 0' }}>
                  Informe o valor total sem discriminar itens
                </p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={estimate.flatPrice}
                  onChange={(e) => setEstimate(prev => ({ ...prev, flatPrice: e.target.checked }))}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            {estimate.flatPrice && (
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Valor Total Contratado (R$)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Ex: 18500"
                    value={estimate.flatTotalValue || ''}
                    onChange={(e) => setEstimate(prev => ({ ...prev, flatTotalValue: parseFloat(e.target.value) || 0 }))}
                    style={{ paddingRight: '40px', fontSize: '1.1rem', fontWeight: 700 }}
                    inputMode="decimal"
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--primary-color)' }}>R$</span>
                </div>
              </div>
            )}
          </div>

          {/* Faixa de Investimento e Condições comerciais */}
          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Margem de Segurança & Faixa</h4>
            <div className="cost-toggle-row" style={{ borderBottom: 'none', padding: '0 0 10px 0' }}>
              <span style={{ fontSize: '0.85rem' }}>Trabalhar com faixa de investimento</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={estimate.useRange}
                  onChange={(e) => setEstimate(prev => ({ ...prev, useRange: e.target.checked }))}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            {estimate.useRange && (
              <div className="form-group" style={{ borderLeft: '3px solid var(--secondary-color)', paddingLeft: '12px' }}>
                <label className="form-label">Margem de Flutuação (%)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={estimate.safetyMargin}
                  onChange={(e) => setEstimate(prev => ({ ...prev, safetyMargin: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            )}
          </div>

          {/* Condições comerciais */}
          <div className="add-item-form">
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Condições Comerciais</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[
                { value: 'a_vista', label: 'À Vista' },
                { value: 'entrada_saldo', label: 'Entrada + Saldo' },
                { value: 'parcelado', label: 'Parcelado' },
                { value: 'entrada_parcelas', label: 'Entrada + Parcelas' },
                { value: 'personalizado', label: 'Personalizado' }
              ].map(method => (
                <button
                  key={method.value}
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handlePaymentMethodSelect(method.value)}
                  style={{
                    padding: '10px 6px',
                    fontSize: '0.75rem',
                    fontWeight: estimate.paymentConditions.paymentMethod === method.value ? 700 : 400,
                    border: estimate.paymentConditions.paymentMethod === method.value ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                    backgroundColor: estimate.paymentConditions.paymentMethod === method.value ? 'var(--primary-color-light)' : 'var(--card-bg)'
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {estimate.paymentConditions.paymentMethod !== 'a_vista' && estimate.paymentConditions.paymentMethod !== 'personalizado' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Entrada (%)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={estimate.paymentConditions.entryPercentage}
                      onChange={(e) => handlePaymentConditionChange('entryPercentage', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor da Entrada</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formatCurrency(calculateEstEntryValue())}
                      readOnly
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                </div>
              </>
            )}

            {(estimate.paymentConditions.paymentMethod === 'parcelado' || estimate.paymentConditions.paymentMethod === 'entrada_parcelas') && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nº Parcelas</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={estimate.paymentConditions.installments}
                    onChange={(e) => handlePaymentConditionChange('installments', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor da Parcela</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formatCurrency(calculateEstInstallmentValue())}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
              </div>
            )}

            {estimate.paymentConditions.paymentMethod !== 'a_vista' && estimate.paymentConditions.paymentMethod !== 'personalizado' && (
              <div className="form-group">
                <label className="form-label">Saldo Restante</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formatCurrency((estimate.flatPrice ? estimate.flatTotalValue : calculated.totalInvestment) - calculateEstEntryValue())}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>
            )}

            {estimate.paymentConditions.paymentMethod === 'personalizado' && (
              <div className="form-group">
                <label className="form-label">Condição de Pagamento</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={estimate.paymentConditions.paymentDescription}
                  onChange={(e) => handlePaymentConditionChange('paymentDescription', e.target.value)}
                  placeholder="Ex: 50% na aprovação + 50% na entrega"
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prazo de Entrega</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={estimate.terms.daysValue}
                  onChange={(e) => handleTermsChange('daysValue', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unidade</label>
                <select 
                  className="form-input select-unit"
                  value={estimate.terms.daysType}
                  onChange={(e) => handleTermsChange('daysType', e.target.value)}
                >
                  <option value="uteis">Dias Úteis</option>
                  <option value="corridos">Dias Corridos</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Validade da Proposta (Dias)</label>
              <input 
                type="number" 
                className="form-input" 
                value={estimate.terms.validityDays}
                onChange={(e) => handleTermsChange('validityDays', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Observações específicas */}
          <div className="form-group">
            <label className="form-label">Observações específicas da Estimativa (Opcional)</label>
            <textarea 
              className="form-input" 
              rows="3" 
              placeholder="Ex: Não contempla eletros, cubas ou tampos de granito."
              value={estimate.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Summary values prior to PDF preview */}
          <div className="realtime-total-banner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
            {!estimate.flatPrice && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b5a4b' }}>
                  <span>Móveis (material + mão de obra):</span>
                  <span>{formatCurrency(calculated.furnitureSubtotal)}</span>
                </div>
                {calculated.services.freight.cost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b5a4b' }}>
                    <span>Frete:</span>
                    <span>+{formatCurrency(calculated.services.freight.cost)}</span>
                  </div>
                )}
                {calculated.services.assembly.cost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b5a4b' }}>
                    <span>Montagem:</span>
                    <span>+{formatCurrency(calculated.services.assembly.cost)}</span>
                  </div>
                )}
                {calculated.services.installation.cost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b5a4b' }}>
                    <span>Instalação:</span>
                    <span>+{formatCurrency(calculated.services.installation.cost)}</span>
                  </div>
                )}
                {calculated.discount.value > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--status-expired-text)' }}>
                    <span>Desconto:</span>
                    <span>-{formatCurrency(calculated.discount.value)}</span>
                  </div>
                )}
                <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>{estimate.flatPrice ? 'Valor Total:' : 'Total:'}</span>
              <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
                {calculated.useRange ? (
                  <span style={{ fontSize: '1rem' }}>
                    {formatCurrency(calculated.range.min)} a {formatCurrency(calculated.range.max)}
                  </span>
                ) : (
                  <span>{formatCurrency(calculated.totalInvestment)}</span>
                )}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: PREVIEW & EXPORT */}
      {currentStep === 4 && (
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={20} style={{ color: 'var(--primary-color)' }} /> Visualização da Proposta
          </h2>
          
          <PdfProposal 
            estimate={estimate} 
            settings={settings} 
            onBack={prevStep}
          />
        </div>
      )}

      {/* Navigation Buttons (Except Step 4 which has its own edit button) */}
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

      {/* Save Button for step 4 */}
      {currentStep === 4 && (
        <div className="wizard-footer full" style={{ marginTop: '24px' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSaveAndExit}
            style={{ padding: '16px' }}
          >
            Salvar Estimativa e Voltar ao Menu
          </button>
        </div>
      )}
    </div>
  );
}
