/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const discountRate = purchase.discount / 100;
  const discountCoefficient = 1 - discountRate;
  const revenue = purchase.sale_price * purchase.quantity * discountCoefficient;
  return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;
  if (index === 0) {
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error(
      "Некорректные входные данные: отсутствуют или пустые коллекции sellers, products или purchase_records",
    );
  }

  // @TODO: Проверка наличия опций
  if (!options || typeof options !== "object") {
    throw new Error("Отсутствуют опции или они имеют неверный формат");
  }
  const { calculateRevenue, calculateBonus } = options;
  if (!calculateRevenue || typeof calculateRevenue !== "function") {
    throw new Error(
      "Функция calculateRevenue не передана или не является функцией",
    );
  }
  if (!calculateBonus || typeof calculateBonus !== "function") {
    throw new Error(
      "Функция calculateBonus не передана или не является функцией",
    );
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id, // ID продавца
    name: `${seller.first_name} ${seller.last_name}`, // Полное имя
    revenue: 0, // Общая выручка
    profit: 0, // Общая прибыль
    sales_count: 0, // Количество продаж
    products_sold: {}, // Объект для учета проданных товаров {sku: quantity}
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = sellerStats.reduce((acc, seller) => {
    acc[seller.id] = seller;
    return acc;
  }, {});
  const productIndex = data.products.reduce((acc, product) => {
    acc[product.sku] = product;
    return acc;
  }, {});

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;
    seller.sales_count += 1;
    seller.revenue += record.total_amount;
    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;
      const cost = product.purchase_price * item.quantity;
      const revenue = calculateRevenue(item, product);
      const profit = revenue - cost;
      seller.profit += profit;
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  const sortedSellers = sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  sortedSellers.forEach((seller, index) => {
    const total = sortedSellers.length;
    seller.bonus = calculateBonus(index, total, seller);
    const productsArray = Object.entries(seller.products_sold).map(
      ([sku, quantity]) => ({
        sku: sku,
        quantity: quantity,
      }),
    );
    productsArray.sort((a, b) => b.quantity - a.quantity);
    seller.top_products = productsArray.slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  const report = sortedSellers.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: Number(seller.revenue.toFixed(2)), // Округляем до 2 знаков
    profit: Number(seller.profit.toFixed(2)), // Округляем до 2 знаков
    sales_count: seller.sales_count, // Целое число
    top_products: seller.top_products, // Массив топ-10 товаров
    bonus: Number(seller.bonus.toFixed(2)), // Округляем до 2 знаков
  }));
  // Возвращаем итоговый отчет
  return report;
}
