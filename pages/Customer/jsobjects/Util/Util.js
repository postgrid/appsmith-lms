export default {
		clearPicker_orders: async () => {
    await resetWidget("FilePicker1");
		storeValue('newList',undefined);
  },
	
	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
  }/*,
	autorefresh: async () => {
		setInterval(() => {get_invoicelist.run(),get_num_new_clients.run(),Query1.run(),get_custpricelist.run()}, 2000, "autoupdate");
  }*/
			
}