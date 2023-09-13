export default {
	clearPicker_orders: async () => {
		await resetWidget("FilePicker1");
		await storeValue('newList',undefined);
	},

	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
		storeValue('show','true')
		storeValue('show2','true')
		await storeValue('customerItems',undefined);
		await storeValue('printerItems',undefined)
	},
	autorefresh: async () => {
		setInterval(() => {
				get_letter_day_volume.run(),
get_cheque_day_volume.run(), get_postcard_day_volume.run(),get_num_new_clients.run()}, 3000, "autoupdate");
/*get_invoicelist_count.run()*/
	},
	selectedOrderGroup: async () => {
		await get_customer_order_details.run();
		await get_printer_order_details.run();
		await get_list_of_collaterals.run();
		await storeValue('org','f');
	},
	getSelectedCustomerItems: async () => {
		await get_customer_order_details.run();
		const customerItems = await get_customer_order_details.data;
		const totalItem = customerItems.find(item => item.itemid === null)
		const parentItems = customerItems.filter(item => item.SubItemID === null && item.itemid !== null);
		const finalArray = [];
		let sort = 0;
		
		for(const parentItem of parentItems){
			const allItems = customerItems.filter(item => item.SubItemID === parentItem.itemid);
			finalArray.push({...parentItem, sort});
			sort += 1;
			for(const item of allItems){
				finalArray.push({...item, sort});
				sort += 1;
			}
		}
		finalArray.push(totalItem);

		await storeValue('customerItems',finalArray);
	},
	getSelectedPrinterItems: async () => {
		await get_printer_order_details.run();
		const printerItems = await get_printer_order_details.data;
		const totalItem = printerItems.find(item => item.Id === null);
		const parentItems = printerItems.filter(item => item.SubItemID === null && item.Id !==null);
		const finalArray = [];
		let sort = 0;
		
		for(const parentItem of parentItems){
			const allItems = printerItems.filter(item => item.SubItemID === parentItem.Id);
			finalArray.push({...parentItem, sort});
			sort += 1;
			for(const item of allItems){
				finalArray.push({...item, sort});
				sort += 1;
			}
		}
		finalArray.push(totalItem);

		await storeValue('printerItems',finalArray);
	}

}