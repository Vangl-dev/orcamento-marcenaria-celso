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
 * @param {Object} [data.services] - Services { freight: {type, value}, assembly: {type, value}, installation: {type, value} }
 * @param {boolean} [data.flatPrice] - Whether using flat price mode
 * @param {number} [data.flatTotalValue] - Total value in flat price mode
 * @param {Object} [data.discount] - Discount info { type: 'percentage'|'fixed', value: number }
 * @param {boolean} [data.useRange] - Whether to show a price range
 * @param {number} [data.safetyMargin] - Safety margin percentage (e.g., 5)
 * @param {Object} globalSettings - Global app settings (used as defaults)
 * @returns {Object} Calculation results
 */
export function calculateEstimate(data, globalSettings) {
  const items = data.items || [];
  const flatPrice = !!data.flatPrice;
  const flatTotalValue = parseFloat(data.flatTotalValue) || 0;
  
  // 1. Raw Material Sum
  const rawMaterialSum = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const base = parseFloat(item.baseValue) || 0;
    return sum + (qty * base);
  }, 0);

  // 2. Fator de Composição (Materials Markup)
  const compositionMarkup = data.compositionMarkup !== undefined 
    ? parseFloat(data.compositionMarkup) 
    : (parseFloat(globalSettings.pricing?.compositionMarkup) ?? 120);
  
  const baseMaterials = rawMaterialSum * (1 + (compositionMarkup / 100));

  // 3. Mão de Obra
  const laborType = data.labor?.type || globalSettings.pricing?.labor?.type || 'percentage';
  const laborValRaw = data.labor?.value !== undefined 
    ? parseFloat(data.labor.value) 
    : parseFloat(globalSettings.pricing?.labor?.value ?? 100);
  
  let laborValue = 0;
  if (laborType === 'percentage') {
    laborValue = baseMaterials * (laborValRaw / 100);
  } else if (laborType === 'fixed') {
    laborValue = laborValRaw;
  } else if (laborType === 'unit') {
    const totalUnits = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      return sum + qty;
    }, 0);
    laborValue = totalUnits * laborValRaw;
  }

  // 4. Serviços (Frete, Montagem, Instalação)
  const servicesData = data.services || {};
  const defaultServices = globalSettings.pricing?.services || {};
  
  const freightType = servicesData.freight?.type || defaultServices.freight?.type || 'included';
  const freightValue = parseFloat(servicesData.freight?.value) || parseFloat(defaultServices.freight?.value) || 0;
  
  const assemblyType = servicesData.assembly?.type || defaultServices.assembly?.type || 'included';
  const assemblyValue = parseFloat(servicesData.assembly?.value) || parseFloat(defaultServices.assembly?.value) || 0;
  
  const installationType = servicesData.installation?.type || defaultServices.installation?.type || 'included';
  const installationValue = parseFloat(servicesData.installation?.value) || parseFloat(defaultServices.installation?.value) || 0;

  const freightCost = freightType === 'included' ? 0 : freightValue;
  const assemblyCost = assemblyType === 'included' ? 0 : assemblyValue;
  const installationCost = installationType === 'included' ? 0 : installationValue;
  
  const servicesSum = freightCost + assemblyCost + installationCost;

  // 5. Subtotal (materiais + mão de obra + serviços)
  const furnitureSubtotal = baseMaterials + laborValue;
  const subtotalBruto = furnitureSubtotal + servicesSum;

  // 6. Desconto
  const discountType = data.discount?.type || 'fixed';
  const discountValRaw = parseFloat(data.discount?.value) || 0;
  let discountValue = 0;

  if (discountType === 'percentage') {
    discountValue = subtotalBruto * (discountValRaw / 100);
  } else if (discountType === 'fixed') {
    discountValue = discountValRaw;
  }
  
  const finalDiscount = Math.min(discountValue, subtotalBruto);

  // 7. Total
  const calculatedTotal = subtotalBruto - finalDiscount;
  const totalInvestment = flatPrice ? flatTotalValue : calculatedTotal;

  // 8. Faixa de Estimativa (Margem de Segurança)
  const useRange = !flatPrice && (data.useRange !== undefined 
    ? !!data.useRange 
    : !!globalSettings.pricing?.useRange);
    
  const safetyMargin = data.safetyMargin !== undefined 
    ? parseFloat(data.safetyMargin) 
    : (parseFloat(globalSettings.pricing?.safetyMargin) ?? 5);

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
    furnitureSubtotal,
    services: {
      freight: { type: freightType, value: freightValue, cost: freightCost },
      assembly: { type: assemblyType, value: assemblyValue, cost: assemblyCost },
      installation: { type: installationType, value: installationValue, cost: installationCost }
    },
    servicesSum,
    subtotalBruto,
    discount: {
      type: discountType,
      rawValue: discountValRaw,
      value: finalDiscount
    },
    calculatedTotal,
    flatPrice,
    flatTotalValue,
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
