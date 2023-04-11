export default {
	myFun1: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
	//	await Save_Data.run({currentRow});
		//await get_printer_order_details.run(()			=> { showAlert('Well done!.','success')}, () => {});

	} /*,
	myFun2: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		await Save_Data2.run({currentRow});
		await get_printer_order_details.run(()			=> { }, showAlert('Well done!.','success')}, () => {});
	}*/
}
