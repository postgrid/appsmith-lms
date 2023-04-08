export default {
		clearPicker_orders: async () => {
    await resetWidget("FilePicker1");
		storeValue('newList',undefined);
  },
	
	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
		await	get_current_tier.run();
		await	get_customer_order_details.run();
		await	get_invoicelist.run();
		await	get_list_of_collaterals.run();
		await	get_num_new_clients.run();
		await	get_printer_order_details.run();
		await	get_printerlist.run();
		await get_cheque_month_volume.run();
		await get_letter_month_volume.run();
		await get_postcard_month_volume.run();
  },
	autorefresh: async () => {
		setInterval(() => {get_invoicelist.run(),get_num_new_clients.run(),Query1.run(),get_custpricelist.run()}, 2000, "autoupdate");
  }
			
}