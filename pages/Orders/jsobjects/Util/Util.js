export default {
	clearPicker_orders: async () => {
		await resetWidget("FilePicker1");
		storeValue('newList',undefined);
	},

	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
		storeValue('show','true')
		storeValue('show2','true')
		/*await	get_current_tier.run();
		await	get_customer_order_details.run();
		//await	get_invoicelist.run();
		await	get_list_of_collaterals.run();
		await	get_num_new_clients.run();
		await	get_printer_order_details.run();
		await	get_printerlist.run();
		await get_cheque_day_volume.run();
		await get_letter_day_volume.run();
		await get_postcard_day_volume.run();*/
	},
	autorefresh: async () => {
		setInterval(() => {
				get_letter_day_volume.run(),
get_cheque_day_volume.run(), get_postcard_day_volume.run(),get_num_new_clients.run()}, 3000, "autoupdate");
/*get_invoicelist_count.run()*/
	},
	selectedOrderGroup: async () => {
		await get_customer_order_details.run();
		console.log("JG get_customer_order_details", get_customer_order_details.data)
		await get_printer_order_details.run();
		console.log("JG get_printer_order_details", get_printer_order_details.data)
		await get_list_of_collaterals.run();
		console.log("JG get_list_of_collaterals", get_list_of_collaterals.data)
		await storeValue('org','f');
		console.log("JG storeValue", appsmith.store.org);
	}

}