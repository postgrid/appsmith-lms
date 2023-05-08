export default {
	myFun1: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		await Save_Data.run({currentRow});
		await get_customer_order_details.run();
		await get_printer_order_details.run(()			=> { showAlert('Well done!.','success')}, () => {});

	},
	myFun2: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		await Save_Data2.run({currentRow});
		await get_customer_order_details.run();
		await get_printer_order_details.run(()			=> { get_letter_day_volume.run(),
get_cheque_day_volume.run(), get_postcard_day_volume.run(), showAlert('Well done!.','success')}, () => {});
	},
	
	conversion: async () => {
		storeValue('currency',get_forexchange.data.rates)
	},
			runvolume: async () => {
 		await get_pivot_expense.run();
		await get_pivot_income.run();
		
	}
}
