/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  return sale_price * quantity * (1 - discount / 100);
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
    return +(profit * 0.15).toFixed(2);
  } else if (index === 1 || index === 2) {
    return +(profit * 0.1).toFixed(2);
  } else if (index === total - 1) {
    return 0;
  } else {
    // Для всех остальных
    return +(profit * 0.05).toFixed(2);
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
    data.sellers.length === 0 ||
    !Array.isArray(data.products) ||
    data.products.length === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций
  const { calculateRevenue, calculateBonus } = options;
  if (
    !typeof options === "object" ||
    !typeof calculateRevenue === "function" ||
    !typeof calculateBonus === "function"
  ) {
    throw new Error("Неверные параметры");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    data.sellers.map((item) => [item.id, item])
  );
  const productIndex = Object.fromEntries(
    data.products.map((item) => [item.sku, item])
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];

    sellerStats.map((item) => {
      if (item.id === seller.id) {
        item.sales_count++;
        item.revenue += +record.total_amount;
      }
    });

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      const cost = product.purchase_price * item.quantity;
      const rev = calculateRevenue(item);
      sellerStats.map((value) => {
        if (value.id === seller.id) {
          value.profit += rev - cost;
          if (!value.products_sold[item.sku]) {
            value.products_sold[item.sku] = 0;
          }

          value.products_sold[item.sku] += item.quantity;
        }
      });
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => (a.profit - b.profit) * -1);

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index, arr) => {
    seller.bonus = calculateBonus(index, arr.length, seller);
    seller.top_products = Object.entries(seller.products_sold)
      .sort((a, b) => b[1] - a[1])
      .filter((item, index) => index < 10)
      .flatMap((item) => {
        return { sku: item[0], quantity: item[1] };
      });
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: seller.bonus,
  }));
}
