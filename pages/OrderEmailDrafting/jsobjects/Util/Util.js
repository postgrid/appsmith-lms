export default {
	clearPicker_orders: async () => {
		await resetWidget("FilePicker1");
		storeValue('newList',undefined);
	},

	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
	  await get_draftorders.run();
		//await	get_invoicelist.run();
		
	},
	getDraftOrdersForEmail: async() => {
		//get the information needed for the draft orders,
		const orderInfo = await get_draftorders.run();
		storeValue('emailDraft',orderInfo);
	}

}