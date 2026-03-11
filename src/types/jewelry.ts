export interface JewelryTradeProduct {
  name: string;
  hsCode: string;
  exports: number;
  imports: number;
}

export interface JewelryTradeData {
  year: number;
  totalExports: number;
  totalImports: number;
  tradeBalance: number;
  topProducts: JewelryTradeProduct[];
  yearlyTrend: { year: number; exports: number; imports: number }[];
}

export interface TraditionalJewelryData {
  traditions: string[];
  materials: string[];
  significance: string;
  marketRank: number;
}
