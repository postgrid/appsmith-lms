export default {
	
	onpage_init: async () => {
		storeValue('currency',get_forexchange.data.rates)
		await get_sales_summary.run();
		await get_kpi_metrics.run();
	}
}
