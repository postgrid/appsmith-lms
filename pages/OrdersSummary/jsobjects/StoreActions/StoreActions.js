export default {
	
	onpage_init: async () => {
		storeValue('currency',get_forexchange.data.rates)
		await get_sales_summary.run();
		await get_kpi_metrics.run();
		await Query1.run();
		await Query2.run();
				storeValue('chartExpense',Query2.data.slice(-1)[0].ExpenseToUSD)
	}
}
