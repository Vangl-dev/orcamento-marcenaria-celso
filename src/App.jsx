import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  PlusCircle, 
  Sliders, 
  WifiOff,
  Wrench,
  ScrollText
} from 'lucide-react';
import { 
  getSettings, 
  saveSettings, 
  getEstimates, 
  saveEstimates, 
  generateNextEstimateId,
  getContracts,
  saveContracts,
  generateNextContractId,
  createContractFromEstimate
} from './utils/storage';
import { calculateEstimate } from './utils/calculator';
import Dashboard from './components/Dashboard';
import EstimateWizard from './components/EstimateWizard';
import Settings from './components/Settings';
import ContractWizard from './components/ContractWizard';
import ContractsList from './components/ContractsList';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'wizard' | 'settings' | 'contracts' | 'contract-wizard'
  const [settings, setSettings] = useState(getSettings());
  const [estimates, setEstimates] = useState(getEstimates());
  const [contracts, setContracts] = useState(getContracts());
  const [currentEstimate, setCurrentEstimate] = useState(null); // Estimate being created/edited
  const [currentContract, setCurrentContract] = useState(null); // Contract being created/edited
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update dynamic CSS theme colors when settings change
  useEffect(() => {
    if (settings && settings.appearance) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', settings.appearance.primaryColor);
      root.style.setProperty('--secondary-color', settings.appearance.secondaryColor);
      root.style.setProperty('--text-color', settings.appearance.textColor);
      root.style.setProperty('--bg-color', settings.appearance.backgroundColor);
    }
  }, [settings]);

  // Actions: Navigation
  const handleNavigateToDashboard = () => {
    setActiveView('dashboard');
    setCurrentEstimate(null);
    setCurrentContract(null);
  };

  const handleNavigateToSettings = () => {
    setActiveView('settings');
    setCurrentEstimate(null);
    setCurrentContract(null);
  };

  const handleNavigateToContracts = () => {
    setActiveView('contracts');
    setCurrentEstimate(null);
    setCurrentContract(null);
  };

  // Actions: Estimate Lifecycle
  const handleCreateNewEstimate = () => {
    const nextId = generateNextEstimateId(estimates);
    setCurrentEstimate({
      id: nextId,
      date: new Date().toISOString().split('T')[0],
      status: 'rascunho',
      client: { name: '', whatsapp: '', email: '', address: '' },
      items: [],
      compositionMarkup: settings.pricing.compositionMarkup,
      labor: { ...settings.pricing.labor },
      additionalCosts: JSON.parse(JSON.stringify(settings.pricing.additionalCosts)),
      discount: { type: 'fixed', value: 0 },
      useRange: settings.pricing.useRange,
      safetyMargin: settings.pricing.safetyMargin,
      terms: { ...settings.terms },
      notes: ''
    });
    setActiveView('wizard');
  };

  const handleEditEstimate = (estimate) => {
    setCurrentEstimate(JSON.parse(JSON.stringify(estimate))); // deep clone
    setActiveView('wizard');
  };

  const handleDeleteEstimate = (id) => {
    const updated = estimates.filter(est => est.id !== id);
    setEstimates(updated);
    saveEstimates(updated);
  };

  const handleStatusChange = (id, newStatus) => {
    const updated = estimates.map(est => 
      est.id === id ? { ...est, status: newStatus } : est
    );
    setEstimates(updated);
    saveEstimates(updated);
  };

  const handleSaveEstimate = (estimateData) => {
    let updated;
    const exists = estimates.some(est => est.id === estimateData.id);
    
    if (exists) {
      updated = estimates.map(est => est.id === estimateData.id ? estimateData : est);
    } else {
      updated = [estimateData, ...estimates];
    }
    
    setEstimates(updated);
    saveEstimates(updated);
    setActiveView('dashboard');
    setCurrentEstimate(null);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    const success = saveSettings(newSettings);
    return success;
  };

  // Actions: Contract Lifecycle
  const handleCreateNewContract = () => {
    const nextId = generateNextContractId(contracts);
    const newContract = {
      id: nextId,
      date: new Date().toISOString().split('T')[0],
      status: 'rascunho',
      estimateReference: '',
      origin: 'direct',
      client: { name: '', whatsapp: '', email: '', address: '', cpf: '' },
      items: [],
      totalValue: 0,
      discount: { type: 'fixed', value: 0 },
      services: {
        freight: { type: settings.pricing.services?.freight?.type || 'included', value: settings.pricing.services?.freight?.value || 0 },
        assembly: { type: settings.pricing.services?.assembly?.type || 'included', value: settings.pricing.services?.assembly?.value || 0 },
        installation: { type: settings.pricing.services?.installation?.type || 'included', value: settings.pricing.services?.installation?.value || 0 }
      },
      contractTerms: {
        paymentMethod: settings.contractDefaults?.payment?.paymentType || 'entrada_saldo',
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
    };
    setCurrentContract(newContract);
    setActiveView('contract-wizard');
  };

  const handleConvertEstimateToContract = (estimate) => {
    const calculated = calculateEstimate(estimate, settings);
    const newContract = createContractFromEstimate(estimate, calculated, settings);
    newContract.id = generateNextContractId(contracts);
    setCurrentContract(newContract);
    setActiveView('contract-wizard');
  };

  const handleEditContract = (contract) => {
    setCurrentContract(JSON.parse(JSON.stringify(contract)));
    setActiveView('contract-wizard');
  };

  const handleDeleteContract = (id) => {
    const updated = contracts.filter(c => c.id !== id);
    setContracts(updated);
    saveContracts(updated);
  };

  const handleContractStatusChange = (id, newStatus) => {
    const updated = contracts.map(c => 
      c.id === id ? { ...c, status: newStatus } : c
    );
    setContracts(updated);
    saveContracts(updated);
  };

  const handleSaveContract = (contractData) => {
    let updated;
    const exists = contracts.some(c => c.id === contractData.id);
    
    if (exists) {
      updated = contracts.map(c => c.id === contractData.id ? contractData : c);
    } else {
      updated = [contractData, ...contracts];
    }
    
    setContracts(updated);
    saveContracts(updated);
    setActiveView('contracts');
    setCurrentContract(null);
  };

  return (
    <div className="app-container">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="offline-banner">
          <WifiOff size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Modo Offline Ativo — Orçamentos salvos localmente
        </div>
      )}

      {/* Main Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-circle">
            <Wrench size={16} />
          </div>
          <span className="brand-name">{settings.company.name}</span>
        </div>
        
        {activeView !== 'wizard' && (
          <div className="header-actions">
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)', backgroundColor: 'var(--secondary-color)', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', opacity: 0.85 }}>
              PRO
            </span>
          </div>
        )}
      </header>

      {/* Main Views Router */}
      <main className="main-content">
        {activeView === 'dashboard' && (
          <Dashboard 
            estimates={estimates}
            settings={settings}
            onCreateNew={handleCreateNewEstimate}
            onEdit={handleEditEstimate}
            onDelete={handleDeleteEstimate}
            onStatusChange={handleStatusChange}
            onConvertToContract={handleConvertEstimateToContract}
          />
        )}

        {activeView === 'wizard' && (
          <EstimateWizard 
            initialEstimate={currentEstimate}
            settings={settings}
            onSave={handleSaveEstimate}
            onCancel={handleNavigateToDashboard}
          />
        )}

        {activeView === 'contracts' && (
          <ContractsList
            contracts={contracts}
            estimates={estimates}
            settings={settings}
            onCreateNew={handleCreateNewContract}
            onConvertFromEstimate={handleConvertEstimateToContract}
            onEdit={handleEditContract}
            onDelete={handleDeleteContract}
            onStatusChange={handleContractStatusChange}
          />
        )}

        {activeView === 'contract-wizard' && (
          <ContractWizard
            initialContract={currentContract}
            settings={settings}
            onSave={handleSaveContract}
            onCancel={handleNavigateToContracts}
          />
        )}

        {activeView === 'settings' && (
          <Settings 
            settings={settings}
            onSave={handleSaveSettings}
          />
        )}
      </main>

      {/* Bottom Sticky Tabs (Hidden in Wizard to save screen space) */}
      {activeView !== 'wizard' && activeView !== 'contract-wizard' && (
        <nav className="bottom-nav">
          <button 
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={handleNavigateToDashboard}
          >
            <FileText size={20} />
            <span>Orçamentos</span>
          </button>
          
          <button 
            className="nav-item"
            onClick={handleCreateNewEstimate}
            style={{ color: 'var(--primary-color)' }}
          >
            <PlusCircle size={24} />
            <span style={{ fontWeight: 700 }}>Novo</span>
          </button>
          
          <button 
            className={`nav-item ${activeView === 'contracts' ? 'active' : ''}`}
            onClick={handleNavigateToContracts}
          >
            <ScrollText size={20} />
            <span>Contratos</span>
          </button>
          
          <button 
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={handleNavigateToSettings}
          >
            <Sliders size={20} />
            <span>Ajustes</span>
          </button>
        </nav>
      )}
    </div>
  );
}
