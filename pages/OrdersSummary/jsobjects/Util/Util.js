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
		setInterval(() => {
				get_letter_day_volume.run(),
get_cheque_day_volume.run(), get_postcard_day_volume.run(),get_num_new_clients.run(),
get_invoicelist_count.run()}, 3000, "autoupdate");
	}*/

}