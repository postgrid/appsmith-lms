export default {
	clearPicker_orders: async () => {
		await resetWidget("FilePicker1");
		storeValue('newList',undefined);
	},

	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
	
		//await	get_invoicelist.run();
		
	},
	autorefresh: async () => {
		setInterval(() => {
				 }, 3000, "autoupdate");
/*get_invoicelist_count.run()*/
	}

}