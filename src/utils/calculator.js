/**
 * Centralized utility for pricing calculations for preliminary furniture estimates.
 */

/**
 * Calculates a complete estimate breakdown based on items, conditions, and settings.
 * 
 * @param {Object} data - Estimate data
 * @param {Array} data.items - Array of items { id, description, quantity, unit, baseValue }
 * @param {number} [data.compositionMarkup] - Percentage markup on materials (e.g., 120)
 * @param {Object} [data.labor] - Labor info { type: 'percentage'|'fixed'|'unit', value: number }
 * @param {Array} [data.additionalCosts] - Array of { id, name, type: 'included'|'fixed'|'percentage'|'manual', value: number }
 * @param {Object} [data.discount] - Discount info { type: 'percentage'|'fixed', value: number }
 * @param {boolean} [data.useRange] - Whether to show a price range
 * @param {number} [data.safetyMargin] - Safety margin percentage (e.g., 5)
 * @param {Object} globalSettings - Global app settings (used as defaults)
 * @returns {Object} Calculation results
 */
export function calculateEstimate(data, globalSettings) {
  const items = data.items || [];
  
  // 1. Raw Material Sum
  const rawMaterialSum = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const base = parseFloat(item.baseValue) || 0;
    return sum + (qty * base);
  }, 0);

  // 2. Fator de Composição (Materials Markup)
  const compositionMarkup = data.compositionMarkup !== undefined 
    ? parseFloat(data.compositionMarkup) 
    : (parseFloat(globalSettings.compositionMarkup) ?? 120);
  
  const baseMaterials = rawMaterialSum * (1 + (compositionMarkup / 100));

  // 3. Mão de Obra
  const laborType = data.labor?.type || globalSettings.labor?.type || 'percentage';
  const laborValRaw = data.labor?.value !== undefined 
    ? parseFloat(data.labor.value) 
    : parseFloat(globalSettings.labor?.value ?? 100);
  
  let laborValue = 0;
  if (laborType === 'percentage') {
    laborValue = baseMaterials * (laborValRaw / 100);
  } else if (laborType === 'fixed') {
    laborValue = laborValRaw;
  } else if (laborType === 'unit') {
    // Sum of linear/square meters or units (excluding 'valor fechado' or treating as 1 unit)
    const totalUnits = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      return sum + qty;
    }, 0);
    laborValue = totalUnits * laborValRaw;
  }

  // 4. Custos Adicionais (Frete, Montagem, Instalação, etc.)
  const additionalCostsList = data.additionalCosts || [];
  const calculatedCosts = additionalCostsList.map(cost => {
    let costVal = 0;
    const rawVal = parseFloat(cost.value) || 0;
    
    if (cost.type === 'included') {
      costVal = 0;
    } else if (cost.type === 'fixed' || cost.type === 'manual') {
      costVal = rawVal;
    } else if (cost.type === 'percentage') {
      costVal = baseMaterials * (rawVal / 100);
    }

    return {
      id: cost.id,
      name: cost.name,
      type: cost.type,
      rawValue: rawVal,
      calculatedValue: costVal
    };
  });

  const additionalCostsSum = calculatedCosts.reduce((sum, cost) => sum + cost.calculatedValue, 0);

  // 5. Subtotal Bruto
  const subtotalBruto = baseMaterials + laborValue + additionalCostsSum;

  // 6. Desconto
  const discountType = data.discount?.type || 'fixed';
  const discountValRaw = parseFloat(data.discount?.value) || 0;
  let discountValue = 0;

  if (discountType === 'percentage') {
    discountValue = subtotalBruto * (discountValRaw / 100);
  } else if (discountType === 'fixed') {
    discountValue = discountValRaw;
  }
  
  // Prevent discount from being higher than subtotal
  const finalDiscount = Math.min(discountValue, subtotalBruto);

  // 7. Investimento Total
  const totalInvestment = subtotalBruto - finalDiscount;

  // 8. Faixa de Estimativa (Margem de Segurança)
  const useRange = data.useRange !== undefined 
    ? !!data.useRange 
    : !!globalSettings.useRange;
    
  const safetyMargin = data.safetyMargin !== undefined 
    ? parseFloat(data.safetyMargin) 
    : (parseFloat(globalSettings.safetyMargin) ?? 5);

  const minInvestment = totalInvestment * (1 - (safetyMargin / 100));
  const maxInvestment = totalInvestment * (1 + (safetyMargin / 100));

  return {
    rawMaterialSum,
    compositionMarkup,
    baseMaterials,
    labor: {
      type: laborType,
      rawValue: laborValRaw,
      value: laborValue
    },
    additionalCosts: calculatedCosts,
    additionalCostsSum,
    subtotalBruto,
    discount: {
      type: discountType,
      rawValue: discountValRaw,
      value: finalDiscount
    },
    totalInvestment,
    useRange,
    safetyMargin,
    range: {
      min: minInvestment,
      max: maxInvestment
    }
  };
}

/**
 * Format currency helper
 * @param {number} value 
 * @returns {string}
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}
